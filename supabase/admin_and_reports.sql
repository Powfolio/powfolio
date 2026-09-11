-- Pow3Folio trust and safety schema (no dollar-quoting).
-- Prefer supabase/chunks/*.sql and run 01 through 09 in order.
-- Then: Authentication -> Hooks -> Custom Access Token = public.custom_access_token_hook
-- Then: Authentication -> Multi-Factor -> enable TOTP
-- Then add SUPABASE_SERVICE_ROLE_KEY and ADMIN_BOOTSTRAP_EMAILS on Vercel.

-- CHUNK 01: account status on profiles
alter table public.profiles
  add column if not exists account_status text not null default 'active';

alter table public.profiles drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended', 'under_review'));

-- CHUNK 02: admin, reports, and signup rate-limit tables
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  actor_email text,
  action text not null,
  target_user_id uuid,
  target_username text,
  report_id uuid,
  reason text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_user_id, created_at desc);

create table if not exists public.report_groups (
  id uuid primary key default gen_random_uuid(),
  reported_id uuid not null references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  report_count integer not null default 0,
  latest_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists report_groups_reported_idx on public.report_groups (reported_id, latest_at desc);

create table if not exists public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.report_groups(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reasons text[] not null default '{}',
  note text not null,
  attachments text[] not null default '{}',
  status text not null default 'pending',
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profile_reports drop constraint if exists profile_reports_status_check;
alter table public.profile_reports
  add constraint profile_reports_status_check
  check (status in ('pending', 'reviewed', 'actioned', 'dismissed'));

create index if not exists profile_reports_reporter_day_idx on public.profile_reports (reporter_id, created_at desc);
create index if not exists profile_reports_target_idx on public.profile_reports (reported_id, created_at desc);
create index if not exists profile_reports_status_idx on public.profile_reports (status, created_at desc);

create table if not exists public.signup_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists signup_attempts_ip_idx on public.signup_attempts (ip_hash, created_at desc);

-- CHUNK 03: is_admin helper
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as '
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  )
  or coalesce((auth.jwt() -> ''app_metadata'' ->> ''role''), '''') = ''admin''
  or coalesce((auth.jwt() ->> ''user_role''), '''') = ''admin'';
';

-- CHUNK 04: JWT custom access token hook
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as '
declare
  claims jsonb;
  uid uuid;
begin
  uid := (event->>''user_id'')::uuid;
  claims := event->''claims'';
  if exists (select 1 from public.admin_users where user_id = uid) then
    claims := jsonb_set(claims, ''{app_metadata}'', coalesce(claims->''app_metadata'', ''{}''::jsonb) || jsonb_build_object(''role'', ''admin''), true);
    claims := jsonb_set(claims, ''{user_role}'', ''"admin"'', true);
  end if;
  event := jsonb_set(event, ''{claims}'', claims);
  return event;
end;
';

revoke all on function public.custom_access_token_hook(jsonb) from public;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on table public.admin_users to supabase_auth_admin;

-- CHUNK 05: prevent the same wallet on two accounts
create or replace function public.prevent_duplicate_wallets()
returns trigger
language plpgsql
security definer
set search_path = public
as '
declare
  addr text;
  extra jsonb;
  taken boolean;
begin
  addr := lower(coalesce(new.wallet_address, ''''));
  if addr <> '''' then
    select exists (
      select 1 from public.profiles p
      where p.id <> new.id
        and (
          lower(coalesce(p.wallet_address, '''')) = addr
          or exists (
            select 1
            from jsonb_array_elements(coalesce(p.extra_wallets, ''[]''::jsonb)) w
            where lower(coalesce(w->>''address'', '''')) = addr
          )
        )
    ) into taken;
    if taken then
      raise exception ''WALLET_TAKEN'' using errcode = ''23505'';
    end if;
  end if;

  for extra in select * from jsonb_array_elements(coalesce(new.extra_wallets, ''[]''::jsonb))
  loop
    addr := lower(coalesce(extra->>''address'', ''''));
    if addr = '''' then continue; end if;
    select exists (
      select 1 from public.profiles p
      where p.id <> new.id
        and (
          lower(coalesce(p.wallet_address, '''')) = addr
          or exists (
            select 1
            from jsonb_array_elements(coalesce(p.extra_wallets, ''[]''::jsonb)) w
            where lower(coalesce(w->>''address'', '''')) = addr
          )
        )
    ) into taken;
    if taken then
      raise exception ''WALLET_TAKEN'' using errcode = ''23505'';
    end if;
  end loop;
  return new;
end;
';

drop trigger if exists profiles_prevent_duplicate_wallets on public.profiles;
create trigger profiles_prevent_duplicate_wallets
before insert or update of wallet_address, extra_wallets
on public.profiles
for each row
execute function public.prevent_duplicate_wallets();

create or replace function public.find_wallet_owner(addr text)
returns table(owner_id uuid, owner_username text)
language sql
stable
security definer
set search_path = public
as '
  select p.id, p.username
  from public.profiles p
  where length(coalesce(addr, '''')) >= 20
    and (
      lower(coalesce(p.wallet_address, '''')) = lower(addr)
      or exists (
        select 1
        from jsonb_array_elements(coalesce(p.extra_wallets, ''[]''::jsonb)) w
        where lower(coalesce(w->>''address'', '''')) = lower(addr)
      )
    )
  limit 1;
';

grant execute on function public.find_wallet_owner(text) to service_role, authenticated;

-- CHUNK 06: row level security
alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.report_groups enable row level security;
alter table public.profile_reports enable row level security;
alter table public.signup_attempts enable row level security;

drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self on public.admin_users
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists audit_admin_select on public.admin_audit_log;
create policy audit_admin_select on public.admin_audit_log
  for select using (public.is_admin());

drop policy if exists reports_no_client_read on public.profile_reports;
create policy reports_no_client_read on public.profile_reports
  for select using (false);

drop policy if exists groups_no_client_read on public.report_groups;
create policy groups_no_client_read on public.report_groups
  for select using (false);

drop policy if exists signup_attempts_no_client on public.signup_attempts;
create policy signup_attempts_no_client on public.signup_attempts
  for all using (false) with check (false);

-- CHUNK 07: when an account is suspended, pending reports become actioned
create or replace function public.action_reports_on_account_status()
returns trigger
language plpgsql
security definer
set search_path = public
as '
begin
  if new.account_status in (''suspended'') and old.account_status is distinct from new.account_status then
    update public.profile_reports
      set status = ''actioned'',
          resolved_at = now()
      where reported_id = new.id
        and status in (''pending'', ''reviewed'');
  end if;
  return new;
end;
';

drop trigger if exists profiles_action_reports_on_status on public.profiles;
create trigger profiles_action_reports_on_status
after update of account_status
on public.profiles
for each row
execute function public.action_reports_on_account_status();
