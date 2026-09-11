-- CHUNK 06: row level security
-- Clients cannot read reports, audit, signup attempts, or evidence.

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
