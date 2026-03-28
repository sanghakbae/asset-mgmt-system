create extension if not exists pgcrypto;

create table if not exists public.asset_assets (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('hardware', 'software')),
  category text not null,
  software_name text,
  unit_price numeric(14, 2) not null default 0,
  acquired_at date,
  expires_at date,
  quantity integer not null default 0 check (quantity >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_hardware_save (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  os text,
  vendor text,
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

create table if not exists public.asset_hardware (
  id uuid primary key default gen_random_uuid(),
  asset_code text not null unique,
  asset_id uuid references public.asset_hardware_save(id) on delete cascade,
  user_name text,
  department text,
  status text not null default '유휴',
  category text not null,
  unit_price numeric(14, 2) not null default 0,
  acquired_at date,
  pc_name text,
  os text,
  mac_address text,
  ip_address text,
  serial_number text,
  manufacturer text,
  location text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_software (
  id uuid primary key default gen_random_uuid(),
  asset_code text not null unique,
  asset_id uuid references public.asset_software_save(id) on delete cascade,
  software_name text not null,
  user_name text,
  department text,
  assigned_quantity integer not null default 1 check (assigned_quantity > 0),
  assigned_at timestamptz not null default now(),
  status text not null default '운영',
  category text not null,
  unit_price numeric(14, 2) not null default 0,
  vendor text,
  license_key text,
  total_seats integer not null default 0 check (total_seats >= 0),
  available_seats integer not null default 0 check (available_seats >= 0),
  expires_at date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.software_asset_assignments (
  id uuid primary key default gen_random_uuid(),
  software_asset_id uuid not null references public.asset_software(id) on delete cascade,
  user_name text not null,
  department text,
  assigned_seats integer not null default 1 check (assigned_seats > 0),
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  note text,
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
  hardware_categories text[] not null default array['모니터', '랩탑', '데스크탑'],
  software_categories text[] not null default array['OS', '데이터베이스', '보안', '개발툴', '미들웨어'],
  hardware_prefix text not null default 'H',
  software_prefix text not null default 'S',
  hardware_category_prefixes jsonb not null default '{"모니터":"M","랩탑":"L","데스크탑":"D"}'::jsonb,
  software_category_prefixes jsonb not null default '{"OS":"S","데이터베이스":"S","보안":"S","개발툴":"S","미들웨어":"S"}'::jsonb,
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

create or replace function public.get_split_asset_prefix(target_type text, asset_category text default null)
returns text
language plpgsql
as $$
declare
  prefix text;
  category_prefixes jsonb;
begin
  select
    case
      when target_type = 'hardware' then hardware_prefix
      when target_type = 'software' then software_prefix
      else null
    end,
    case
      when target_type = 'hardware' then hardware_category_prefixes
      when target_type = 'software' then software_category_prefixes
      else '{}'::jsonb
    end
  into prefix, category_prefixes
  from public.asset_policy_settings
  order by created_at asc
  limit 1;

  if asset_category is not null and asset_category <> '' and coalesce(category_prefixes, '{}'::jsonb) ? asset_category then
    prefix := nullif(category_prefixes ->> asset_category, '');
  end if;

  if prefix is null then
    if target_type = 'hardware' then
      return 'H';
    elsif target_type = 'software' then
      return 'S';
    end if;
    raise exception 'Unsupported asset type: %', target_type;
  end if;

  return prefix;
end;
$$;

create or replace function public.next_split_asset_code(target_type text, asset_category text default null)
returns text
language plpgsql
as $$
declare
  prefix text;
  digits integer;
  next_number integer;
begin
  select
    sequence_digits
  into digits
  from public.asset_policy_settings
  order by created_at asc
  limit 1;

  prefix := public.get_split_asset_prefix(target_type, asset_category);

  if digits is null then
    digits := 3;
  end if;

  if target_type = 'hardware' then
    select coalesce(max(substring(asset_code from length(prefix) + 2)::integer), 0) + 1
      into next_number
    from public.asset_hardware
    where asset_code like prefix || '-%';
  elsif target_type = 'software' then
    select coalesce(max(substring(asset_code from length(prefix) + 2)::integer), 0) + 1
      into next_number
    from public.asset_software
    where asset_code like prefix || '-%';
  else
    raise exception 'Unsupported asset type: %', target_type;
  end if;

  return prefix || '-' || lpad(next_number::text, digits, '0');
end;
$$;

create or replace function public.assign_hardware_asset_code()
returns trigger
language plpgsql
as $$
begin
  if new.asset_code is null or new.asset_code = '' then
    new.asset_code := public.next_split_asset_code('hardware', new.category);
  end if;
  return new;
end;
$$;

create or replace function public.assign_software_asset_code()
returns trigger
language plpgsql
as $$
begin
  if new.asset_code is null or new.asset_code = '' then
    new.asset_code := public.next_split_asset_code('software', new.category);
  end if;
  return new;
end;
$$;

create or replace function public.refresh_split_asset_code_on_category_change()
returns trigger
language plpgsql
as $$
declare
  next_prefix text;
begin
  if coalesce(new.category, '') = coalesce(old.category, '') then
    return new;
  end if;

  next_prefix := public.get_split_asset_prefix(
    case
      when tg_table_name = 'asset_hardware' then 'hardware'
      when tg_table_name = 'asset_software' then 'software'
      else null
    end,
    new.category
  );

  if next_prefix is null then
    return new;
  end if;

  if new.asset_code is null or new.asset_code = '' or new.asset_code not like next_prefix || '-%' then
    new.asset_code := public.next_split_asset_code(
      case
        when tg_table_name = 'asset_hardware' then 'hardware'
        when tg_table_name = 'asset_software' then 'software'
        else null
      end,
      new.category
    );
  end if;

  return new;
end;
$$;

drop trigger if exists asset_assets_set_updated_at on public.asset_assets;
create trigger asset_assets_set_updated_at
before update on public.asset_assets
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_hardware_save_set_updated_at on public.asset_hardware_save;
create trigger asset_hardware_save_set_updated_at
before update on public.asset_hardware_save
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_software_save_set_updated_at on public.asset_software_save;
create trigger asset_software_save_set_updated_at
before update on public.asset_software_save
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_hardware_set_updated_at on public.asset_hardware;
drop trigger if exists asset_hardware_assign_asset_code on public.asset_hardware;
drop trigger if exists asset_hardware_refresh_asset_code on public.asset_hardware;
create trigger asset_hardware_assign_asset_code
before insert on public.asset_hardware
for each row
execute function public.assign_hardware_asset_code();

create trigger asset_hardware_refresh_asset_code
before update on public.asset_hardware
for each row
execute function public.refresh_split_asset_code_on_category_change();

create trigger asset_hardware_set_updated_at
before update on public.asset_hardware
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_software_set_updated_at on public.asset_software;
drop trigger if exists asset_software_assign_asset_code on public.asset_software;
drop trigger if exists asset_software_refresh_asset_code on public.asset_software;
create trigger asset_software_assign_asset_code
before insert on public.asset_software
for each row
execute function public.assign_software_asset_code();

create trigger asset_software_refresh_asset_code
before update on public.asset_software
for each row
execute function public.refresh_split_asset_code_on_category_change();

create trigger asset_software_set_updated_at
before update on public.asset_software
for each row
execute function public.asset_set_updated_at();

drop trigger if exists software_asset_assignments_set_updated_at on public.software_asset_assignments;
create trigger software_asset_assignments_set_updated_at
before update on public.software_asset_assignments
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

insert into public.asset_policy_settings (hardware_categories, software_categories, hardware_prefix, software_prefix, hardware_category_prefixes, software_category_prefixes, sequence_digits)
select
  array['모니터', '랩탑', '데스크탑'],
  array['OS', '데이터베이스', '보안', '개발툴', '미들웨어'],
  'H',
  'S',
  '{"모니터":"M","랩탑":"L","데스크탑":"D"}'::jsonb,
  '{"OS":"S","데이터베이스":"S","보안":"S","개발툴":"S","미들웨어":"S"}'::jsonb,
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
alter table public.asset_hardware_save enable row level security;
alter table public.asset_software_save enable row level security;
alter table public.asset_hardware enable row level security;
alter table public.asset_software enable row level security;
alter table public.software_asset_assignments enable row level security;
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

drop policy if exists "asset_hardware_all_authenticated" on public.asset_hardware;
create policy "asset_hardware_all_authenticated"
on public.asset_hardware
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_hardware_save_all_authenticated" on public.asset_hardware_save;
create policy "asset_hardware_save_all_authenticated"
on public.asset_hardware_save
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_software_all_authenticated" on public.asset_software;
create policy "asset_software_all_authenticated"
on public.asset_software
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_software_save_all_authenticated" on public.asset_software_save;
create policy "asset_software_save_all_authenticated"
on public.asset_software_save
for all
to authenticated
using (true)
with check (true);

drop policy if exists "software_asset_assignments_all_authenticated" on public.software_asset_assignments;
create policy "software_asset_assignments_all_authenticated"
on public.software_asset_assignments
for all
to authenticated
using (true)
with check (true);

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
