-- CHUNK 10: suspension fields, soft delete, appeals, activity log
-- Safe to re-run. No dollar-quoting.

alter table public.profiles
  add column if not exists original_username text,
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists delete_after timestamptz;

alter table public.profiles drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended', 'under_review', 'deleted'));

create table if not exists public.account_appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  username text,
  email text,
  grounds text not null,
  statement text not null,
  contact_email text,
  attachments text[] not null default '{}',
  status text not null default 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists account_appeals_status_idx on public.account_appeals (status, created_at desc);
create index if not exists account_appeals_user_idx on public.account_appeals (user_id, created_at desc);

alter table public.account_appeals drop constraint if exists account_appeals_status_check;
alter table public.account_appeals
  add constraint account_appeals_status_check
  check (status in ('pending', 'under_review', 'approved', 'denied'));

alter table public.account_appeals enable row level security;

drop policy if exists "appeals_owner_insert" on public.account_appeals;
create policy "appeals_owner_insert"
  on public.account_appeals for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "appeals_owner_select" on public.account_appeals;
create policy "appeals_owner_select"
  on public.account_appeals for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  username text,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists user_activity_user_idx on public.user_activity (user_id, created_at desc);

alter table public.user_activity enable row level security;

drop policy if exists "activity_owner_select" on public.user_activity;
create policy "activity_owner_select"
  on public.user_activity for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.account_appeals from anon;
revoke all on public.user_activity from anon;
grant select, insert on public.account_appeals to authenticated;
grant select on public.user_activity to authenticated;

create or replace function public.trim_user_activity()
returns trigger
language plpgsql
security definer
as '
begin
  delete from public.user_activity
  where id in (
    select id from public.user_activity
    where user_id = new.user_id
    order by created_at desc
    offset 100
  );
  return new;
end;
';

drop trigger if exists trg_trim_user_activity on public.user_activity;
create trigger trg_trim_user_activity
after insert on public.user_activity
for each row execute function public.trim_user_activity();

create or replace function public.log_profile_activity()
returns trigger
language plpgsql
security definer
as '
begin
  if tg_op = ''UPDATE'' then
    insert into public.user_activity (user_id, username, action, detail)
    values (new.id, new.username, ''profile_update'', ''Updated profile fields'');
  end if;
  return new;
end;
';

drop trigger if exists trg_log_profile_activity on public.profiles;
create trigger trg_log_profile_activity
after update on public.profiles
for each row execute function public.log_profile_activity();
