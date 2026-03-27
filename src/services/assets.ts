import { supabase } from "@/lib/supabase";
import type { Asset, AssetDraft, AssetType, ImportedAssetRow } from "@/features/asset-management/types";

type AssetRow = {
  id: string;
  asset_code: string;
  name: string;
  type: AssetType;
  category: string;
  status: string;
  unit_price: number;
  quantity: number;
  created_at: string;
};

function mapAssetRow(row: AssetRow): Asset {
  return {
    id: row.asset_code,
    name: row.name,
    type: row.type,
    category: row.category,
    status: row.status,
    unitPrice: row.unit_price,
    quantity: row.quantity,
  };
}

export async function listAssets(): Promise<Asset[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("asset_assets")
    .select("id, asset_code, name, type, category, status, unit_price, quantity, created_at")
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
      unit_price: draft.unitPrice,
      quantity: draft.quantity,
    })
    .select("id, asset_code, name, type, category, status, unit_price, quantity, created_at")
    .single();

  if (error) throw error;

  return mapAssetRow(data);
}

export async function importAssetsBulk(rows: ImportedAssetRow[]): Promise<Asset[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  if (rows.length === 0) return [];

  const { data: existingRows, error: existingError } = await supabase
    .from("asset_assets")
    .select("id, asset_code, name, type, category, status, unit_price, quantity, created_at");

  if (existingError) throw existingError;

  const existingMap = new Map(
    (existingRows ?? []).map((row) => [`${row.type}::${row.name.trim().toLowerCase()}::${row.category.trim().toLowerCase()}`, row] as const)
  );

  const rowsToInsert = rows.filter((row) => !existingMap.has(`${row.type}::${row.name.trim().toLowerCase()}::${row.category.trim().toLowerCase()}`));
  const rowsToUpdate = rows.filter((row) => existingMap.has(`${row.type}::${row.name.trim().toLowerCase()}::${row.category.trim().toLowerCase()}`));

  if (rowsToUpdate.length > 0) {
    const updateResults = await Promise.all(
      rowsToUpdate.map(async (row) => {
        const existing = existingMap.get(`${row.type}::${row.name.trim().toLowerCase()}::${row.category.trim().toLowerCase()}`);
        if (!existing) return null;

        const { data, error } = await supabase
          .from("asset_assets")
          .update({
            status: row.status ?? (row.type === "hardware" ? "사용가능" : "활성"),
            unit_price: row.unitPrice ?? 0,
            quantity: row.quantity ?? 0,
          })
          .eq("id", existing.id)
          .select("id, asset_code, name, type, category, status, unit_price, quantity, created_at")
          .single();

        if (error) throw error;
        return data;
      })
    );

    updateResults.filter(Boolean).forEach((row) => {
      existingMap.set(`${row!.type}::${row!.name.trim().toLowerCase()}::${row!.category.trim().toLowerCase()}`, row as AssetRow);
    });
  }

  let insertedRows: AssetRow[] = [];
  if (rowsToInsert.length > 0) {
    const { data, error } = await supabase
      .from("asset_assets")
      .insert(
        rowsToInsert.map((row) => ({
          name: row.name,
          type: row.type,
          category: row.category,
          status: row.status ?? (row.type === "hardware" ? "사용가능" : "활성"),
          unit_price: row.unitPrice ?? 0,
          quantity: row.quantity ?? 0,
        }))
      )
      .select("id, asset_code, name, type, category, status, unit_price, quantity, created_at");

    if (error) throw error;
    insertedRows = data ?? [];
  }

  return [...existingMap.values(), ...insertedRows]
    .map(mapAssetRow)
    .sort((a, b) => a.id.localeCompare(b.id, "ko"));
}
