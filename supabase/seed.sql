-- Demo seed. All accounts use the password: pisanielistow
create function public._seed_user(
  p_id uuid, p_email text, p_name text, p_age public.age_range, p_channel public.channel,
  p_city text, p_address text, p_bio text, p_interests text[], p_languages text[] default '{polski}'
) returns void language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('pisanielistow', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true), 'email', now(), now(), now());
  -- profiles / private_profiles rows were created by the on_auth_user_created trigger
  update public.profiles set name = p_name, age_range = p_age, channel = p_channel, bio = p_bio,
    interests = p_interests, languages = p_languages where id = p_id;
  update public.private_profiles set city = p_city, postal_address = p_address where id = p_id;
end $$;

select public._seed_user('00000000-0000-0000-0000-000000000101', 'kuba@penpal.test', 'Kuba', '18-25', 'APP',
  'Kraków', 'ul. Długa 5/3, 31-147 Kraków',
  'Studiuję historię. Lubię stare zdjęcia Krakowa i podróże pociągiem. Chętnie posłucham, jak kiedyś wyglądało życie.',
  '{Książki,Historia,Podróże,Fotografia}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000102', 'ola@penpal.test', 'Ola', '18-25', 'APP',
  'Kraków', 'ul. Szkolna 2, 30-001 Kraków',
  'Jestem w drużynie harcerskiej, robimy projekt o historii Krakowa.',
  '{Historia,Muzyka,Rękodzieło,Przyroda}');
select public._seed_user('00000000-0000-0000-0000-000000000201', 'halina@penpal.test', 'Halina', '60-75', 'PAPER',
  'Kraków', 'ul. Lipowa 7/2, 30-702 Kraków',
  'Emerytowana polonistka. Lubię wspominać i słuchać.',
  '{Książki,Historia,Ogród,Gotowanie}');
select public._seed_user('00000000-0000-0000-0000-000000000202', 'tadeusz@penpal.test', 'Tadeusz', '75+', 'PAPER',
  'Kraków', 'ul. Józefa 14/1, 31-056 Kraków',
  'Przez 50 lat fotografowałem Kraków. Chętnie opowiem, jak wyglądał Kazimierz, gdy byłem młody.',
  '{Fotografia,Historia,Szachy i gry}');
select public._seed_user('00000000-0000-0000-0000-000000000203', 'krystyna@penpal.test', 'Krystyna', '60-75', 'APP',
  'Kraków', 'ul. Kolejowa 3/9, 31-000 Kraków',
  'Zwiedziłam pół Europy pociągiem.',
  '{Podróże,Książki,Języki obce}', '{polski,niemiecki}');
select public._seed_user('00000000-0000-0000-0000-000000000204', 'zofia@penpal.test', 'Zofia', '60-75', 'PAPER',
  'Kraków', 'ul. Ogrodowa 11, 30-500 Kraków',
  'Hoduję pomidory na balkonie i piekę najlepszy sernik na Podgórzu.',
  '{Ogród,Gotowanie,Muzyka,Książki}');
select public._seed_user('00000000-0000-0000-0000-000000000205', 'stanislaw@penpal.test', 'Stanisław', '75+', 'PAPER',
  'Kraków', 'os. Centrum A 4/12, 31-923 Kraków',
  'Grałem na trąbce w orkiestrze huty. Kibicuję Wiśle od zawsze.',
  '{Historia,Muzyka,Sport,Podróże}');
select public._seed_user('00000000-0000-0000-0000-000000000206', 'barbara@penpal.test', 'Barbara', '75+', 'PAPER',
  'Tarnów', 'ul. Wałowa 1, 33-100 Tarnów',
  'Robię na drutach i oglądam stare filmy.',
  '{Rękodzieło,Przyroda,Film}');

drop function public._seed_user;

-- Pairings (user_a_id = inviter)
insert into public.pairings (id, user_a_id, user_b_id, pal_kod, status, created_at) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'PP-7K3D', 'ACTIVE', now() - interval '30 days'),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202', 'PP-4MWR', 'ACTIVE', now() - interval '20 days'),
  ('00000000-0000-0000-0000-00000000a003', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000101', 'PP-9XQT', 'INVITED', now() - interval '1 day');

-- Letters, relative to now() so the demo always looks fresh
insert into public.letters (pairing_id, sender_id, kind, body, delivery_channel, sent_at, deliver_at, read_at) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000201', 'TYPED',
   E'Drogi Kubo,\n\nnazywam się Halina i przez czterdzieści lat uczyłam polskiego. Cieszę się, że będziemy do siebie pisać.\n\nCo lubisz czytać?',
   'APP', now() - interval '23 days', now() - interval '21 days', now() - interval '21 days'),
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000101', 'TYPED',
   E'Droga Halino,\n\ndziękuję za list! Wysyłam Ci zdjęcie Wisły o świcie. Jaka jest Twoja ulubiona książka?',
   'PAPER', now() - interval '11 days', now() - interval '9 days', null),
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000201', 'TYPED',
   E'Kraków, 28 września\n\nDrogi Kubo,\n\ndziękuję Ci za list i za zdjęcie Wisły o świcie. Przypomniało mi lato 1968, kiedy z siostrą pływałyśmy łódką aż pod Tyniec.\n\nPytałeś o ulubioną książkę — to „Lalka”. Czytałam ją trzy razy i za każdym razem kibicowałam komuś innemu.\n\nA Ty co teraz czytasz?',
   'APP', now() - interval '4 days', now() - interval '2 days', null),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-000000000101', 'TYPED',
   E'Drogi Tadeuszu,\n\nczy pamiętasz, jak wyglądał plac Nowy w latach sześćdziesiątych?',
   'PAPER', now() - interval '6 hours', now() + interval '2 days' - interval '6 hours', null);

-- Kraków points (fictional names, real coordinates)
insert into public.points (type, name, address, lat, lng, hours, can_send, can_collect, pickup_note, phone) values
  ('PALPOINT', 'Klub Seniora „Pod Lipami”', 'ul. Przykładowa 12, Kraków', 50.0536, 19.9349,
   '[null,["10:00","18:00"],["10:00","18:00"],["10:00","18:00"],["10:00","18:00"],["10:00","18:00"],["10:00","14:00"]]',
   true, true, 'Listy skanujemy codziennie o 17:00.', '+48120000001'),
  ('PALPOINT', 'Biblioteka „Pod Arkadami”', 'ul. Książkowa 3, Kraków', 50.0647, 19.9450,
   '[null,["09:00","19:00"],["09:00","19:00"],["09:00","19:00"],["09:00","19:00"],["09:00","19:00"],["10:00","15:00"]]',
   true, true, 'Listy skanujemy codziennie o 18:00.', '+48120000002'),
  ('PALPOINT', 'Kawiarnia „Pocztówka”', 'ul. Kawowa 8, Kraków', 50.0672, 19.9205,
   '[["10:00","16:00"],["08:00","20:00"],["08:00","20:00"],["08:00","20:00"],["08:00","20:00"],["08:00","20:00"],["09:00","20:00"]]',
   true, false, 'Listy odbieramy codziennie o 16:00.', '+48120000003'),
  ('PALPOINT', 'Dom Kultury „Dębniki”', 'ul. Kulturalna 21, Kraków', 50.0478, 19.9187,
   '[null,["12:00","20:00"],["12:00","20:00"],["12:00","20:00"],["12:00","20:00"],["12:00","20:00"],null]',
   true, true, 'Listy skanujemy codziennie o 19:00.', '+48120000004'),
  ('PALBOX', 'PalBox Rynek Podgórski', 'Rynek Podgórski, Kraków', 50.0443, 19.9495,
   '[["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"]]',
   true, false, 'Opróżniamy codziennie o 15:00.', null),
  ('PALBOX', 'PalBox Kazimierz', 'pl. Nowy, Kraków', 50.0515, 19.9447,
   '[["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"]]',
   true, false, 'Opróżniamy codziennie o 16:00.', null),
  ('PALBOX', 'PalBox Nowa Huta', 'os. Centrum A, Kraków', 50.0717, 20.0377,
   '[["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"]]',
   true, false, 'Opróżniamy codziennie o 14:00.', null);
