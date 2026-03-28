alter table public.asset_hardware_save
  add column if not exists os text,
  add column if not exists vendor text;
