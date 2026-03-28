import { supabase } from "@/lib/supabase";
import type { AuditLog } from "@/features/asset-management/types";

type AuditLogRow = {
  id: string;
  type: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  created_at: string;
};

function mapAuditLogRow(row: AuditLogRow, index: number): AuditLog {
  return {
    id: index + 1,
    type: row.type,
    actor: row.actor,
    action: row.action,
    target: row.target,
    ip: row.ip,
    createdAt: row.created_at.slice(0, 19).replace("T", " "),
  };
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("asset_audit_logs")
    .select("id, type, actor, action, target, ip, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row, index) => mapAuditLogRow(row as AuditLogRow, index));
}

export async function createAuditLog(input: {
  type: string;
  actor: string;
  action: string;
  target: string;
  ip?: string;
}) {
  if (!supabase) return;

  const { error } = await supabase.from("asset_audit_logs").insert({
    type: input.type,
    actor: input.actor,
    action: input.action,
    target: input.target,
    ip: input.ip ?? "client",
  });

  if (error) throw error;
}
