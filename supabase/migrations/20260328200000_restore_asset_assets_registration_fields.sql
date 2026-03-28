alter table public.asset_assets
  add column if not exists software_name text,
  add column if not exists unit_price numeric(14, 2) not null default 0,
  add column if not exists acquired_at date,
  add column if not exists expires_at date,
  add column if not exists note text;
