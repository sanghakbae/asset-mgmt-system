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
