alter table public.profiles add column scan_consent boolean not null default false, add column consented_at timestamptz;
