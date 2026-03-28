import { supabase } from "@/lib/supabase";
import type { AssetPolicySettings } from "@/features/asset-management/types";
import { defaultAssetPolicySettings } from "@/features/asset-management/data";

type AssetPolicySettingsRow = {
  id: string;
  hardware_categories: string[];
  software_categories: string[];
  hardware_prefix: string;
  software_prefix: string;
  hardware_category_prefixes: Record<string, string> | null;
  software_category_prefixes: Record<string, string> | null;
  sequence_digits: number;
};

function normalizePrefixMap(categories: string[], value: Record<string, string> | null | undefined, fallbackPrefix: string) {
  return Object.fromEntries(
    categories.map((category) => [category, value?.[category]?.trim() || fallbackPrefix])
  );
}

function mapPolicySettings(row: AssetPolicySettingsRow): AssetPolicySettings {
  return {
    hardwareCategories: row.hardware_categories,
    softwareCategories: row.software_categories,
    hardwarePrefix: row.hardware_prefix,
    softwarePrefix: row.software_prefix,
    hardwareCategoryPrefixes: normalizePrefixMap(row.hardware_categories, row.hardware_category_prefixes, row.hardware_prefix),
    softwareCategoryPrefixes: normalizePrefixMap(row.software_categories, row.software_category_prefixes, row.software_prefix),
    sequenceDigits: row.sequence_digits,
  };
}

export async function getAssetPolicySettings(): Promise<AssetPolicySettings | null> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("asset_policy_settings")
    .select("id, hardware_categories, software_categories, hardware_prefix, software_prefix, hardware_category_prefixes, software_category_prefixes, sequence_digits")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapPolicySettings(data);
}

export async function saveAssetPolicySettings(value: AssetPolicySettings): Promise<AssetPolicySettings> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: existing, error: lookupError } = await supabase
    .from("asset_policy_settings")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const payload = {
    hardware_categories: value.hardwareCategories,
    software_categories: value.softwareCategories,
    hardware_prefix: value.hardwarePrefix || defaultAssetPolicySettings.hardwarePrefix,
    software_prefix: value.softwarePrefix || defaultAssetPolicySettings.softwarePrefix,
    hardware_category_prefixes: normalizePrefixMap(
      value.hardwareCategories,
      value.hardwareCategoryPrefixes,
      value.hardwarePrefix || defaultAssetPolicySettings.hardwarePrefix
    ),
    software_category_prefixes: normalizePrefixMap(
      value.softwareCategories,
      value.softwareCategoryPrefixes,
      value.softwarePrefix || defaultAssetPolicySettings.softwarePrefix
    ),
    sequence_digits: value.sequenceDigits,
  };

  let savedRow: AssetPolicySettingsRow | null = null;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("asset_policy_settings")
      .update(payload)
      .eq("id", existing.id)
      .select("id, hardware_categories, software_categories, hardware_prefix, software_prefix, hardware_category_prefixes, software_category_prefixes, sequence_digits")
      .single();

    if (error) throw error;
    savedRow = data;
  } else {
    const { data, error } = await supabase
      .from("asset_policy_settings")
      .insert(payload)
      .select("id, hardware_categories, software_categories, hardware_prefix, software_prefix, hardware_category_prefixes, software_category_prefixes, sequence_digits")
      .single();

    if (error) throw error;
    savedRow = data;
  }

  return mapPolicySettings(savedRow);
}
