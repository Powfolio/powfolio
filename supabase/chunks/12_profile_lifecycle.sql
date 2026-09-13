-- CHUNK 12: profile snapshots, history, deleted archive, legal hold, pending batch
-- Safe to re-run. No dollar-quoting.

alter table public.profiles
  add column if not exists deletion_state text not null default 'active',
  add column if not exists legal_hold boolean not null default false,
  add column if not exists legal_hold_reason text,
  add column if not exists legal_hold_at timestamptz,
  add column if not exists legal_hold_by uuid,
  add column if not exists last_snapshot_at timestamptz,
  add column if not exists last_monthly_snapshot_at timestamptz,
  add column if not exists purge_at timestamptz;

update public.profiles
set purge_at = delete_after
where purge_at is null and delete_after is not null;

update public.profiles
set deletion_state = 'deleted_pending_retention'
where account_status = 'deleted'
  and deletion_state = 'active';

alter table public.profiles drop constraint if exists profiles_deletion_state_check;
alter table public.profiles
  add constraint profiles_deletion_state_check
  check (deletion_state in (
    'active',
    'deletion_requested',
    'final_snapshot_created',
    'deactivated',
    'deleted_pending_retention',
    'legal_hold',
    'purge_pending',
    'permanently_deleted'
  ));

alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended', 'under_review', 'deleted', 'purged'));

create table if not exists public.profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  version integer not null,
  kind text not null default 'event',
  change_type text,
  change_section text,
  actor_kind text not null default 'user',
  actor_id uuid,
  is_final boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  media_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, version)
);

create index if not exists profile_snapshots_user_idx
  on public.profile_snapshots (user_id, version desc);
create index if not exists profile_snapshots_kind_idx
  on public.profile_snapshots (user_id, kind, created_at desc);

alter table public.profile_snapshots drop constraint if exists profile_snapshots_kind_check;
alter table public.profile_snapshots
  add constraint profile_snapshots_kind_check
  check (kind in ('event', 'monthly', 'final_deletion', 'admin'));

create table if not exists public.profile_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  snapshot_id uuid references public.profile_snapshots(id) on delete set null,
  version integer,
  change_type text not null,
  change_section text,
  previous_value jsonb,
  new_value jsonb,
  actor_kind text not null default 'user',
  actor_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists profile_history_user_idx
  on public.profile_history (user_id, created_at desc);

create table if not exists public.deleted_profile_archive (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  original_username text,
  reserved_username text,
  deleted_at timestamptz not null default now(),
  purge_at timestamptz not null,
  deletion_status text not null default 'deleted_pending_retention',
  deleted_by uuid,
  deletion_reason text,
  final_snapshot_id uuid references public.profile_snapshots(id) on delete set null,
  legal_hold boolean not null default false,
  legal_hold_reason text,
  legal_hold_at timestamptz,
  legal_hold_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deleted_profile_archive_purge_idx
  on public.deleted_profile_archive (purge_at)
  where legal_hold = false;

alter table public.deleted_profile_archive drop constraint if exists deleted_archive_status_check;
alter table public.deleted_profile_archive
  add constraint deleted_archive_status_check
  check (deletion_status in (
    'deleted_pending_retention',
    'legal_hold',
    'purge_pending',
    'permanently_deleted',
    'restored'
  ));

create table if not exists public.profile_snapshot_pending (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  change_types text[] not null default '{}',
  change_sections text[] not null default '{}',
  last_change_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.profile_snapshots enable row level security;
alter table public.profile_history enable row level security;
alter table public.deleted_profile_archive enable row level security;
alter table public.profile_snapshot_pending enable row level security;

revoke all on public.profile_snapshots from anon, authenticated;
revoke all on public.profile_history from anon, authenticated;
revoke all on public.deleted_profile_archive from anon, authenticated;
revoke all on public.profile_snapshot_pending from anon, authenticated;

create or replace function public.mark_profile_snapshot_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as '
declare
  uid uuid;
  section text;
  change text;
begin
  if tg_table_name = ''profiles'' then
    uid := new.id;
    section := ''profile'';
    change := ''profile_updated'';
    if tg_op = ''UPDATE''
       and new.account_status is distinct from old.account_status
       and (
         new.bio is not distinct from old.bio
         and new.long_bio is not distinct from old.long_bio
         and new.display_name is not distinct from old.display_name
         and new.username is not distinct from old.username
         and new.avatar_url is not distinct from old.avatar_url
         and new.banner_url is not distinct from old.banner_url
         and new.skills is not distinct from old.skills
         and new.wallet_address is not distinct from old.wallet_address
         and new.extra_wallets is not distinct from old.extra_wallets
       ) then
      return new;
    end if;
  else
    uid := coalesce(new.user_id, old.user_id);
    section := tg_table_name;
    if tg_op = ''INSERT'' then change := tg_table_name || ''_added'';
    elsif tg_op = ''DELETE'' then change := tg_table_name || ''_removed'';
    else change := tg_table_name || ''_updated'';
    end if;
  end if;

  if uid is null then
    return coalesce(new, old);
  end if;

  insert into public.profile_snapshot_pending (user_id, change_types, change_sections, last_change_at)
  values (uid, array[change], array[section], now())
  on conflict (user_id) do update
    set last_change_at = now(),
        change_types = (
          select array(
            select distinct x from unnest(
              public.profile_snapshot_pending.change_types || excluded.change_types
            ) as x
          )
        ),
        change_sections = (
          select array(
            select distinct x from unnest(
              public.profile_snapshot_pending.change_sections || excluded.change_sections
            ) as x
          )
        );

  return coalesce(new, old);
end;
';

drop trigger if exists trg_snap_pending_profiles on public.profiles;
create trigger trg_snap_pending_profiles
after insert or update on public.profiles
for each row execute function public.mark_profile_snapshot_pending();

drop trigger if exists trg_snap_pending_writings on public.writings;
create trigger trg_snap_pending_writings
after insert or update or delete on public.writings
for each row execute function public.mark_profile_snapshot_pending();

drop trigger if exists trg_snap_pending_trades on public.trades;
create trigger trg_snap_pending_trades
after insert or update or delete on public.trades
for each row execute function public.mark_profile_snapshot_pending();

drop trigger if exists trg_snap_pending_trade_updates on public.trade_updates;
create trigger trg_snap_pending_trade_updates
after insert or update or delete on public.trade_updates
for each row execute function public.mark_profile_snapshot_pending();

drop trigger if exists trg_snap_pending_community on public.community_items;
create trigger trg_snap_pending_community
after insert or update or delete on public.community_items
for each row execute function public.mark_profile_snapshot_pending();

drop trigger if exists trg_snap_pending_airdrops on public.airdrops;
create trigger trg_snap_pending_airdrops
after insert or update or delete on public.airdrops
for each row execute function public.mark_profile_snapshot_pending();

drop trigger if exists trg_snap_pending_collectibles on public.collectibles;
create trigger trg_snap_pending_collectibles
after insert or update or delete on public.collectibles
for each row execute function public.mark_profile_snapshot_pending();

drop trigger if exists trg_snap_pending_credentials on public.credentials;
create trigger trg_snap_pending_credentials
after insert or update or delete on public.credentials
for each row execute function public.mark_profile_snapshot_pending();
