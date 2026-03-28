import { supabase } from "@/lib/supabase";
import type { Asset, AssetDraft, AssetType, HardwareAssignment, ImportedAssetRow, SoftwareAssignment } from "@/features/asset-management/types";

type HardwareSaveRow = {
  id: string;
  category: string;
  os: string | null;
  vendor: string | null;
  unit_price: number | null;
  acquired_at: string | null;
  quantity: number;
  note: string | null;
  created_at: string;
};

type SoftwareSaveRow = {
  id: string;
  category: string;
  software_name: string;
  unit_price: number | null;
  expires_at: string | null;
  quantity: number;
  note: string | null;
  created_at: string;
};

type HardwareAssignmentRow = {
  id: string;
  asset_id: string | null;
  user_name: string | null;
  department: string | null;
  category: string;
  pc_name: string | null;
  os: string | null;
  mac_address: string | null;
  ip_address: string | null;
  created_at: string;
};

type SoftwareAssignmentRow = {
  id: string;
  asset_id: string | null;
  user_name: string | null;
  department: string | null;
  software_name: string | null;
  category: string | null;
  assigned_quantity: number | null;
  total_seats: number | null;
  available_seats: number | null;
  assigned_at: string | null;
  expires_at: string | null;
};

function quantityOrZero(value: number | undefined) {
  return Math.max(0, value ?? 0);
}

function normalizeHardwareCategory(category: string) {
  return category === "노트북" ? "랩탑" : category;
}

function normalizeOptionalTimestamp(value?: string | null) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function resolveCreatedAt(value?: string | null) {
  return normalizeOptionalTimestamp(value) ?? new Date().toISOString();
}

function mapHardwareSaveAsset(row: HardwareSaveRow, assignedQuantity: number): Asset {
  const totalQuantity = quantityOrZero(row.quantity);
  const availableQuantity = Math.max(totalQuantity - quantityOrZero(assignedQuantity), 0);
  return {
    dbId: row.id,
    id: row.id,
    name: normalizeHardwareCategory(row.category),
    softwareName: undefined,
    type: "hardware",
    category: normalizeHardwareCategory(row.category),
    status: "유휴",
    unitPrice: row.unit_price ?? undefined,
    acquiredAt: row.acquired_at ?? undefined,
    os: row.os ?? undefined,
    vendor: row.vendor ?? undefined,
    createdAt: row.created_at,
    expiresAt: undefined,
    totalQuantity,
    quantity: availableQuantity,
    note: row.note ?? undefined,
  };
}

function mapSoftwareSaveAsset(row: SoftwareSaveRow, assignedQuantity: number): Asset {
  const totalQuantity = quantityOrZero(row.quantity);
  const availableQuantity = Math.max(totalQuantity - quantityOrZero(assignedQuantity), 0);
  return {
    dbId: row.id,
    id: row.id,
    name: "",
    softwareName: row.software_name,
    type: "software",
    category: row.category,
    status: "사용",
    unitPrice: row.unit_price ?? undefined,
    acquiredAt: undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at ?? undefined,
    totalQuantity,
    quantity: availableQuantity,
    note: row.note ?? undefined,
  };
}

async function getAssetMasterById(assetId: string, type: AssetType) {
  if (!supabase) throw new Error("Supabase is not configured");

  const table = type === "hardware" ? "asset_hardware_save" : "asset_software_save";
  const columns =
    type === "hardware"
      ? "id, category, os, vendor, unit_price, acquired_at, quantity, note, created_at"
      : "id, category, software_name, unit_price, expires_at, quantity, note, created_at";
  const { data, error } = await supabase.from(table).select(columns).eq("id", assetId).single();

  if (error) throw error;
  return data as HardwareSaveRow | SoftwareSaveRow;
}

export async function listAssets(): Promise<Asset[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const [{ data: hardwareSaveRows, error: hardwareSaveError }, { data: softwareSaveRows, error: softwareSaveError }, { data: hardwareRows, error: hardwareError }, { data: softwareRows, error: softwareError }] =
    await Promise.all([
      supabase
        .from("asset_hardware_save")
        .select("id, category, os, vendor, unit_price, acquired_at, quantity, note, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("asset_software_save").select("id, category, software_name, unit_price, expires_at, quantity, note, created_at").order("created_at", { ascending: false }),
      supabase.from("asset_hardware").select("asset_id").not("user_name", "is", null),
      supabase.from("asset_software").select("asset_id, assigned_quantity").not("user_name", "is", null),
    ]);

  if (hardwareSaveError) throw hardwareSaveError;
  if (softwareSaveError) throw softwareSaveError;
  if (hardwareError) throw hardwareError;
  if (softwareError) throw softwareError;

  const hardwareAssignedCountMap = new Map<string, number>();
  for (const row of hardwareRows ?? []) {
    if (!row.asset_id) continue;
    hardwareAssignedCountMap.set(row.asset_id, (hardwareAssignedCountMap.get(row.asset_id) ?? 0) + 1);
  }

  const softwareAssignedCountMap = new Map<string, number>();
  for (const row of softwareRows ?? []) {
    if (!row.asset_id) continue;
    softwareAssignedCountMap.set(row.asset_id, (softwareAssignedCountMap.get(row.asset_id) ?? 0) + Math.max(1, row.assigned_quantity ?? 1));
  }

  return [
    ...((hardwareSaveRows ?? []) as HardwareSaveRow[]).map((row) => mapHardwareSaveAsset(row, hardwareAssignedCountMap.get(row.id) ?? 0)),
    ...((softwareSaveRows ?? []) as SoftwareSaveRow[]).map((row) => mapSoftwareSaveAsset(row, softwareAssignedCountMap.get(row.id) ?? 0)),
  ].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function listHardwareAssignments(): Promise<HardwareAssignment[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("asset_hardware")
    .select("id, asset_id, user_name, department, category, pc_name, os, mac_address, ip_address, created_at")
    .not("user_name", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .filter((row): row is HardwareAssignmentRow => Boolean(row.user_name?.trim()))
    .map((row) => ({
      id: row.id,
      assetCode: normalizeHardwareCategory(row.category),
      category: normalizeHardwareCategory(row.category),
      userName: row.user_name ?? "",
      department: row.department ?? "-",
      assignedAt: row.created_at,
      pcName: row.pc_name ?? undefined,
      os: row.os ?? undefined,
      macAddress: row.mac_address ?? undefined,
      ipAddress: row.ip_address ?? undefined,
    }));
}

export async function listSoftwareAssignments(): Promise<SoftwareAssignment[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("asset_software")
    .select("id, asset_id, user_name, department, software_name, category, assigned_quantity, total_seats, available_seats, assigned_at, expires_at")
    .not("user_name", "is", null)
    .order("assigned_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .filter((row): row is SoftwareAssignmentRow => Boolean(row.user_name?.trim()) && Boolean(row.asset_id))
    .map((row) => ({
      id: row.id,
      softwareAssetCode: row.asset_id!,
      softwareName: row.software_name ?? row.category ?? "-",
      category: row.category ?? "-",
      userName: row.user_name ?? "",
      department: row.department ?? "-",
      assignedSeats: Math.max(1, row.assigned_quantity ?? 1),
      totalSeats: row.total_seats ?? undefined,
      availableSeats: row.available_seats ?? undefined,
      assignedAt: row.assigned_at ?? new Date().toISOString(),
      expiresAt: row.expires_at ?? undefined,
    }));
}

async function getHardwareAssignedQuantity(assetId: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { count, error } = await supabase
    .from("asset_hardware")
    .select("id", { count: "exact", head: true })
    .eq("asset_id", assetId)
    .not("user_name", "is", null);

  if (error) throw error;
  return count ?? 0;
}

async function getSoftwareAssignedQuantity(assetId: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("asset_software")
    .select("assigned_quantity")
    .eq("asset_id", assetId)
    .not("user_name", "is", null);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Math.max(1, row.assigned_quantity ?? 1), 0);
}

export async function createAsset(draft: AssetDraft, type: AssetType): Promise<Asset[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const incomingQuantity = Math.max(1, draft.quantity ?? draft.totalQuantity ?? 1);
  const createdAt = resolveCreatedAt(draft.createdAt);

  if (type === "hardware") {
    const insertPayload: Record<string, unknown> = {
      category: draft.category,
      os: draft.os?.trim() || null,
      vendor: draft.vendor?.trim() || null,
      unit_price: draft.unitPrice ?? 0,
      acquired_at: draft.acquiredAt || null,
      quantity: incomingQuantity,
      note: draft.note?.trim() || null,
    };
    insertPayload.created_at = createdAt;

    const { data, error } = await supabase
      .from("asset_hardware_save")
      .insert(insertPayload)
      .select("id, category, os, vendor, unit_price, acquired_at, quantity, note, created_at")
      .single();

    if (error) throw error;
    return [mapHardwareSaveAsset(data as HardwareSaveRow, 0)];
  }

  const softwareName = (draft.softwareName ?? draft.name).trim();
  if (!softwareName) {
    throw new Error("소프트웨어명은 비어 있을 수 없습니다.");
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("asset_software_save")
    .select("id, category, software_name, unit_price, expires_at, quantity, note, created_at")
    .eq("software_name", softwareName)
    .order("created_at", { ascending: true })
    .limit(1);

  if (existingError) throw existingError;
  const existing = (existingRows?.[0] as SoftwareSaveRow | undefined) ?? null;
  if (existing) {
    const updatePayload: Record<string, unknown> = {
      category: draft.category,
      software_name: softwareName,
      unit_price: draft.unitPrice ?? 0,
      expires_at: draft.expiresAt || null,
      quantity: incomingQuantity,
      note: draft.note?.trim() || null,
    };
    updatePayload.created_at = createdAt;

    const { data, error } = await supabase
      .from("asset_software_save")
      .update(updatePayload)
      .eq("id", existing.id)
      .select("id, category, software_name, unit_price, expires_at, quantity, note, created_at")
      .single();

    if (error) throw error;
    const assignedQuantity = await getSoftwareAssignedQuantity(existing.id);
    return [mapSoftwareSaveAsset(data as SoftwareSaveRow, assignedQuantity)];
  }

  const softwareInsertPayload: Record<string, unknown> = {
    category: draft.category,
    software_name: softwareName,
    unit_price: draft.unitPrice ?? 0,
    expires_at: draft.expiresAt || null,
    quantity: incomingQuantity,
    note: draft.note?.trim() || null,
  };
  softwareInsertPayload.created_at = createdAt;

  const { data, error } = await supabase
    .from("asset_software_save")
    .insert(softwareInsertPayload)
    .select("id, category, software_name, unit_price, expires_at, quantity, note, created_at")
    .single();

  if (error) throw error;
  return [mapSoftwareSaveAsset(data as SoftwareSaveRow, 0)];
}

export async function updateAsset(assetId: string, asset: Asset): Promise<Asset> {
  if (!supabase) throw new Error("Supabase is not configured");
  const createdAt = resolveCreatedAt(asset.createdAt);

  if (asset.type === "hardware") {
    const updatePayload: Record<string, unknown> = {
      category: asset.category,
      os: asset.os?.trim() || null,
      vendor: asset.vendor?.trim() || null,
      unit_price: asset.unitPrice ?? 0,
      acquired_at: asset.acquiredAt || null,
      quantity: Math.max(0, asset.totalQuantity ?? asset.quantity ?? 0),
      note: asset.note ?? null,
    };
    updatePayload.created_at = createdAt;

    const { data, error } = await supabase
      .from("asset_hardware_save")
      .update(updatePayload)
      .eq("id", assetId)
      .select("id, category, os, vendor, unit_price, acquired_at, quantity, note, created_at")
      .single();

    if (error) throw error;

    const assignedQuantity = await getHardwareAssignedQuantity(assetId);
    return mapHardwareSaveAsset(data as HardwareSaveRow, assignedQuantity);
  }

  const softwareName = (asset.softwareName ?? asset.name).trim();
  if (!softwareName) {
    throw new Error("소프트웨어명은 비어 있을 수 없습니다.");
  }

  const softwareUpdatePayload: Record<string, unknown> = {
    category: asset.category,
    software_name: softwareName,
    unit_price: asset.unitPrice ?? 0,
    expires_at: asset.expiresAt || null,
    quantity: Math.max(0, asset.totalQuantity ?? asset.quantity ?? 0),
    note: asset.note ?? null,
  };
  softwareUpdatePayload.created_at = createdAt;

  const { data, error } = await supabase
    .from("asset_software_save")
    .update(softwareUpdatePayload)
    .eq("id", assetId)
    .select("id, category, software_name, unit_price, expires_at, quantity, note, created_at")
    .single();

  if (error) throw error;

  const assignedQuantity = await getSoftwareAssignedQuantity(assetId);
  return mapSoftwareSaveAsset(data as SoftwareSaveRow, assignedQuantity);
}

export async function assignHardwareAsset(
  assetId: string,
  payload: { userName: string; department: string; os?: string; macAddress?: string; ipAddress?: string }
) {
  if (!supabase) throw new Error("Supabase is not configured");

  const asset = await getAssetMasterById(assetId, "hardware");
  const { count, error: countError } = await supabase
    .from("asset_hardware")
    .select("id", { count: "exact", head: true })
    .eq("asset_id", asset.id)
    .not("user_name", "is", null);

  if (countError) throw countError;
  if ((count ?? 0) >= Math.max(0, asset.quantity ?? 0)) {
    throw new Error(`하드웨어 ${asset.category}의 잔여 수량이 부족합니다.`);
  }

  const { error } = await supabase.from("asset_hardware").insert({
    asset_id: asset.id,
    user_name: payload.userName,
    department: payload.department,
    status: "사용",
    category: asset.category,
    unit_price: asset.unit_price ?? 0,
    acquired_at: asset.acquired_at ?? null,
    os: payload.os ?? null,
    mac_address: payload.macAddress ?? null,
    ip_address: payload.ipAddress ?? null,
    note: "자산 할당",
  });

  if (error) throw error;
}

export async function reclaimHardwareAssignment(assignmentId: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("asset_hardware").delete().eq("id", assignmentId);
  if (error) throw error;
}

export async function assignSoftwareSeats(assetId: string, payload: { userName: string; department: string; seats?: number }) {
  if (!supabase) throw new Error("Supabase is not configured");

  const asset = await getAssetMasterById(assetId, "software");
  const seats = Math.max(1, payload.seats ?? 1);
  const { data: existingAssignments, error: assignmentError } = await supabase
    .from("asset_software")
    .select("assigned_quantity")
    .eq("asset_id", asset.id)
    .not("user_name", "is", null);

  if (assignmentError) throw assignmentError;

  const assignedSeats = (existingAssignments ?? []).reduce((sum, row) => sum + Math.max(1, row.assigned_quantity ?? 1), 0);
  if (Math.max(0, asset.quantity ?? 0) - assignedSeats < seats) {
    throw new Error(`소프트웨어 ${asset.category}의 잔여 좌석이 부족합니다.`);
  }

  const { error } = await supabase.from("asset_software").insert({
    asset_id: asset.id,
    software_name: asset.software_name,
    status: "사용",
    category: asset.category,
    unit_price: asset.unit_price ?? 0,
    total_seats: Math.max(1, asset.quantity ?? 1),
    available_seats: Math.max(Math.max(0, asset.quantity ?? 0) - assignedSeats - seats, 0),
    expires_at: asset.expires_at ?? null,
    user_name: payload.userName,
    department: payload.department,
    assigned_quantity: seats,
    assigned_at: new Date().toISOString(),
    note: "자산 할당",
  });

  if (error) throw error;
}

export async function reclaimSoftwareAssignment(assignmentId: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("asset_software").delete().eq("id", assignmentId);
  if (error) throw error;
}

export async function importAssetsBulk(rows: ImportedAssetRow[]): Promise<Asset[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  if (rows.length === 0) return [];

  const hardwareAssignmentRows = rows.filter((row) => row.importKind === "assignment" && row.type === "hardware");
  const softwareAssignmentRows = rows.filter((row) => row.importKind === "assignment" && row.type === "software");
  const hardwareRows = rows.filter((row) => row.importKind !== "assignment" && row.type === "hardware");
  const softwareRows = rows.filter((row) => row.importKind !== "assignment" && row.type === "software");

  const hardwareInserts = hardwareRows.map((row) => ({
    category: normalizeHardwareCategory(row.category),
    os: row.os?.trim() || null,
    vendor: row.vendor?.trim() || null,
    unit_price: row.unitPrice ?? 0,
    acquired_at: row.acquiredAt ?? null,
    quantity: Math.max(1, row.quantity ?? 1),
    note: row.note ?? null,
    created_at: resolveCreatedAt(row.createdAt),
  }));

  const softwareGrouped = new Map<
    string,
    {
      category: string;
      softwareName: string;
      unitPrice: number;
      quantity: number;
      expiresAt: string | null;
      note: string | null;
      createdAt?: string;
      rows: ImportedAssetRow[];
    }
  >();

  for (const row of softwareRows) {
    const softwareName = (row.softwareName ?? "").trim();
    if (!softwareName) throw new Error("소프트웨어 엑셀 행에는 software_name 값이 필요합니다.");

    const key = `${row.category}::${softwareName}`;
    const seats = Math.max(1, row.totalQuantity ?? row.quantity ?? row.availableQuantity ?? 1);
    const existing = softwareGrouped.get(key);
    if (existing) {
      existing.quantity = Math.max(existing.quantity, seats);
      if (row.expiresAt) existing.expiresAt = row.expiresAt;
      if (row.note) existing.note = row.note;
      existing.rows.push(row);
    } else {
      softwareGrouped.set(key, {
        category: row.category,
        softwareName,
        unitPrice: row.unitPrice ?? 0,
        quantity: seats,
        expiresAt: row.expiresAt ?? null,
        note: row.note ?? null,
        createdAt: row.createdAt,
        rows: [row],
      });
    }
  }

  const { data: existingSoftwareSaves, error: existingSoftwareSaveError } = await supabase
    .from("asset_software_save")
    .select("id, category, software_name, unit_price, expires_at, quantity, note, created_at");
  if (existingSoftwareSaveError) throw existingSoftwareSaveError;

  const softwareSaveByName = new Map<string, SoftwareSaveRow>();
  for (const row of (existingSoftwareSaves ?? []) as SoftwareSaveRow[]) {
    if (!softwareSaveByName.has(row.software_name)) softwareSaveByName.set(row.software_name, row);
  }

  if (hardwareAssignmentRows.length > 0) {
    const { data: hardwareMasters, error: hardwareMastersError } = await supabase
      .from("asset_hardware_save")
      .select("id, category, quantity")
      .order("created_at", { ascending: true });
    if (hardwareMastersError) throw hardwareMastersError;

    const hardwareMasterMap = new Map<string, { id: string; quantity: number }>();
    for (const row of hardwareMasters ?? []) {
      const key = normalizeHardwareCategory(row.category);
      if (!hardwareMasterMap.has(key)) {
        hardwareMasterMap.set(key, { id: row.id, quantity: Math.max(0, row.quantity ?? 0) });
      }
    }

    const { error: deleteHardwareError } = await supabase.from("asset_hardware").delete().not("id", "is", null);
    if (deleteHardwareError) throw deleteHardwareError;

    const hardwareAssignmentInserts = hardwareAssignmentRows.map((row) => {
      const normalizedCategory = normalizeHardwareCategory(row.category);
      const master = hardwareMasterMap.get(normalizedCategory);
      return {
        asset_id: master?.id ?? null,
        user_name: row.name,
        department: row.department ?? null,
        status: "사용",
        category: normalizedCategory,
        unit_price: 0,
        acquired_at: null,
        pc_name: row.pcName?.trim() || null,
        os: row.os?.trim() || null,
        mac_address: row.macAddress?.trim() || null,
        ip_address: row.ipAddress?.trim() || null,
        note: "엑셀 Import",
        created_at: resolveCreatedAt(row.createdAt),
      };
    });

    if (hardwareAssignmentInserts.length > 0) {
      const { error } = await supabase.from("asset_hardware").insert(hardwareAssignmentInserts);
      if (error) throw error;
    }
  }

  if (softwareAssignmentRows.length > 0) {
    const { data: softwareMasters, error: softwareMastersError } = await supabase
      .from("asset_software_save")
      .select("id, category, software_name, quantity, unit_price, expires_at")
      .order("created_at", { ascending: true });
    if (softwareMastersError) throw softwareMastersError;

    const softwareMasterMap = new Map<string, { id: string; category: string; quantity: number; unitPrice: number; expiresAt: string | null }>();
    for (const row of softwareMasters ?? []) {
      if (!softwareMasterMap.has(row.software_name)) {
        softwareMasterMap.set(row.software_name, {
          id: row.id,
          category: row.category,
          quantity: Math.max(0, row.quantity ?? 0),
          unitPrice: row.unit_price ?? 0,
          expiresAt: row.expires_at ?? null,
        });
      }
    }

    const { error: deleteSoftwareError } = await supabase.from("asset_software").delete().not("id", "is", null);
    if (deleteSoftwareError) throw deleteSoftwareError;

    const groupedAssignments = new Map<string, ImportedAssetRow[]>();
    for (const row of softwareAssignmentRows) {
      const softwareName = (row.softwareName ?? "").trim();
      if (!softwareName) continue;
      const list = groupedAssignments.get(softwareName) ?? [];
      list.push(row);
      groupedAssignments.set(softwareName, list);
    }

    const softwareAssignmentInserts: Array<Record<string, unknown>> = [];
    for (const [softwareName, assignmentRows] of groupedAssignments.entries()) {
      const master = softwareMasterMap.get(softwareName);
      if (!master) {
        throw new Error(`등록된 소프트웨어 자산을 찾을 수 없습니다: ${softwareName}`);
      }

      let assignedSeats = 0;
      for (const row of assignmentRows) {
        const seats = Math.max(1, row.quantity ?? 1);
        assignedSeats += seats;
        softwareAssignmentInserts.push({
          asset_id: master.id,
          software_name: softwareName,
          user_name: row.name,
          department: row.department ?? null,
          assigned_quantity: seats,
          assigned_at: resolveCreatedAt(row.createdAt),
          status: "운영",
          category: row.category || master.category,
          unit_price: master.unitPrice,
          total_seats: master.quantity,
          available_seats: Math.max(master.quantity - assignedSeats, 0),
          expires_at: master.expiresAt,
          note: "엑셀 Import",
        });
      }
    }

    if (softwareAssignmentInserts.length > 0) {
      const { error } = await supabase.from("asset_software").insert(softwareAssignmentInserts);
      if (error) throw error;
    }
  }

  if (hardwareInserts.length > 0) {
    const { error } = await supabase.from("asset_hardware_save").insert(hardwareInserts);
    if (error) throw error;
  }

  for (const entry of softwareGrouped.values()) {
    const existing = softwareSaveByName.get(entry.softwareName);
    if (existing) {
      const { error } = await supabase
        .from("asset_software_save")
        .update({
          category: entry.category,
          software_name: entry.softwareName,
          unit_price: entry.unitPrice,
          quantity: entry.quantity,
          expires_at: entry.expiresAt,
          note: entry.note,
          created_at: resolveCreatedAt(entry.createdAt),
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("asset_software_save").insert({
        category: entry.category,
        software_name: entry.softwareName,
        unit_price: entry.unitPrice,
        quantity: entry.quantity,
        expires_at: entry.expiresAt,
        note: entry.note,
        created_at: resolveCreatedAt(entry.createdAt),
      });
      if (error) throw error;
    }
  }

  return listAssets();
}
