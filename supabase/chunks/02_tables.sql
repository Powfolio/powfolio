-- CHUNK 02: admin, reports, and signup rate-limit tables
-- Safe to re-run.

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
