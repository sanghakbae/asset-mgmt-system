begin;

create extension if not exists pgcrypto;

create table if not exists public.asset_assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text unique,
  name text not null,
  type text not null check (type in ('hardware', 'software')),
  category text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create or replace function public.next_asset_code(target_type text)
returns text
language plpgsql
as $$
declare
  prefix text;
  next_number integer;
begin
  if target_type = 'hardware' then
    prefix := 'H';
  elsif target_type = 'software' then
    prefix := 'S';
  else
    raise exception 'Unsupported asset type: %', target_type;
  end if;

  select coalesce(max(substring(asset_code from 3)::integer), 0) + 1
    into next_number
  from public.asset_assets
  where type = target_type;

  return prefix || '-' || lpad(next_number::text, 3, '0');
end;
$$;

create or replace function public.assign_asset_code()
returns trigger
language plpgsql
as $$
begin
  if new.asset_code is null or new.asset_code = '' then
    new.asset_code := public.next_asset_code(new.type);
  end if;
  return new;
end;
$$;

drop trigger if exists asset_assets_assign_asset_code on public.asset_assets;

create trigger asset_assets_assign_asset_code
before insert on public.asset_assets
for each row
execute function public.assign_asset_code();

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'assets'
  ) then
    insert into public.asset_assets (asset_code, name, type, category, status, created_at)
    select
      coalesce(asset_code, id),
      name,
      type,
      category,
      status,
      coalesce(created_at, now())
    from public.assets
    on conflict (asset_code) do nothing;
  end if;
end $$;

alter table public.asset_assets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'asset_assets'
      and policyname = 'Allow read asset assets for authenticated users'
  ) then
    create policy "Allow read asset assets for authenticated users"
    on public.asset_assets
    for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'asset_assets'
      and policyname = 'Allow insert asset assets for authenticated users'
  ) then
    create policy "Allow insert asset assets for authenticated users"
    on public.asset_assets
    for insert
    to authenticated
    with check (true);
  end if;
end $$;

commit;
