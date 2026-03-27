create extension if not exists pgcrypto;

create table if not exists public.asset_assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text unique,
  name text not null,
  type text not null check (type in ('hardware', 'software')),
  category text not null,
  status text not null,
  unit_price numeric(14, 2) not null default 0,
  quantity integer not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  department text not null,
  role text not null check (role in ('User', 'Viewer', 'Manager', 'Admin')),
  joined_at timestamptz not null default now(),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_org_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text not null default '',
  category text not null default '',
  cell text not null default '',
  unit text not null default '',
  part text not null default '',
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_asset_users (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.asset_assets(id) on delete restrict,
  name text not null,
  email text not null,
  department text not null,
  position text not null,
  assigned_quantity integer not null default 1 check (assigned_quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_audit_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  actor text not null,
  action text not null,
  target text not null,
  ip text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.asset_policy_settings (
  id uuid primary key default gen_random_uuid(),
  hardware_categories text[] not null default array['노트북', '서버', '네트워크', '보안장비', '스토리지'],
  software_categories text[] not null default array['OS', '데이터베이스', '보안', '개발툴', '미들웨어'],
  hardware_prefix text not null default 'H',
  software_prefix text not null default 'S',
  sequence_digits integer not null default 3 check (sequence_digits > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_security_settings (
  id uuid primary key default gen_random_uuid(),
  allowed_domain text not null default 'company.com',
  session_timeout text not null default '60분',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.asset_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.next_asset_code(target_type text)
returns text
language plpgsql
as $$
declare
  prefix text;
  digits integer;
  next_number integer;
begin
  select
    case
      when target_type = 'hardware' then hardware_prefix
      when target_type = 'software' then software_prefix
      else null
    end,
    sequence_digits
  into prefix, digits
  from public.asset_policy_settings
  order by created_at asc
  limit 1;

  if prefix is null then
    if target_type = 'hardware' then
      prefix := 'H';
    elsif target_type = 'software' then
      prefix := 'S';
    else
      raise exception 'Unsupported asset type: %', target_type;
    end if;
    digits := 3;
  end if;

  select coalesce(max(substring(asset_code from length(prefix) + 2)::integer), 0) + 1
    into next_number
  from public.asset_assets
  where type = target_type
    and asset_code like prefix || '-%';

  return prefix || '-' || lpad(next_number::text, digits, '0');
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

drop trigger if exists asset_assets_set_updated_at on public.asset_assets;
create trigger asset_assets_set_updated_at
before update on public.asset_assets
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_members_set_updated_at on public.asset_members;
create trigger asset_members_set_updated_at
before update on public.asset_members
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_org_members_set_updated_at on public.asset_org_members;
create trigger asset_org_members_set_updated_at
before update on public.asset_org_members
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_asset_users_set_updated_at on public.asset_asset_users;
create trigger asset_asset_users_set_updated_at
before update on public.asset_asset_users
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_policy_settings_set_updated_at on public.asset_policy_settings;
create trigger asset_policy_settings_set_updated_at
before update on public.asset_policy_settings
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_security_settings_set_updated_at on public.asset_security_settings;
create trigger asset_security_settings_set_updated_at
before update on public.asset_security_settings
for each row
execute function public.asset_set_updated_at();

insert into public.asset_policy_settings (hardware_categories, software_categories, hardware_prefix, software_prefix, sequence_digits)
select
  array['노트북', '서버', '네트워크', '보안장비', '스토리지'],
  array['OS', '데이터베이스', '보안', '개발툴', '미들웨어'],
  'H',
  'S',
  3
where not exists (
  select 1 from public.asset_policy_settings
);

insert into public.asset_security_settings (allowed_domain, session_timeout)
select 'company.com', '60분'
where not exists (
  select 1 from public.asset_security_settings
);

alter table public.asset_assets enable row level security;
alter table public.asset_members enable row level security;
alter table public.asset_org_members enable row level security;
alter table public.asset_asset_users enable row level security;
alter table public.asset_audit_logs enable row level security;
alter table public.asset_policy_settings enable row level security;
alter table public.asset_security_settings enable row level security;

drop policy if exists "asset_assets_select_authenticated" on public.asset_assets;
create policy "asset_assets_select_authenticated"
on public.asset_assets
for select
to authenticated
using (true);

drop policy if exists "asset_assets_insert_authenticated" on public.asset_assets;
create policy "asset_assets_insert_authenticated"
on public.asset_assets
for insert
to authenticated
with check (true);

drop policy if exists "asset_assets_update_authenticated" on public.asset_assets;
create policy "asset_assets_update_authenticated"
on public.asset_assets
for update
to authenticated
using (true)
with check (true);

drop policy if exists "asset_assets_delete_authenticated" on public.asset_assets;
create policy "asset_assets_delete_authenticated"
on public.asset_assets
for delete
to authenticated
using (true);

drop policy if exists "asset_members_all_authenticated" on public.asset_members;
create policy "asset_members_all_authenticated"
on public.asset_members
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_org_members_all_authenticated" on public.asset_org_members;
create policy "asset_org_members_all_authenticated"
on public.asset_org_members
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_asset_users_all_authenticated" on public.asset_asset_users;
create policy "asset_asset_users_all_authenticated"
on public.asset_asset_users
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_audit_logs_all_authenticated" on public.asset_audit_logs;
create policy "asset_audit_logs_all_authenticated"
on public.asset_audit_logs
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_policy_settings_all_authenticated" on public.asset_policy_settings;
create policy "asset_policy_settings_all_authenticated"
on public.asset_policy_settings
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_security_settings_all_authenticated" on public.asset_security_settings;
create policy "asset_security_settings_all_authenticated"
on public.asset_security_settings
for all
to authenticated
using (true)
with check (true);
