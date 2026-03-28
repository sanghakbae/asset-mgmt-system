with ranked_assets as (
  select
    id,
    type,
    category,
    quantity,
    created_at,
    row_number() over (
      partition by type, category
      order by created_at asc, id asc
    ) as rn,
    sum(quantity) over (
      partition by type, category
    ) as total_quantity
  from public.asset_assets
),
updated_assets as (
  update public.asset_assets as assets
  set
    name = ranked.category,
    software_name = null,
    quantity = ranked.total_quantity,
    unit_price = 0,
    acquired_at = null,
    expires_at = null,
    note = null,
    status = case when ranked.type = 'hardware' then '유휴' else '사용' end
  from ranked_assets as ranked
  where assets.id = ranked.id
    and ranked.rn = 1
  returning assets.id
)
delete from public.asset_assets
where id in (
  select id
  from ranked_assets
  where rn > 1
);
