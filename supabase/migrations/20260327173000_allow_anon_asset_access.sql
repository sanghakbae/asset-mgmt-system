drop policy if exists "asset_assets_select_anon" on public.asset_assets;
create policy "asset_assets_select_anon"
on public.asset_assets
for select
to anon
using (true);

drop policy if exists "asset_assets_insert_anon" on public.asset_assets;
create policy "asset_assets_insert_anon"
on public.asset_assets
for insert
to anon
with check (true);

drop policy if exists "asset_assets_update_anon" on public.asset_assets;
create policy "asset_assets_update_anon"
on public.asset_assets
for update
to anon
using (true)
with check (true);

drop policy if exists "asset_assets_delete_anon" on public.asset_assets;
create policy "asset_assets_delete_anon"
on public.asset_assets
for delete
to anon
using (true);

drop policy if exists "asset_org_members_select_anon" on public.asset_org_members;
create policy "asset_org_members_select_anon"
on public.asset_org_members
for select
to anon
using (true);

drop policy if exists "asset_org_members_insert_anon" on public.asset_org_members;
create policy "asset_org_members_insert_anon"
on public.asset_org_members
for insert
to anon
with check (true);

drop policy if exists "asset_org_members_update_anon" on public.asset_org_members;
create policy "asset_org_members_update_anon"
on public.asset_org_members
for update
to anon
using (true)
with check (true);

drop policy if exists "asset_org_members_delete_anon" on public.asset_org_members;
create policy "asset_org_members_delete_anon"
on public.asset_org_members
for delete
to anon
using (true);
