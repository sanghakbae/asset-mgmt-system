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
    .select("id, name, email, department, role, joined_at, last_login_at")
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
    .select("id, name, email, department, role, joined_at, last_login_at")
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
  };

  const { data, error } = await supabase
    .from("asset_members")
    .upsert(payload, { onConflict: "email" })
    .select("id, name, email, department, role, joined_at, last_login_at")
    .single();

  if (error) throw error;

  return mapMemberRow(data, 0);
}
