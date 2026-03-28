alter table public.asset_members
add column if not exists last_login_ip text;
