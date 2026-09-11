-- CHUNK 04: JWT custom access token hook
-- After this runs: Authentication -> Hooks -> Custom Access Token
-- point at public.custom_access_token_hook

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
