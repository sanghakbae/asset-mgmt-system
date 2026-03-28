update public.asset_hardware_save
set category = '랩탑'
where category = '노트북';

update public.asset_hardware
set category = '랩탑'
where category = '노트북';

update public.asset_policy_settings
set
  hardware_categories = array['모니터', '랩탑', '데스크탑'],
  hardware_category_prefixes = jsonb_build_object('모니터', 'M', '랩탑', 'L', '데스크탑', 'D')
where '노트북' = any(hardware_categories)
   or hardware_category_prefixes ? '노트북';
