alter table public.asset_assets
  drop column if exists asset_code,
  drop column if exists name,
  drop column if exists software_name,
  drop column if exists status,
  drop column if exists unit_price,
  drop column if exists acquired_at,
  drop column if exists expires_at,
  drop column if exists note;

drop trigger if exists asset_assets_assign_asset_code on public.asset_assets;
drop function if exists public.assign_asset_code();
drop function if exists public.next_asset_code(text);

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
