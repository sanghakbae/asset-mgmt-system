create table if not exists public.asset_hardware_save (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  unit_price numeric(14, 2) not null default 0,
  acquired_at date,
  quantity integer not null default 0 check (quantity >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_software_save (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  software_name text not null,
  unit_price numeric(14, 2) not null default 0,
  quantity integer not null default 0 check (quantity >= 0),
  expires_at date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger asset_hardware_save_set_updated_at
before update on public.asset_hardware_save
for each row
execute function public.asset_set_updated_at();

create trigger asset_software_save_set_updated_at
before update on public.asset_software_save
for each row
execute function public.asset_set_updated_at();

alter table public.asset_hardware
  drop constraint if exists asset_hardware_asset_id_fkey,
  add constraint asset_hardware_asset_id_fkey
    foreign key (asset_id) references public.asset_hardware_save(id) on delete cascade;

alter table public.asset_software
  drop constraint if exists asset_software_asset_id_fkey,
  add constraint asset_software_asset_id_fkey
    foreign key (asset_id) references public.asset_software_save(id) on delete cascade;

alter table public.asset_hardware_save enable row level security;
alter table public.asset_software_save enable row level security;

create policy "asset_hardware_save_all_authenticated"
on public.asset_hardware_save
for all
to authenticated
using (true)
with check (true);

create policy "asset_software_save_all_authenticated"
on public.asset_software_save
for all
to authenticated
using (true)
with check (true);
