delete from public.asset_asset_users
where asset_id in (
  select id
  from public.asset_assets
  where type = 'software'
);

delete from public.asset_assets
where type = 'software';
