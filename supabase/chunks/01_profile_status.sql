-- CHUNK 01: account status on profiles
-- Safe to re-run.

alter table public.profiles
  add column if not exists account_status text not null default 'active';

alter table public.profiles drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended', 'under_review'));
