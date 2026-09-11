-- CHUNK 09: promote yourself as Super Admin
-- Edit the emails, then run once.

insert into public.admin_users (user_id, email)
select id, email
from auth.users
where lower(email) in (
  'you@example.com'
)
on conflict (user_id) do nothing;
