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

