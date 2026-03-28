import * as XLSX from "xlsx";
import type { HardwareAssignment, ImportedAssetRow, ImportedOrgMemberRow, OrgMember, SoftwareAssignment } from "@/features/asset-management/types";
import { normalizeImportedText } from "@/features/asset-management/utils";

type ExcelRow = {
  id?: string;
  asset_code?: string;
  name?: string;
  software_name?: string;
  vendor?: string;
  type?: string;
  category?: string;
  status?: string;
  unit_price?: string | number;
  acquired_at?: string;
  total_quantity?: string | number;
  available_quantity?: string | number;
  quantity?: string | number;
  expires_at?: string;
  created_at?: string;
  os?: string;
  pc_name?: string;
  assignee?: string;
  department?: string;
  mac_address?: string;
  ip_address?: string;
  assigned_at?: string;
  note?: string;
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
  if (lowered.includes("소프트웨어")) return "software";
  return null;
}

function createAssetExcelRow(row: ExcelRow) {
  return {
    asset_code: row.asset_code ?? "",
    name: row.name ?? "",
    software_name: row.software_name ?? "",
    vendor: row.vendor ?? "",
    type: row.type ?? "",
    category: row.category ?? "",
    status: row.status ?? "",
    unit_price: row.unit_price ?? "",
    acquired_at: row.acquired_at ?? "",
    total_quantity: row.total_quantity ?? "",
    available_quantity: row.available_quantity ?? "",
    quantity: row.quantity ?? "",
    expires_at: row.expires_at ?? "",
    created_at: row.created_at ?? "",
    os: row.os ?? "",
    pc_name: row.pc_name ?? "",
    assignee: row.assignee ?? "",
    department: row.department ?? "",
    mac_address: row.mac_address ?? "",
    ip_address: row.ip_address ?? "",
    note: row.note ?? "",
  };
}

const HARDWARE_EXCEL_HEADERS = [
  "category",
  "unit_price",
  "quantity",
  "vendor",
  "acquired_at",
  "os",
  "note",
  "created_at",
] as const;

const SOFTWARE_EXCEL_HEADERS = [
  "category",
  "software_name",
  "unit_price",
  "quantity",
  "expires_at",
  "note",
  "created_at",
] as const;

const HARDWARE_ASSIGNMENT_EXCEL_HEADERS = [
  "name",
  "department",
  "category",
  "pc_name",
  "os",
  "mac_address",
  "ip_address",
  "assigned_at",
] as const;

const SOFTWARE_ASSIGNMENT_EXCEL_HEADERS = [
  "name",
  "department",
  "category",
  "software_name",
  "quantity",
  "assigned_at",
] as const;

function createSheetWithHeaders<T extends Record<string, unknown>>(rows: T[], headers: readonly string[]) {
  const worksheet = XLSX.utils.json_to_sheet([], { header: [...headers] });
  if (rows.length > 0) {
    XLSX.utils.sheet_add_json(worksheet, rows, {
      header: [...headers],
      skipHeader: true,
      origin: "A2",
    });
  }
  return worksheet;
}

function getTimestampLabel() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${year}${month}${day}${hour}${minute}`;
}

function applyWorksheetPresentation(
  worksheet: XLSX.WorkSheet,
  columnWidths: number[],
  headerStyle: { fill: string; text: string }
) {
  const rangeRef = worksheet["!ref"];
  if (!rangeRef) return;

  const range = XLSX.utils.decode_range(rangeRef);
  worksheet["!cols"] = columnWidths.map((wch) => ({ wch }));
  worksheet["!autofilter"] = { ref: rangeRef };
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      const cell = worksheet[cellAddress];
      if (!cell) continue;

      cell.s = {
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        font: {
          name: "KoPub돋움체",
          bold: rowIndex === 0,
          color: rowIndex === 0 ? { rgb: headerStyle.text } : undefined,
        },
        fill:
          rowIndex === 0
            ? {
                patternType: "solid",
                fgColor: { rgb: headerStyle.fill },
              }
            : undefined,
      };
    }
  }
}

export function exportAssetsToExcel(hardwareAssignments: HardwareAssignment[], softwareAssignments: SoftwareAssignment[]) {
  const workbook = XLSX.utils.book_new();
  const hardwareRows = hardwareAssignments.map((assignment) => ({
    name: assignment.userName,
    department: assignment.department,
    category: assignment.category,
    pc_name: assignment.pcName ?? "",
    os: assignment.os ?? "",
    mac_address: assignment.macAddress ?? "",
    ip_address: assignment.ipAddress ?? "",
    assigned_at: assignment.assignedAt,
  }));
  const softwareRows = softwareAssignments.map((assignment) => ({
    name: assignment.userName,
    department: assignment.department,
    category: assignment.category,
    software_name: assignment.softwareName,
    quantity: assignment.assignedSeats,
    assigned_at: assignment.assignedAt,
  }));

  const hardwareSheet = createSheetWithHeaders(hardwareRows, HARDWARE_ASSIGNMENT_EXCEL_HEADERS);
  const softwareSheet = createSheetWithHeaders(softwareRows, SOFTWARE_ASSIGNMENT_EXCEL_HEADERS);

  applyWorksheetPresentation(hardwareSheet, [14, 14, 12, 16, 16, 18, 16, 18], {
    fill: "000000",
    text: "FFFFFF",
  });
  applyWorksheetPresentation(softwareSheet, [14, 14, 12, 22, 10, 18], {
    fill: "000000",
    text: "FFFFFF",
  });

  XLSX.utils.book_append_sheet(workbook, hardwareSheet, "하드웨어");
  XLSX.utils.book_append_sheet(workbook, softwareSheet, "소프트웨어");
  XLSX.writeFile(workbook, `asset-assets-${getTimestampLabel()}.xlsx`);
}

export async function importAssetsFromExcel(file: File): Promise<ImportedAssetRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const targetSheetNames = workbook.SheetNames.filter((sheetName) => ["하드웨어", "소프트웨어"].includes(sheetName));
  const sheetNamesToRead = targetSheetNames.length > 0 ? targetSheetNames : workbook.SheetNames;
  const rows = sheetNamesToRead.flatMap((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const inferredType = normalizeType(sheetName);
    const isAssignmentSheet = sheetName === "하드웨어" || sheetName === "소프트웨어";
    return XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" }).map((row) => ({
      row,
      inferredType,
      isAssignmentSheet,
    }));
  });

  return rows
    .map(({ row, inferredType, isAssignmentSheet }) => {
      const type = inferredType ?? normalizeType(String(row.type ?? ""));
      const name = normalizeImportedText(row.name);
      const softwareName = normalizeImportedText(row.software_name);
      const category = normalizeImportedText(row.category);
      const normalizedCategory = category || (type === "software" ? "기타" : "");
      if (!type || !normalizedCategory) return null;

      if (isAssignmentSheet) {
        if (type === "hardware") {
          if (!name) return null;
          return {
            importKind: "assignment",
            name,
            type,
            category: normalizedCategory,
            department: normalizeImportedText(row.department) || undefined,
            createdAt: normalizeImportedText(row.assigned_at) || undefined,
            os: normalizeImportedText(row.os) || undefined,
            pcName: normalizeImportedText(row.pc_name) || undefined,
            macAddress: normalizeImportedText(row.mac_address) || undefined,
            ipAddress: normalizeImportedText(row.ip_address) || undefined,
          } satisfies ImportedAssetRow;
        }

        if (!softwareName || !name) return null;
        return {
          importKind: "assignment",
          name,
          softwareName,
          type,
          category: normalizedCategory,
          department: normalizeImportedText(row.department) || undefined,
          createdAt: normalizeImportedText(row.assigned_at) || undefined,
          quantity: Number(row.quantity || 0) || 1,
        } satisfies ImportedAssetRow;
      }

      if (type === "software" && !softwareName) return null;

      return {
        importKind: "asset",
        name,
        softwareName: type === "software" ? softwareName : undefined,
        type,
        category: normalizedCategory,
        unitPrice: Number(row.unit_price || 0) || 0,
        acquiredAt: normalizeImportedText(row.acquired_at) || undefined,
        createdAt: normalizeImportedText(row.created_at) || undefined,
        expiresAt: normalizeImportedText(row.expires_at) || undefined,
        totalQuantity: type === "software" ? Number(row.quantity || 0) || 0 : undefined,
        availableQuantity: type === "software" ? Number(row.quantity || 0) || 0 : undefined,
        quantity: Number(row.quantity || 0) || 0,
        vendor: normalizeImportedText(row.vendor) || undefined,
        os: normalizeImportedText(row.os) || undefined,
        note: normalizeImportedText(row.note) || undefined,
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
  const worksheet = createSheetWithHeaders(rows, ["#", "이름", "직책", "분류", "셀", "유닛", "파트", "위치"]);
  applyWorksheetPresentation(worksheet, [8, 14, 12, 12, 12, 12, 12, 14], {
    fill: "000000",
    text: "FFFFFF",
  });
  XLSX.utils.book_append_sheet(workbook, worksheet, "구성원_목록");
  XLSX.writeFile(workbook, `asset-org-members-${getTimestampLabel()}.xlsx`);
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
