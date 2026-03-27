import { supabase } from "@/lib/supabase";
import type { ImportedOrgMemberRow, OrgMember } from "@/features/asset-management/types";

type OrgMemberRow = {
  id: string;
  name: string;
  position: string;
  category: string;
  cell: string;
  unit: string;
  part: string;
  location: string;
  created_at: string;
};

function getOrgMemberKey(row: {
  name: string;
  category: string;
  cell: string;
  unit: string;
  part: string;
  location: string;
}) {
  return [
    row.name.trim().toLowerCase(),
    row.category.trim().toLowerCase(),
    row.cell.trim().toLowerCase(),
    row.unit.trim().toLowerCase(),
    row.part.trim().toLowerCase(),
    row.location.trim().toLowerCase(),
  ].join("::");
}

function mapOrgMemberRow(row: OrgMemberRow, index: number): OrgMember {
  return {
    id: index + 1,
    name: row.name,
    position: row.position,
    category: row.category,
    cell: row.cell,
    unit: row.unit,
    part: row.part,
    location: row.location,
  };
}

export async function listOrgMembers(): Promise<OrgMember[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("asset_org_members")
    .select("id, name, position, category, cell, unit, part, location, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapOrgMemberRow);
}

export async function importOrgMembersBulk(rows: ImportedOrgMemberRow[]): Promise<OrgMember[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  if (rows.length === 0) return [];

  const { data: existingRows, error: existingError } = await supabase
    .from("asset_org_members")
    .select("id, name, position, category, cell, unit, part, location, created_at");

  if (existingError) throw existingError;

  const existingMap = new Map((existingRows ?? []).map((row) => [getOrgMemberKey(row), row] as const));
  const rowsToInsert = rows.filter((row) => !existingMap.has(getOrgMemberKey(row)));
  const rowsToUpdate = rows.filter((row) => existingMap.has(getOrgMemberKey(row)));

  if (rowsToUpdate.length > 0) {
    const updateResults = await Promise.all(
      rowsToUpdate.map(async (row) => {
        const existing = existingMap.get(getOrgMemberKey(row));
        if (!existing) return null;

        const { data, error } = await supabase
          .from("asset_org_members")
          .update({
            position: row.position,
          })
          .eq("id", existing.id)
          .select("id, name, position, category, cell, unit, part, location, created_at")
          .single();

        if (error) throw error;
        return data;
      })
    );

    updateResults.filter(Boolean).forEach((row) => {
      existingMap.set(getOrgMemberKey(row!), row as OrgMemberRow);
    });
  }

  let insertedRows: OrgMemberRow[] = [];
  if (rowsToInsert.length > 0) {
    const { data, error } = await supabase
      .from("asset_org_members")
      .insert(
        rowsToInsert.map((row) => ({
          name: row.name,
          position: row.position,
          category: row.category,
          cell: row.cell,
          unit: row.unit,
          part: row.part,
          location: row.location,
        }))
      )
      .select("id, name, position, category, cell, unit, part, location, created_at");

    if (error) throw error;
    insertedRows = data ?? [];
  }

  return [...existingMap.values(), ...insertedRows]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(mapOrgMemberRow);
}
