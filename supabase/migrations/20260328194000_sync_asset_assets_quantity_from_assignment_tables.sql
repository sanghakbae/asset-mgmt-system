update public.asset_assets as assets
set quantity = coalesce(source.total_quantity, 0)
from (
  select
    'hardware'::text as type,
    category,
    count(*)::integer as total_quantity
  from public.asset_hardware
  group by category

  union all

  select
    'software'::text as type,
    category,
    coalesce(sum(assigned_quantity), 0)::integer as total_quantity
  from public.asset_software
  group by category
) as source
where assets.type = source.type
  and assets.category = source.category;

update public.asset_assets as assets
set quantity = 0
where not exists (
  select 1
  from public.asset_hardware as hardware
  where assets.type = 'hardware'
    and hardware.category = assets.category
)
and not exists (
  select 1
  from public.asset_software as software
  where assets.type = 'software'
    and software.category = assets.category
);
