create table if not exists public.hardware_assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text not null unique,
  user_name text,
  department text,
  status text not null default '유휴',
  category text not null,
  pc_name text,
  os text,
  mac_address text,
  ip_address text,
  serial_number text,
  manufacturer text,
  location text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.software_assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text not null unique,
  software_name text not null,
  category text not null,
  vendor text,
  license_key text,
  total_seats integer not null default 0 check (total_seats >= 0),
  available_seats integer not null default 0 check (available_seats >= 0),
  expires_at date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.software_asset_assignments (
  id uuid primary key default gen_random_uuid(),
  software_asset_id uuid not null references public.software_assets(id) on delete cascade,
  user_name text not null,
  department text,
  assigned_seats integer not null default 1 check (assigned_seats > 0),
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hardware_assets_status_idx on public.hardware_assets(status);
create index if not exists hardware_assets_user_name_idx on public.hardware_assets(user_name);
create index if not exists software_assets_software_name_idx on public.software_assets(software_name);
create index if not exists software_asset_assignments_software_asset_id_idx on public.software_asset_assignments(software_asset_id);
create index if not exists software_asset_assignments_user_name_idx on public.software_asset_assignments(user_name);

drop trigger if exists hardware_assets_set_updated_at on public.hardware_assets;
create trigger hardware_assets_set_updated_at
before update on public.hardware_assets
for each row
execute function public.asset_set_updated_at();

drop trigger if exists software_assets_set_updated_at on public.software_assets;
create trigger software_assets_set_updated_at
before update on public.software_assets
for each row
execute function public.asset_set_updated_at();

drop trigger if exists software_asset_assignments_set_updated_at on public.software_asset_assignments;
create trigger software_asset_assignments_set_updated_at
before update on public.software_asset_assignments
for each row
execute function public.asset_set_updated_at();

alter table public.hardware_assets enable row level security;
alter table public.software_assets enable row level security;
alter table public.software_asset_assignments enable row level security;

drop policy if exists "hardware_assets_all_authenticated" on public.hardware_assets;
create policy "hardware_assets_all_authenticated"
on public.hardware_assets
for all
to authenticated
using (true)
with check (true);

drop policy if exists "software_assets_all_authenticated" on public.software_assets;
create policy "software_assets_all_authenticated"
on public.software_assets
for all
to authenticated
using (true)
with check (true);

drop policy if exists "software_asset_assignments_all_authenticated" on public.software_asset_assignments;
create policy "software_asset_assignments_all_authenticated"
on public.software_asset_assignments
for all
to authenticated
using (true)
with check (true);
