alter table public.asset_assets
add column if not exists software_name text;

update public.asset_assets
set software_name = name
where type = 'software'
  and coalesce(software_name, '') = ''
  and coalesce(name, '') <> '';
