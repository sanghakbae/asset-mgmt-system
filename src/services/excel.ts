import * as XLSX from "xlsx";
import type { Asset, ImportedAssetRow, ImportedOrgMemberRow, OrgMember } from "@/features/asset-management/types";

type ExcelRow = {
  id?: string;
  asset_code?: string;
  name?: string;
  type?: string;
  category?: string;
  status?: string;
  unit_price?: string | number;
  quantity?: string | number;
};

type OrgMemberExcelRow = {
  이름?: string;
  직책?: string;
  분류?: string;
  셀?: string;
  유닛?: string;
  파트?: string;
  위치?: string;
};

function normalizeType(value: string) {
  const lowered = value.trim().toLowerCase();
  if (lowered === "hardware" || lowered === "하드웨어") return "hardware";
  if (lowered === "software" || lowered === "소프트웨어") return "software";
  return null;
}

export function exportAssetsToExcel(assets: Asset[]) {
  const rows = assets.map((asset) => ({
    asset_code: asset.id,
    name: asset.name,
    type: asset.type,
    category: asset.category,
    status: asset.status,
    unit_price: asset.unitPrice ?? 0,
    quantity: asset.quantity ?? 0,
  }));

  const workbook = XLSX.utils.book_new();
  const hardwareRows = rows.filter((asset) => asset.type === "hardware");
  const softwareRows = rows.filter((asset) => asset.type === "software");

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(hardwareRows), "하드웨어");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(softwareRows), "소프트웨어");
  XLSX.writeFile(workbook, "asset-assets.xlsx");
}

export async function importAssetsFromExcel(file: File): Promise<ImportedAssetRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });

  return rows
    .map((row) => {
      const type = normalizeType(String(row.type ?? ""));
      const name = String(row.name ?? "").trim();
      const category = String(row.category ?? "").trim();
      const status = String(row.status ?? "").trim();

      if (!type || !name || !category) return null;

      return {
        name,
        type,
        category,
        status: status || undefined,
        unitPrice: Number(row.unit_price || 0) || 0,
        quantity: Number(row.quantity || 0) || 0,
      } satisfies ImportedAssetRow;
    })
    .filter((row): row is ImportedAssetRow => row !== null);
}

export function exportOrgMembersToExcel(orgMembers: OrgMember[]) {
  const rows = orgMembers.map((member, index) => ({
    "#": index + 1,
    이름: member.name,
    직책: member.position,
    분류: member.category,
    셀: member.cell,
    유닛: member.unit,
    파트: member.part,
    위치: member.location,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "구성원_목록");
  XLSX.writeFile(workbook, "asset-org-members.xlsx");
}

export async function importOrgMembersFromExcel(file: File): Promise<ImportedOrgMemberRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const targetSheetName = workbook.SheetNames.includes("구성원_목록") ? "구성원_목록" : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];
  const rows = XLSX.utils.sheet_to_json<OrgMemberExcelRow>(worksheet, { defval: "" });

  return rows
    .map((row) => {
      const name = String(row["이름"] ?? "").trim();
      const position = String(row["직책"] ?? "").trim();
      const category = String(row["분류"] ?? "").trim();
      const cell = String(row["셀"] ?? "").trim();
      const unit = String(row["유닛"] ?? "").trim();
      const part = String(row["파트"] ?? "").trim();
      const location = String(row["위치"] ?? "").trim();

      if (!name || name === "합계") return null;

      return {
        name,
        position,
        category,
        cell,
        unit,
        part,
        location,
      } satisfies ImportedOrgMemberRow;
    })
    .filter((row): row is ImportedOrgMemberRow => row !== null);
}
