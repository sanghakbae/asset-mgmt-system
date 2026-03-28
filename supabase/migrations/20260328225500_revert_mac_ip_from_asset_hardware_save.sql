alter table if exists public.asset_hardware_save
  drop column if exists mac_address,
  drop column if exists ip_address;
