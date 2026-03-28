insert into public.hardware_assets (
  asset_code,
  user_name,
  department,
  status,
  category,
  pc_name,
  os,
  mac_address,
  ip_address,
  note,
  created_at,
  updated_at
)
select
  a.asset_code,
  nullif(a.name, ''),
  nullif(a.department, ''),
  a.status,
  a.category,
  a.pc_name,
  a.os,
  a.mac_address,
  a.ip_address,
  a.note,
  a.created_at,
  now()
from public.asset_assets a
where a.type = 'hardware'
on conflict (asset_code) do update
set
  user_name = excluded.user_name,
  department = excluded.department,
  status = excluded.status,
  category = excluded.category,
  pc_name = excluded.pc_name,
  os = excluded.os,
  mac_address = excluded.mac_address,
  ip_address = excluded.ip_address,
  note = excluded.note,
  updated_at = now();

insert into public.software_assets (
  asset_code,
  software_name,
  category,
  total_seats,
  available_seats,
  note,
  created_at,
  updated_at
)
select
  a.asset_code,
  coalesce(nullif(a.software_name, ''), nullif(a.name, ''), a.asset_code),
  a.category,
  coalesce(a.quantity, 0),
  greatest(coalesce(a.quantity, 0) - case when nullif(a.name, '') is not null then 1 else 0 end, 0),
  a.note,
  a.created_at,
  now()
from public.asset_assets a
where a.type = 'software'
on conflict (asset_code) do update
set
  software_name = excluded.software_name,
  category = excluded.category,
  total_seats = excluded.total_seats,
  available_seats = excluded.available_seats,
  note = excluded.note,
  updated_at = now();

insert into public.software_asset_assignments (
  software_asset_id,
  user_name,
  department,
  assigned_seats,
  assigned_at,
  note,
  created_at,
  updated_at
)
select
  sa.id,
  a.name,
  a.department,
  1,
  a.created_at,
  'asset_assets에서 자동 이관',
  now(),
  now()
from public.asset_assets a
join public.software_assets sa on sa.asset_code = a.asset_code
where a.type = 'software'
  and nullif(a.name, '') is not null
  and not exists (
    select 1
    from public.software_asset_assignments saa
    where saa.software_asset_id = sa.id
      and saa.user_name = a.name
      and coalesce(saa.revoked_at, 'infinity'::timestamptz) = 'infinity'::timestamptz
  );
