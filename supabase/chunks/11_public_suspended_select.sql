-- CHUNK 11: visitors can SELECT a suspended profile so /username renders the overlay.
-- Additive. Does not drop existing profile policies. Safe to re-run.

drop policy if exists profiles_suspended_select on public.profiles;

create policy profiles_suspended_select
  on public.profiles
  for select
  to anon, authenticated
  using (coalesce(account_status, 'active') = 'suspended');
