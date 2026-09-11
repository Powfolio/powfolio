-- CHUNK 03: is_admin helper
-- Uses single-quoted function body so paste cannot strip dollar quotes.

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
