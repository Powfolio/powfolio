-- Login email is public by default. At least one email must stay visible.
alter table public.profiles
  alter column show_primary_email set default true;

update public.profiles
set show_primary_email = true
where coalesce(show_primary_email, false) = false
  and coalesce(show_secondary_email, false) = false;
