import { supabase } from "@/lib/supabase";
import type { Asset, AssetDraft, AssetType } from "@/features/asset-management/types";

type AssetRow = {
  id: string;
  asset_code: string;
  name: string;
  type: AssetType;
  category: string;
  status: string;
  created_at: string;
};

function mapAssetRow(row: AssetRow): Asset {
  return {
    id: row.asset_code,
    name: row.name,
    type: row.type,
    category: row.category,
    status: row.status,
  };
}

export async function listAssets(): Promise<Asset[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("asset_assets")
    .select("id, asset_code, name, type, category, status, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapAssetRow);
}

export async function createAsset(draft: AssetDraft, type: AssetType): Promise<Asset> {
  if (!supabase) throw new Error("Supabase is not configured");

  const status = type === "hardware" ? "사용가능" : "활성";

  const { data, error } = await supabase
    .from("asset_assets")
    .insert({
      name: draft.name,
      type,
      category: draft.category,
      status,
    })
    .select("id, asset_code, name, type, category, status, created_at")
    .single();

  if (error) throw error;

  return mapAssetRow(data);
}
