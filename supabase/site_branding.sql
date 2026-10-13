-- Site logo and CV watermark. Safe to re-run.
-- Public can read. Only the server writes.

create table if not exists public.site_branding (
  id int primary key default 1,
  logo_url text,
  watermark_mode text not null default 'text',
  watermark_text text not null default 'POWFOLIO.XYZ',
  watermark_url text,
  watermark_x numeric not null default 50,
  watermark_y numeric not null default 50,
  watermark_rotate numeric not null default -24,
  watermark_opacity numeric not null default 0.2,
  watermark_scale numeric not null default 1,
  updated_at timestamptz not null default now(),
  constraint site_branding_one check (id = 1)
);

alter table public.site_branding enable row level security;
drop policy if exists site_branding_public_read on public.site_branding;
create policy site_branding_public_read on public.site_branding
  for select to anon, authenticated
  using (true);
revoke insert, update, delete on public.site_branding from anon, authenticated;

insert into public.site_branding (id) values (1) on conflict (id) do nothing;

alter table public.site_branding add column if not exists watermark_scale numeric not null default 1;
alter table public.site_branding add column if not exists mark_url text;
