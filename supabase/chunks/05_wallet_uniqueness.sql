-- CHUNK 05: prevent the same wallet on two accounts
-- Covers profiles.wallet_address and extra_wallets JSON.

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
