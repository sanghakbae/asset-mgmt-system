update public.asset_assets
set acquired_at = null
where acquired_at is not null;
