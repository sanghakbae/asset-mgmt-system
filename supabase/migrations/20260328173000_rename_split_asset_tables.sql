alter table if exists public.hardware_assets rename to asset_hardware;
alter table if exists public.software_assets rename to asset_software;

alter index if exists public.hardware_assets_pkey rename to asset_hardware_pkey;
alter index if exists public.hardware_assets_asset_code_key rename to asset_hardware_asset_code_key;
alter index if exists public.hardware_assets_status_idx rename to asset_hardware_status_idx;
alter index if exists public.hardware_assets_user_name_idx rename to asset_hardware_user_name_idx;

alter index if exists public.software_assets_pkey rename to asset_software_pkey;
alter index if exists public.software_assets_asset_code_key rename to asset_software_asset_code_key;
alter index if exists public.software_assets_software_name_idx rename to asset_software_software_name_idx;

alter table public.software_asset_assignments
  drop constraint if exists software_asset_assignments_software_asset_id_fkey,
  add constraint software_asset_assignments_software_asset_id_fkey
    foreign key (software_asset_id) references public.asset_software(id) on delete cascade;

create or replace function public.next_split_asset_code(target_type text, asset_category text default null)
returns text
language plpgsql
as $$
declare
  prefix text;
  digits integer;
  next_number integer;
begin
  select sequence_digits
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
    from (
      select asset_code from public.asset_assets where type = 'hardware'
      union all
      select asset_code from public.asset_hardware
    ) codes
    where asset_code like prefix || '-%';
  elsif target_type = 'software' then
    select coalesce(max(substring(asset_code from length(prefix) + 2)::integer), 0) + 1
      into next_number
    from (
      select asset_code from public.asset_assets where type = 'software'
      union all
      select asset_code from public.asset_software
    ) codes
    where asset_code like prefix || '-%';
  else
    raise exception 'Unsupported asset type: %', target_type;
  end if;

  return prefix || '-' || lpad(next_number::text, digits, '0');
end;
$$;

create or replace function public.refresh_split_asset_code_on_category_change()
returns trigger
language plpgsql
as $$
declare
  target_type text;
  next_prefix text;
begin
  target_type := case
    when tg_table_name = 'asset_hardware' then 'hardware'
    when tg_table_name = 'asset_software' then 'software'
    else null
  end;

  if target_type is null or coalesce(new.category, '') = coalesce(old.category, '') then
    return new;
  end if;

  next_prefix := public.get_split_asset_prefix(target_type, new.category);

  if new.asset_code is null or new.asset_code = '' or new.asset_code not like next_prefix || '-%' then
    new.asset_code := public.next_split_asset_code(target_type, new.category);
  end if;

  return new;
end;
$$;

alter table public.asset_hardware enable row level security;
alter table public.asset_software enable row level security;

drop policy if exists "hardware_assets_all_authenticated" on public.asset_hardware;
drop policy if exists "software_assets_all_authenticated" on public.asset_software;
drop policy if exists "asset_hardware_all_authenticated" on public.asset_hardware;
drop policy if exists "asset_software_all_authenticated" on public.asset_software;

create policy "asset_hardware_all_authenticated"
on public.asset_hardware
for all
to authenticated
using (true)
with check (true);

create policy "asset_software_all_authenticated"
on public.asset_software
for all
to authenticated
using (true)
with check (true);

drop trigger if exists hardware_assets_assign_asset_code on public.asset_hardware;
drop trigger if exists hardware_assets_refresh_asset_code on public.asset_hardware;
drop trigger if exists hardware_assets_set_updated_at on public.asset_hardware;
drop trigger if exists asset_hardware_assign_asset_code on public.asset_hardware;
drop trigger if exists asset_hardware_refresh_asset_code on public.asset_hardware;
drop trigger if exists asset_hardware_set_updated_at on public.asset_hardware;

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

drop trigger if exists software_assets_assign_asset_code on public.asset_software;
drop trigger if exists software_assets_refresh_asset_code on public.asset_software;
drop trigger if exists software_assets_set_updated_at on public.asset_software;
drop trigger if exists asset_software_assign_asset_code on public.asset_software;
drop trigger if exists asset_software_refresh_asset_code on public.asset_software;
drop trigger if exists asset_software_set_updated_at on public.asset_software;

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
