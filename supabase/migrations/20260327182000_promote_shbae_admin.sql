insert into public.asset_members (
  name,
  email,
  department,
  role,
  joined_at,
  last_login_at
)
values (
  'shbae',
  'shbae@muhayu.com',
  '',
  'Admin',
  now(),
  now()
)
on conflict (email) do update
set
  role = 'Admin',
  last_login_at = now(),
  updated_at = now();
