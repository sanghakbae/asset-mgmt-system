alter table public.asset_assets
add column if not exists expires_at date,
add column if not exists note text;

alter table public.asset_hardware
add column if not exists asset_id uuid references public.asset_assets(id) on delete cascade;

create index if not exists asset_hardware_asset_id_idx on public.asset_hardware(asset_id);

alter table public.asset_software
add column if not exists asset_id uuid references public.asset_assets(id) on delete cascade,
add column if not exists user_name text,
add column if not exists department text,
add column if not exists assigned_quantity integer not null default 1,
add column if not exists assigned_at timestamptz not null default now();

create index if not exists asset_software_asset_id_idx on public.asset_software(asset_id);
create index if not exists asset_software_user_name_idx on public.asset_software(user_name);

update public.asset_hardware ah
set asset_id = aa.id
from public.asset_assets aa
where ah.asset_id is null
  and aa.type = 'hardware'
  and aa.asset_code = ah.asset_code;

update public.asset_software aso
set asset_id = aa.id,
    software_name = coalesce(aso.software_name, aa.software_name, aa.name)
from public.asset_assets aa
where aso.asset_id is null
  and aa.type = 'software'
  and aa.asset_code = aso.asset_code;
