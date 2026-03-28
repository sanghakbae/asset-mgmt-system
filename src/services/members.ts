import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Member, Role } from "@/features/asset-management/types";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: Role;
  joined_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
};

function mapMemberRow(row: MemberRow, index: number): Member {
  return {
    id: index + 1,
    name: row.name,
    email: row.email,
    department: row.department,
    role: row.role,
    joinedAt: row.joined_at.slice(0, 10),
    lastLoginAt: row.last_login_at ? row.last_login_at.slice(0, 16).replace("T", " ") : "-",
    lastLoginIp: row.last_login_ip ?? "-",
  };
}

function getDisplayName(user: User) {
  const metadata = user.user_metadata ?? {};
  return metadata.name || metadata.full_name || user.email?.split("@")[0] || "사용자";
}

export async function listMembers(): Promise<Member[]> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("asset_members")
    .select("id, name, email, department, role, joined_at, last_login_at, last_login_ip")
    .order("joined_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapMemberRow);
}

export async function ensureMemberForAuthUser(user: User): Promise<Member> {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!user.email) throw new Error("이메일이 없는 계정은 로그인할 수 없습니다.");

  const normalizedEmail = user.email.toLowerCase();
  const { data: existing, error: lookupError } = await supabase
    .from("asset_members")
    .select("id, name, email, department, role, joined_at, last_login_at, last_login_ip")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const payload = {
    name: existing?.name || getDisplayName(user),
    email: normalizedEmail,
    department: existing?.department || "",
    role: existing?.role || ("User" as Role),
    joined_at: existing?.joined_at || new Date().toISOString(),
    last_login_at: new Date().toISOString(),
    last_login_ip: existing?.last_login_ip || "unknown",
  };

  const { data, error } = await supabase
    .from("asset_members")
    .upsert(payload, { onConflict: "email" })
    .select("id, name, email, department, role, joined_at, last_login_at, last_login_ip")
    .single();

  if (error) throw error;

  return mapMemberRow(data, 0);
}

export async function updateMember(input: { email: string; role?: Role; department?: string }): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");

  const payload: { role?: Role; department?: string } = {};
  if (input.role) payload.role = input.role;
  if (input.department !== undefined) payload.department = input.department;

  const { error } = await supabase
    .from("asset_members")
    .update(payload)
    .eq("email", input.email.toLowerCase());

  if (error) throw error;
}

export async function deleteMember(email: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase.from("asset_members").delete().eq("email", email.toLowerCase());
  if (error) throw error;
}
