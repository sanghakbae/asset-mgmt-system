with legacy_assignment_counts as (
  select
    software_asset_id,
    coalesce(sum(assigned_seats), 0) as released_seats
  from public.software_asset_assignments
  where note = 'asset_assets에서 자동 이관'
    and revoked_at is null
  group by software_asset_id
)
update public.software_assets sa
set available_seats = least(sa.total_seats, sa.available_seats + lac.released_seats)
from legacy_assignment_counts lac
where sa.id = lac.software_asset_id;

delete from public.software_asset_assignments
where note = 'asset_assets에서 자동 이관'
  and revoked_at is null;
