import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type GoogleWorkspaceLicenseRow = {
  id: string;
  run_id: string | null;
  product_id: string;
  sku_id: string;
  sku_name: string | null;
  user_id: string;
  user_email: string;
  created_at: string;
};

type GoogleWorkspaceLicenseRunRow = {
  id: string;
  status: string;
  total_products: number;
  total_assignments: number;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
};

export type GoogleWorkspaceLicense = {
  id: string;
  runId?: string;
  productId: string;
  skuId: string;
  skuName?: string;
  userId: string;
  userEmail: string;
  syncedAt: string;
};

export type GoogleWorkspaceLicenseRun = {
  id: string;
  status: "running" | "success" | "error";
  totalProducts: number;
  totalAssignments: number;
  startedAt: string;
  finishedAt?: string;
  errorMessage?: string;
};

type ImportedGoogleWorkspaceLicense = {
  productId: string;
  skuId: string;
  skuName?: string;
  userId: string;
  userEmail: string;
};

type GoogleWorkspaceImportRow = Record<string, string | number | boolean | null | undefined>;

const GOOGLE_WORKSPACE_HEADER_ALIASES = {
  productId: ["product id", "product_id", "product", "제품 id", "제품id", "제품"],
  skuId: ["sku id", "sku_id", "sku", "license sku", "licenses [read only]", "라이선스 sku", "sku 코드"],
  skuName: ["sku name", "sku_name", "license name", "license", "new licenses [upload only]", "라이선스명", "라이선스 이름", "상품명"],
  userEmail: ["user email", "user_email", "email", "email address [required]", "primary email", "사용자 이메일", "이메일", "계정", "사용자"],
  userId: ["user id", "user_id", "account id", "계정 id", "사용자 id"],
  firstName: ["first name", "first name [required]", "이름", "성"],
  lastName: ["last name", "last name [required]", "last name [required]", "성명", "이름(성 제외)", "이름(이름)"],
} satisfies Record<string, string[]>;

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function pickColumnValue(row: GoogleWorkspaceImportRow, aliases: string[]) {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const matched = entries.find(([key]) => normalizeHeader(key) === normalizedAlias);
    if (!matched) continue;

    const rawValue = matched[1];
    const value = typeof rawValue === "string" ? rawValue.trim() : String(rawValue ?? "").trim();
    if (value) return value;
  }
  return "";
}

function dedupeLicenses(rows: ImportedGoogleWorkspaceLicense[]) {
  const unique = new Map<string, ImportedGoogleWorkspaceLicense>();
  for (const row of rows) {
    unique.set(`${row.productId}::${row.skuId}::${row.userEmail.toLowerCase()}`, row);
  }
  return Array.from(unique.values());
}

function decodeCsvBuffer(buffer: ArrayBuffer) {
  const decoders = ["utf-8", "utf-8-sig", "euc-kr", "cp949"] as const;
  for (const encoding of decoders) {
    try {
      return new TextDecoder(encoding).decode(buffer);
    } catch {
      // Try the next decoder.
    }
  }
  return new TextDecoder("utf-8").decode(buffer);
}

export async function importGoogleWorkspaceLicensesFile(file: File) {
  if (!supabase) throw new Error("Supabase is not configured");

  const buffer = await file.arrayBuffer();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const workbook =
    extension === "csv"
      ? XLSX.read(decodeCsvBuffer(buffer), { type: "string" })
      : XLSX.read(buffer, { type: "array" });
  const rows = workbook.SheetNames.flatMap((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<GoogleWorkspaceImportRow>(worksheet, { defval: "" });
  });

  const parsedRows = dedupeLicenses(
    rows
      .map((row) => {
        const userEmail = pickColumnValue(row, GOOGLE_WORKSPACE_HEADER_ALIASES.userEmail).toLowerCase();
        const explicitUserId = pickColumnValue(row, GOOGLE_WORKSPACE_HEADER_ALIASES.userId);
        const firstName = pickColumnValue(row, GOOGLE_WORKSPACE_HEADER_ALIASES.firstName);
        const lastName = pickColumnValue(row, GOOGLE_WORKSPACE_HEADER_ALIASES.lastName);
        const displayName = [lastName, firstName].filter(Boolean).join("").trim();
        const userId = explicitUserId || displayName || userEmail;
        const skuId = pickColumnValue(row, GOOGLE_WORKSPACE_HEADER_ALIASES.skuId);
        const skuName = pickColumnValue(row, GOOGLE_WORKSPACE_HEADER_ALIASES.skuName) || undefined;
        const productId = pickColumnValue(row, GOOGLE_WORKSPACE_HEADER_ALIASES.productId) || "Google-Apps";

        if (!userEmail || !skuId) return null;
        return {
          productId,
          skuId,
          skuName,
          userId,
          userEmail,
        } satisfies ImportedGoogleWorkspaceLicense;
      })
      .filter((row): row is ImportedGoogleWorkspaceLicense => Boolean(row))
  );

  if (parsedRows.length === 0) {
    throw new Error("업로드 파일에서 사용자 이메일과 SKU ID를 읽지 못했습니다.");
  }

  const now = new Date().toISOString();
  const { data: runRow, error: runInsertError } = await supabase
    .from("asset_google_workspace_license_runs")
    .insert({
      status: "success",
      total_products: new Set(parsedRows.map((row) => row.productId)).size,
      total_assignments: parsedRows.length,
      started_at: now,
      finished_at: now,
      error_message: null,
    })
    .select("id")
    .single();

  if (runInsertError || !runRow?.id) throw runInsertError ?? new Error("라이선스 업로드 이력을 저장하지 못했습니다.");

  const { error: deleteError } = await supabase.from("asset_google_workspace_licenses").delete().not("id", "is", null);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase.from("asset_google_workspace_licenses").insert(
    parsedRows.map((row) => ({
      run_id: runRow.id,
      product_id: row.productId,
      sku_id: row.skuId,
      sku_name: row.skuName ?? null,
      user_id: row.userId,
      user_email: row.userEmail,
    }))
  );
  if (insertError) throw insertError;

  return {
    runId: String(runRow.id),
    totalAssignments: parsedRows.length,
    totalProducts: new Set(parsedRows.map((row) => row.productId)).size,
  };
}

function mapLicense(row: GoogleWorkspaceLicenseRow): GoogleWorkspaceLicense {
  return {
    id: row.id,
    runId: row.run_id ?? undefined,
    productId: row.product_id,
    skuId: row.sku_id,
    skuName: row.sku_name ?? undefined,
    userId: row.user_id,
    userEmail: row.user_email,
    syncedAt: row.created_at,
  };
}

function mapRun(row: GoogleWorkspaceLicenseRunRow): GoogleWorkspaceLicenseRun {
  return {
    id: row.id,
    status: (row.status as GoogleWorkspaceLicenseRun["status"]) ?? "error",
    totalProducts: row.total_products ?? 0,
    totalAssignments: row.total_assignments ?? 0,
    startedAt: row.started_at,
    finishedAt: row.finished_at ?? undefined,
    errorMessage: row.error_message ?? undefined,
  };
}

function isMissingWorkspaceLicenseSchema(error: unknown) {
  const message =
    typeof error === "object" && error !== null
      ? `${String((error as { message?: unknown }).message ?? "")} ${String((error as { details?: unknown }).details ?? "")}`
      : String(error ?? "");
  return message.includes("asset_google_workspace_license");
}

export async function listGoogleWorkspaceLicenses(limit?: number): Promise<GoogleWorkspaceLicense[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  let query = supabase
    .from("asset_google_workspace_licenses")
    .select("id, run_id, product_id, sku_id, sku_name, user_id, user_email, created_at")
    .order("user_email", { ascending: true })
    .order("sku_name", { ascending: true });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingWorkspaceLicenseSchema(error)) return [];
    throw error;
  }
  return (data ?? []).map((row) => mapLicense(row as GoogleWorkspaceLicenseRow));
}

export async function getLatestGoogleWorkspaceLicenseRun(): Promise<GoogleWorkspaceLicenseRun | null> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("asset_google_workspace_license_runs")
    .select("id, status, total_products, total_assignments, started_at, finished_at, error_message")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingWorkspaceLicenseSchema(error)) return null;
    throw error;
  }
  return data ? mapRun(data as GoogleWorkspaceLicenseRunRow) : null;
}

export async function syncGoogleWorkspaceLicenses() {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase is not configured");

  const response = await fetch(`${supabaseUrl}/functions/v1/google-workspace-license-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({}),
  });

  let payload: unknown = null;
  let rawText = "";
  try {
    payload = await response.clone().json();
  } catch {
    rawText = await response.text().catch(() => "");
  }

  if (!response.ok) {
    if (payload && typeof payload === "object" && "error" in payload) {
      throw new Error(String((payload as { error?: unknown }).error ?? "Google Workspace 라이선스 동기화에 실패했습니다."));
    }
    if (rawText.trim()) throw new Error(rawText.trim());
    throw new Error(`Google Workspace 라이선스 동기화에 실패했습니다. (${response.status})`);
  }

  return (payload ?? {}) as { runId?: string; totalAssignments?: number; totalProducts?: number };
}
