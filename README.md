# Asset Management System

사내 자산 등록, 자산 할당, 자산 사용 현황을 관리하는 Vite + React + Supabase 기반 프로젝트입니다.

## 실행

```bash
npm ci
npm run dev
```

## 빌드

```bash
npm run build
```

## 환경 변수

`.env`

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Google Workspace 라이선스 동기화

Google Workspace Admin SDK License Manager API를 Supabase Edge Function으로 호출합니다.

필수 준비:

1. Google Cloud에서 서비스 계정 생성
2. Google Workspace 관리자 계정으로 Domain-wide Delegation 승인
3. OAuth scope 추가
   - `https://www.googleapis.com/auth/apps.licensing`
4. Supabase Edge Function 배포
   - `google-workspace-license-sync`
5. Supabase DB 마이그레이션 적용

Edge Function Secrets 예시:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_WORKSPACE_IMPERSONATED_ADMIN_EMAIL=admin@company.com
GOOGLE_WORKSPACE_LICENSE_PRODUCT_IDS=Google-Apps,Google-Vault
GOOGLE_WORKSPACE_CUSTOMER_ID=my_customer
GOOGLE_WORKSPACE_SKU_NAME_MAP={"1010020027":"Enterprise Standard","1010020028":"Enterprise Plus"}
```

적용 후 설정 > 보안에서 `Google Workspace 라이선스 동기화` 버튼으로 스냅샷을 갱신할 수 있습니다.

## GitHub Pages 배포

GitHub Actions로 배포합니다.

필요한 GitHub Actions Secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`main` 브랜치에 push되면:

1. `Build`
2. `Deploy Pages`

workflow가 실행됩니다.

## 주요 구조

- `src/services/assets.ts`
  - 자산 등록/할당 데이터 처리
- `src/services/excel.ts`
  - 엑셀 import/export 처리
- `src/features/asset-management/views.tsx`
  - 주요 화면 UI
- `supabase/schema.sql`
  - 최신 스키마 정의
- `supabase/migrations/`
  - DB 마이그레이션

## 테이블 구분

- 등록용
  - `asset_hardware_save`
  - `asset_software_save`
- 할당용
  - `asset_hardware`
  - `asset_software`
