alter table if exists public.asset_hardware_save
  add column if not exists mac_address text,
  add column if not exists ip_address text;
