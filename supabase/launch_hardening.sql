-- Launch hardening. Safe to re-run.
-- CV notes, durable rate limits, and profile row security.

alter table public.profiles add column if not exists cv_notes jsonb default '{}'::jsonb;

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count int;
begin
  insert into public.rate_limits(key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set count = case
          when public.rate_limits.reset_at <= now() then 1
          else public.rate_limits.count + 1
        end,
        reset_at = case
          when public.rate_limits.reset_at <= now() then now() + make_interval(secs => p_window_seconds)
          else public.rate_limits.reset_at
        end
  returning count into next_count;
  return next_count <= p_limit;
end;
$$;

revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;

alter table public.profiles enable row level security;

drop policy if exists profiles_owner_select on public.profiles;
create policy profiles_owner_select on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_public_select on public.profiles;
create policy profiles_public_select on public.profiles
  for select to anon, authenticated
  using (
    coalesce(is_public, false) = true
    and deleted_at is null
    and coalesce(account_status, 'active') not in ('deleted', 'purged')
  );

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_owner_insert on public.profiles;
create policy profiles_owner_insert on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- Proof tables stay readable when a row is marked visible, and editable only by the owner.
do $$
declare
  t text;
begin
  foreach t in array array['writings','trades','community_items','airdrops','collectibles','credentials']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_owner_all', t
    );
    execute format('drop policy if exists %I on public.%I', t || '_public_select', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (coalesce(is_visible, false) = true)',
      t || '_public_select', t
    );
  end loop;
end $$;
