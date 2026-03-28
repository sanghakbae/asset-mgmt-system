alter table public.asset_policy_settings
  add column if not exists hardware_category_prefixes jsonb not null default '{"모니터":"M","랩탑":"L","데스크탑":"D"}'::jsonb,
  add column if not exists software_category_prefixes jsonb not null default '{"OS":"S","데이터베이스":"S","보안":"S","개발툴":"S","미들웨어":"S"}'::jsonb;

update public.asset_policy_settings
set
  hardware_categories = array['모니터', '랩탑', '데스크탑'],
  hardware_category_prefixes = jsonb_build_object('모니터', 'M', '랩탑', 'L', '데스크탑', 'D'),
  software_category_prefixes = coalesce(
    software_category_prefixes,
    jsonb_build_object('OS', software_prefix, '데이터베이스', software_prefix, '보안', software_prefix, '개발툴', software_prefix, '미들웨어', software_prefix)
  );

create or replace function public.next_split_asset_code(target_type text)
returns text
language plpgsql
as $$
declare
  prefix text;
  digits integer;
  next_number integer;
  asset_category text;
  category_prefixes jsonb;
begin
  select
    case
      when target_type = 'hardware' then hardware_prefix
      when target_type = 'software' then software_prefix
      else null
    end,
    sequence_digits,
    case
      when target_type = 'hardware' then hardware_category_prefixes
      when target_type = 'software' then software_category_prefixes
      else '{}'::jsonb
    end
  into prefix, digits, category_prefixes
  from public.asset_policy_settings
  order by created_at asc
  limit 1;

  asset_category := nullif(current_setting('app.asset_category', true), '');
  if asset_category is not null and coalesce(category_prefixes, '{}'::jsonb) ? asset_category then
    prefix := nullif(category_prefixes ->> asset_category, '');
  end if;

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
    perform set_config('app.asset_category', coalesce(new.category, ''), true);
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
    perform set_config('app.asset_category', coalesce(new.category, ''), true);
    new.asset_code := public.next_split_asset_code('software');
  end if;
  return new;
end;
$$;
