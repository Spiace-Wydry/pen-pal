-- Enums -----------------------------------------------------------------
create type public.age_range as enum ('18-25', '26-40', '41-60', '60-75', '75+');
create type public.channel as enum ('PAPER', 'APP');
create type public.pairing_status as enum ('INVITED', 'ACTIVE', 'ENDED', 'BLOCKED');
create type public.letter_kind as enum ('TYPED', 'SCAN');
create type public.point_type as enum ('PALPOINT', 'PALBOX');

-- Profiles (visible to pen pals) ----------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  name text check (char_length(name) <= 40),
  age_range public.age_range,
  channel public.channel,
  bio text not null default '' check (char_length(bio) <= 300),
  languages text[] not null default '{polski}',
  interests text[] not null default '{}' check (cardinality(interests) <= 8),
  is_premium boolean not null default false,
  notify_new_letter boolean not null default true,
  notify_delivered boolean not null default true,
  created_at timestamptz not null default now()
);

-- Private profile data: owner + service role only -----------------------
create table public.private_profiles (
  id uuid primary key references public.profiles on delete cascade,
  city text,
  postal_address text
);

-- Pairings: user_a_id is the inviter ------------------------------------
create table public.pairings (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles on delete cascade,
  user_b_id uuid not null references public.profiles on delete cascade,
  pal_kod text not null unique check (pal_kod ~ '^PP-[A-HJ-NP-Z2-9]{4}$'),
  status public.pairing_status not null default 'INVITED',
  created_at timestamptz not null default now(),
  check (user_a_id <> user_b_id)
);
-- "Not previously paired": one pairing per pair of people, ever.
create unique index pairings_one_per_pair on public.pairings (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id));

-- Letters: delivery state is derived from sent_at / deliver_at ----------
create table public.letters (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  kind public.letter_kind not null,
  body text check (char_length(body) <= 5000),
  image_paths text[] not null default '{}',
  delivery_channel public.channel not null,
  sent_at timestamptz not null default now(),
  deliver_at timestamptz not null default now() + interval '2 days',
  read_at timestamptz,
  check ((kind = 'TYPED' and body is not null) or (kind = 'SCAN' and cardinality(image_paths) > 0))
);
create index letters_pairing on public.letters (pairing_id, sent_at desc);

-- PalPoints and PalBoxes ------------------------------------------------
-- hours: 7 entries indexed like JS getDay() (0 = Sunday), each ["HH:MM","HH:MM"] or null (closed).
create table public.points (
  id uuid primary key default gen_random_uuid(),
  type public.point_type not null,
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  hours jsonb not null,
  can_send boolean not null default true,
  can_collect boolean not null default false,
  pickup_note text,
  phone text
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings on delete cascade,
  reporter_id uuid not null references public.profiles on delete cascade,
  reason text not null,
  details text check (char_length(details) <= 1000),
  created_at timestamptz not null default now()
);

-- New auth user → empty profile rows ------------------------------------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.private_profiles (id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: defence in depth (the app itself reads through the service role) --
alter table public.profiles enable row level security;
alter table public.private_profiles enable row level security;
alter table public.pairings enable row level security;
alter table public.letters enable row level security;
alter table public.points enable row level security;
alter table public.reports enable row level security;

create policy "read own profile" on public.profiles for select using (id = auth.uid());
create policy "read pen pal profiles" on public.profiles for select using (
  exists (select 1 from public.pairings p
          where p.status in ('INVITED', 'ACTIVE')
            and ((p.user_a_id = auth.uid() and p.user_b_id = profiles.id)
              or (p.user_b_id = auth.uid() and p.user_a_id = profiles.id))));

-- email and the premium/notify flags are server-only (service role); pen pals and owners never read them via the client.
revoke select on public.profiles from anon, authenticated;
grant select (id, name, age_range, channel, bio, languages, interests, created_at) on public.profiles to authenticated;

create policy "own private profile" on public.private_profiles for all using (id = auth.uid()) with check (id = auth.uid());

create policy "read my pairings" on public.pairings for select using (auth.uid() in (user_a_id, user_b_id));

create policy "read delivered letters in my pairings" on public.letters for select using (
  exists (select 1 from public.pairings p where p.id = letters.pairing_id and auth.uid() in (p.user_a_id, p.user_b_id))
  and (sender_id = auth.uid() or deliver_at <= now()));

create policy "points are public" on public.points for select using (true);

create policy "file own reports" on public.reports for insert with check (reporter_id = auth.uid());

-- Storage: private bucket for scans/photos. No client policies: only the
-- service role (server routes) uploads and signs URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('letters', 'letters', false, 8388608, array['image/jpeg', 'image/png']);
