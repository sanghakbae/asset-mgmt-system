create table if not exists public.asset_google_workspace_license_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  total_products integer not null default 0,
  total_assignments integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_google_workspace_licenses (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.asset_google_workspace_license_runs(id) on delete set null,
  product_id text not null,
  sku_id text not null,
  sku_name text,
  user_id text not null,
  user_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asset_google_workspace_licenses_unique unique (product_id, sku_id, user_email)
);

drop trigger if exists asset_google_workspace_license_runs_set_updated_at on public.asset_google_workspace_license_runs;
create trigger asset_google_workspace_license_runs_set_updated_at
before update on public.asset_google_workspace_license_runs
for each row
execute function public.asset_set_updated_at();

drop trigger if exists asset_google_workspace_licenses_set_updated_at on public.asset_google_workspace_licenses;
create trigger asset_google_workspace_licenses_set_updated_at
before update on public.asset_google_workspace_licenses
for each row
execute function public.asset_set_updated_at();

alter table public.asset_google_workspace_license_runs enable row level security;
alter table public.asset_google_workspace_licenses enable row level security;

drop policy if exists "asset_google_workspace_license_runs_all_authenticated" on public.asset_google_workspace_license_runs;
create policy "asset_google_workspace_license_runs_all_authenticated"
on public.asset_google_workspace_license_runs
for all
to authenticated
using (true)
with check (true);

drop policy if exists "asset_google_workspace_licenses_all_authenticated" on public.asset_google_workspace_licenses;
create policy "asset_google_workspace_licenses_all_authenticated"
on public.asset_google_workspace_licenses
for all
to authenticated
using (true)
with check (true);
