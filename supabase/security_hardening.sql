-- POWFOLIO database security hardening
-- Applied to production on 2026-10-22.
-- This file records the live hardening changes for reproducibility.

-- Remove legacy public/base-table profile access. Public profiles are exposed
-- through the server-side profiles_public view only.
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists profiles_public_select on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists profiles_owner_insert on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (
  username, display_name, bio, long_bio, avatar_url, banner_url,
  open_to_work, wallet_address, ens_name, x_url, discord_url, telegram_url,
  github_url, website_url, secondary_email, primary_email,
  show_primary_email, show_secondary_email, location_country, location_region,
  skills, show_writing, show_trading, show_community, show_airdrops,
  show_nfts, show_credentials, work_experience, education, trading_platforms,
  ai_chat_history, show_dust_tokens, extra_wallets, custom_chains,
  public_chain_ids, imported_tokens, is_public, cv_notes
) on table public.profiles to authenticated;

-- The public profile view is an allowlisted view. It is no longer exposed to
-- Data API clients; server-side code reads it with the service-role client.
alter view public.profiles_public set (security_invoker = true);
revoke all on table public.profiles_public from anon, authenticated;

-- Internal trigger/RPC helpers are not client-callable.
revoke execute on function public.action_reports_on_account_status() from public, anon, authenticated;
revoke execute on function public.find_wallet_owner(text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon, authenticated;
revoke execute on function public.log_profile_activity() from public, anon, authenticated;
revoke execute on function public.mark_profile_snapshot_pending() from public, anon, authenticated;
revoke execute on function public.prevent_duplicate_wallets() from public, anon, authenticated;
revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.trim_user_activity() from public, anon, authenticated;

-- Pin function search paths to eliminate search_path hijacking risk.
alter function public.action_reports_on_account_status() set search_path = '';
alter function public.find_wallet_owner(text) set search_path = '';
alter function public.handle_new_user() set search_path = '';
alter function public.log_profile_activity() set search_path = '';
alter function public.mark_profile_snapshot_pending() set search_path = '';
alter function public.prevent_duplicate_wallets() set search_path = '';
alter function public.rate_limit_hit(text, integer, integer) set search_path = '';
alter function public.rls_auto_enable() set search_path = 'pg_catalog';
alter function public.set_updated_at() set search_path = '';
alter function public.trim_user_activity() set search_path = '';
alter function public.custom_access_token_hook(jsonb) set search_path = '';

-- Stop future application-owned objects from being automatically exposed.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;
alter default privileges for role postgres
  revoke execute on functions from public;

-- Move admin-check logic out of the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
  or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((select auth.jwt() ->> 'user_role'), '') = 'admin';
$$;

revoke all on function private.is_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_admin() to authenticated;

drop policy if exists audit_admin_select on public.admin_audit_log;
create policy audit_admin_select on public.admin_audit_log
  for select to authenticated
  using ((select private.is_admin()));

drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self on public.admin_users
  for select to authenticated
  using ((user_id = (select auth.uid())) or (select private.is_admin()));

drop function if exists public.is_admin();
