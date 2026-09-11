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
