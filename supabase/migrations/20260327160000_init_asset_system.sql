create extension if not exists pgcrypto;

create table if not exists public.asset_assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text unique,
  name text not null,
  type text not null check (type in ('hardware', 'software')),
  category text not null,
  status text not null,
  unit_price numeric(14, 2) not null default 0,
  quantity integer not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  department text not null,
  role text not null check (role in ('User', 'Viewer', 'Manager', 'Admin')),
  joined_at timestamptz not null default now(),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_org_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text not null default '',
  category text not null default '',
  cell text not null default '',
  unit text not null default '',
  part text not null default '',
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_asset_users (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.asset_assets(id) on delete restrict,
  name text not null,
  email text not null,
  department text not null,
  position text not null,
  assigned_quantity integer not null default 1 check (assigned_quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_audit_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  actor text not null,
  action text not null,
  target text not null,
  ip text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.asset_policy_settings (
  id uuid primary key default gen_random_uuid(),
  hardware_categories text[] not null default array['노트북', '서버', '네트워크', '보안장비', '스토리지'],
  software_categories text[] not null default array['OS', '데이터베이스', '보안', '개발툴', '미들웨어'],
  hardware_prefix text not null default 'H',
  software_prefix text not null default 'S',
  sequence_digits integer not null default 3 check (sequence_digits > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_security_settings (
  id uuid primary key default gen_random_uuid(),
  allowed_domain text not null default 'company.com',
  session_timeout text not null default '60분',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.asset_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.next_asset_code(target_type text)
returns text
language plpgsql
as $$
declare
  prefix text;
  digits integer;
  next_number integer;
begin
  select
    case
      when target_type = 'hardware' then hardware_prefix
      when target_type = 'software' then software_prefix
      else null
    end,
    sequence_digits
  into prefix, digits
  from public.asset_policy_settings
  order by created_at asc
  limit 1;

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

  select coalesce(max(substring(asset_code from length(prefix) + 2)::integer), 0) + 1
    into next_number
  from public.asset_assets
  where type = target_type
    and asset_code like prefix || '-%';

  return prefix || '-' || lpad(next_number::text, digits, '0');
end;
$$;

create or replace function public.assign_asset_code()
returns trigger
language plpgsql
as $$
begin
  if new.asset_code is null or new.asset_code = '' then
    new.asset_code := public.next_asset_code(new.type);
  end if;
  return new;
end;
$$;

drop trigger if exists asset_assets_assign_asset_code on public.asset_assets;
create trigger asset_assets_assign_asset_code
before insert on public.asset_assets
for each row
execute function public.assign_asset_code();

drop trigger if exists asset_assets_set_updated_at on public.asset_assets;
create trigger asset_assets_set_updated_at
before update on public.asset_assets
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_members_set_updated_at on public.asset_members;
create trigger asset_members_set_updated_at
before update on public.asset_members
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_org_members_set_updated_at on public.asset_org_members;
create trigger asset_org_members_set_updated_at
before update on public.asset_org_members
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_asset_users_set_updated_at on public.asset_asset_users;
create trigger asset_asset_users_set_updated_at
before update on public.asset_asset_users
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_policy_settings_set_updated_at on public.asset_policy_settings;
create trigger asset_policy_settings_set_updated_at
before update on public.asset_policy_settings
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_security_settings_set_updated_at on public.asset_security_settings;
create trigger asset_security_settings_set_updated_at
before update on public.asset_security_settings
for each row
execute function public.asset_set_updated_at();

insert into public.asset_policy_settings (hardware_categories, software_categories, hardware_prefix, software_prefix, sequence_digits)
select
  array['노트북', '서버', '네트워크', '보안장비', '스토리지'],
  array['OS', '데이터베이스', '보안', '개발툴', '미들웨어'],
  'H',
  'S',
  3
where not exists (
  select 1 from public.asset_policy_settings
);

insert into public.asset_security_settings (allowed_domain, session_timeout)
select 'company.com', '60분'
where not exists (
  select 1 from public.asset_security_settings
);

alter table public.asset_assets enable row level security;
alter table public.asset_members enable row level security;
alter table public.asset_org_members enable row level security;
alter table public.asset_asset_users enable row level security;
alter table public.asset_audit_logs enable row level security;
alter table public.asset_policy_settings enable row level security;
alter table public.asset_security_settings enable row level security;

drop policy if exists "asset_assets_select_authenticated" on public.asset_assets;
create policy "asset_assets_select_authenticated"
on public.asset_assets
for select
to authenticated
using (true);

drop policy if exists "asset_assets_insert_authenticated" on public.asset_assets;
create policy "asset_assets_insert_authenticated"
on public.asset_assets
for insert
to authenticated
with check (true);

drop policy if exists "asset_assets_update_authenticated" on public.asset_assets;
create policy "asset_assets_update_authenticated"
on public.asset_assets
for update
to authenticated
using (true)
with check (true);

drop policy if exists "asset_assets_delete_authenticated" on public.asset_assets;
create policy "asset_assets_delete_authenticated"
on public.asset_assets
for delete
to authenticated
using (true);

drop policy if exists "asset_members_all_authenticated" on public.asset_members;
create policy "asset_members_all_authenticated"
on public.asset_members
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_org_members_all_authenticated" on public.asset_org_members;
create policy "asset_org_members_all_authenticated"
on public.asset_org_members
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_asset_users_all_authenticated" on public.asset_asset_users;
create policy "asset_asset_users_all_authenticated"
on public.asset_asset_users
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_audit_logs_all_authenticated" on public.asset_audit_logs;
create policy "asset_audit_logs_all_authenticated"
on public.asset_audit_logs
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_policy_settings_all_authenticated" on public.asset_policy_settings;
create policy "asset_policy_settings_all_authenticated"
on public.asset_policy_settings
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_security_settings_all_authenticated" on public.asset_security_settings;
create policy "asset_security_settings_all_authenticated"
on public.asset_security_settings
for all
to authenticated
using (true)
with check (true);

insert into public.asset_assets (asset_code, name, type, category, status, unit_price, quantity)
values
  ('H-001', '맥북 프로', 'hardware', '노트북', '사용중', 3200000, 12),
  ('H-002', '델 서버', 'hardware', '서버', '사용가능', 8700000, 4),
  ('H-003', '레노버 씽크패드', 'hardware', '노트북', '사용가능', 2100000, 9),
  ('H-004', '시스코 스위치', 'hardware', '네트워크', '사용중', 1550000, 6),
  ('H-005', '파이어월 장비', 'hardware', '보안장비', '사용중', 4900000, 3),
  ('H-006', 'QNAP 스토리지', 'hardware', '스토리지', '사용가능', 3800000, 5),
  ('H-007', 'HP 워크스테이션', 'hardware', '노트북', '사용중', 2700000, 7),
  ('H-008', 'AP 컨트롤러', 'hardware', '네트워크', '사용가능', 980000, 11),
  ('H-009', '백업 서버', 'hardware', '서버', '사용가능', 6400000, 2),
  ('H-010', '보안 게이트웨이', 'hardware', '보안장비', '사용중', 5200000, 4),
  ('S-001', '윈도우 라이선스', 'software', 'OS', '활성', 320000, 150),
  ('S-002', 'Burp Suite Pro', 'software', '보안', '할당됨', 680000, 20),
  ('S-003', 'Ubuntu Server', 'software', 'OS', '활성', 0, 100),
  ('S-004', 'PostgreSQL', 'software', '데이터베이스', '활성', 540000, 35),
  ('S-005', 'Oracle DB', 'software', '데이터베이스', '할당됨', 2200000, 10),
  ('S-006', 'IntelliJ IDEA', 'software', '개발툴', '활성', 210000, 40),
  ('S-007', 'Visual Studio', 'software', '개발툴', '활성', 180000, 55),
  ('S-008', 'Nginx Plus', 'software', '미들웨어', '할당됨', 460000, 18),
  ('S-009', 'Vault Enterprise', 'software', '보안', '활성', 890000, 14),
  ('S-010', 'Redis Enterprise', 'software', '미들웨어', '활성', 730000, 16)
on conflict (asset_code) do update
set
  name = excluded.name,
  type = excluded.type,
  category = excluded.category,
  status = excluded.status,
  unit_price = excluded.unit_price,
  quantity = excluded.quantity,
  updated_at = now();

insert into public.asset_members (name, email, department, role, joined_at, last_login_at)
values
  ('홍길동', 'hong@company.com', '보안팀', 'Admin', '2026-01-12T00:00:00+09:00', '2026-03-27T09:10:00+09:00'),
  ('김보안', 'kim@company.com', '인프라팀', 'Manager', '2026-02-01T00:00:00+09:00', '2026-03-27T08:32:00+09:00'),
  ('이감사', 'lee@company.com', '감사팀', 'Viewer', '2026-02-18T00:00:00+09:00', '2026-03-26T18:05:00+09:00')
on conflict (email) do update
set
  name = excluded.name,
  department = excluded.department,
  role = excluded.role,
  joined_at = excluded.joined_at,
  last_login_at = excluded.last_login_at,
  updated_at = now();

insert into public.asset_org_members (name, position, category, cell, unit, part, location)
values
  ('신동호', '', 'CEO', 'CEO', 'CEO', 'CEO', '성수_202'),
  ('박지연', '', '개발', 'HR', 'HR', 'HR', '전주'),
  ('최재영', '리더', '개발', 'CK', '개발10', '개발10', '성수_1906'),
  ('이강원', '리더', '사업', '운영', 'CEM', 'CEM', '성수_201'),
  ('김희수', '', 'VP', '비즈니스', '비즈니스', '비즈니스', '성수_201'),
  ('임수경', '리더', '개발', '개발연구소', '개발6', '개발6', '성수_202'),
  ('송복령', '리더', '경영', '경영지원', '경영지원', '경영지원', '성수_201'),
  ('김태웅', '리더', '개발', '개발연구소', '개발5', '개발5', '성수_1906'),
  ('박채란', '', '사업', '운영', 'CEM', 'CEM', '성수_201'),
  ('박혜린', '', '개발', '개발연구소', '개발6', '개발6', '성수_202');

insert into public.asset_asset_users (asset_id, name, email, department, position, assigned_quantity)
select a.id, seeded.name, seeded.email, seeded.department, seeded.position, seeded.assigned_quantity
from (
  values
    ('H-001', '홍길동', 'hong@company.com', '보안팀', '팀장', 1),
    ('S-002', '김보안', 'kim@company.com', '인프라팀', '매니저', 2)
) as seeded(asset_code, name, email, department, position, assigned_quantity)
join public.asset_assets a on a.asset_code = seeded.asset_code
where not exists (
  select 1
  from public.asset_asset_users u
  where u.email = seeded.email
    and u.asset_id = a.id
);

insert into public.asset_audit_logs (type, actor, action, target, ip, created_at)
values
  ('접속 로그', '홍길동', 'Google 로그인 성공', '자산 관리 시스템', '10.10.1.15', '2026-03-27T09:10:11+09:00'),
  ('권한 변경', '홍길동', '회원 권한 변경', '김보안 → 운영자', '10.10.1.15', '2026-03-27T09:15:44+09:00'),
  ('자산 등록', '김보안', '하드웨어 자산 등록', 'H-003 / 레노버 노트북', '10.10.1.22', '2026-03-27T09:21:03+09:00'),
  ('보안 설정', '홍길동', '세션 타임아웃 변경', '30분 → 60분', '10.10.1.15', '2026-03-27T09:40:55+09:00');

update public.asset_policy_settings
set
  hardware_categories = array['노트북', '서버', '네트워크', '보안장비', '스토리지'],
  software_categories = array['OS', '데이터베이스', '보안', '개발툴', '미들웨어'],
  hardware_prefix = 'H',
  software_prefix = 'S',
  sequence_digits = 3,
  updated_at = now();

update public.asset_security_settings
set
  allowed_domain = 'company.com',
  session_timeout = '60분',
  updated_at = now();
