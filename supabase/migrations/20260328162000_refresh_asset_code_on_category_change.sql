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
  target_type text;
  next_prefix text;
begin
  target_type := case
    when tg_table_name = 'hardware_assets' then 'hardware'
    when tg_table_name = 'software_assets' then 'software'
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

drop trigger if exists hardware_assets_assign_asset_code on public.hardware_assets;
create trigger hardware_assets_assign_asset_code
before insert on public.hardware_assets
for each row
execute function public.assign_hardware_asset_code();

drop trigger if exists hardware_assets_refresh_asset_code on public.hardware_assets;
create trigger hardware_assets_refresh_asset_code
before update on public.hardware_assets
for each row
execute function public.refresh_split_asset_code_on_category_change();

drop trigger if exists software_assets_assign_asset_code on public.software_assets;
create trigger software_assets_assign_asset_code
before insert on public.software_assets
for each row
execute function public.assign_software_asset_code();

drop trigger if exists software_assets_refresh_asset_code on public.software_assets;
create trigger software_assets_refresh_asset_code
before update on public.software_assets
for each row
execute function public.refresh_split_asset_code_on_category_change();
