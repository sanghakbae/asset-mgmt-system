alter table public.hardware_assets
  add column if not exists unit_price numeric(14, 2) not null default 0,
  add column if not exists acquired_at date;

alter table public.software_assets
  add column if not exists status text not null default '운영',
  add column if not exists unit_price numeric(14, 2) not null default 0;

update public.hardware_assets as h
set
  unit_price = coalesce(a.unit_price, 0),
  acquired_at = a.acquired_at
from public.asset_assets as a
where a.type = 'hardware'
  and a.asset_code = h.asset_code;

update public.software_assets as s
set
  status = coalesce(a.status, '운영'),
  unit_price = coalesce(a.unit_price, 0)
from public.asset_assets as a
where a.type = 'software'
  and a.asset_code = s.asset_code;

create or replace function public.next_split_asset_code(target_type text)
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

  if target_type = 'hardware' then
    select coalesce(max(substring(asset_code from length(prefix) + 2)::integer), 0) + 1
      into next_number
    from (
      select asset_code from public.asset_assets where type = 'hardware'
      union all
      select asset_code from public.hardware_assets
    ) codes
    where asset_code like prefix || '-%';
  elsif target_type = 'software' then
    select coalesce(max(substring(asset_code from length(prefix) + 2)::integer), 0) + 1
      into next_number
    from (
      select asset_code from public.asset_assets where type = 'software'
      union all
      select asset_code from public.software_assets
    ) codes
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
    new.asset_code := public.next_split_asset_code('hardware');
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
    new.asset_code := public.next_split_asset_code('software');
  end if;
  return new;
end;
$$;

drop trigger if exists hardware_assets_assign_asset_code on public.hardware_assets;
create trigger hardware_assets_assign_asset_code
before insert on public.hardware_assets
for each row
execute function public.assign_hardware_asset_code();

drop trigger if exists software_assets_assign_asset_code on public.software_assets;
create trigger software_assets_assign_asset_code
before insert on public.software_assets
for each row
execute function public.assign_software_asset_code();
