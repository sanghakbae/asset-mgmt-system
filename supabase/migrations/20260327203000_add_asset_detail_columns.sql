alter table public.asset_assets
add column if not exists os text,
add column if not exists pc_name text,
add column if not exists assignee text,
add column if not exists department text,
add column if not exists mac_address text,
add column if not exists ip_address text,
add column if not exists note text;
