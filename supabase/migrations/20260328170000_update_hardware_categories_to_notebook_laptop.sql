alter table public.asset_policy_settings
  alter column hardware_categories set default array['모니터', '노트북', '랩탑'],
  alter column hardware_category_prefixes set default '{"모니터":"M","노트북":"N","랩탑":"L"}'::jsonb;

update public.asset_policy_settings
set
  hardware_categories = array['모니터', '노트북', '랩탑'],
  hardware_category_prefixes = jsonb_build_object('모니터', 'M', '노트북', 'N', '랩탑', 'L')
where hardware_categories = array['모니터', '랩탑', '데스크탑']
   or hardware_category_prefixes = '{"모니터":"M","랩탑":"L","데스크탑":"D"}'::jsonb;
