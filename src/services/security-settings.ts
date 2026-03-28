import { supabase } from "@/lib/supabase";

type SecuritySettingsRow = {
  id: string;
  allowed_domain: string;
  session_timeout: string;
};

export type SecuritySettingsValue = {
  allowedDomains: string[];
  sessionTimeout: string;
};

function parseAllowedDomains(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function serializeAllowedDomains(value: string[]) {
  return value
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .join(",");
}

export async function getSecuritySettings(): Promise<SecuritySettingsValue | null> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("asset_security_settings")
    .select("id, allowed_domain, session_timeout")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    allowedDomains: parseAllowedDomains(data.allowed_domain),
    sessionTimeout: data.session_timeout,
  };
}

export async function saveSecuritySettings(value: SecuritySettingsValue): Promise<SecuritySettingsValue> {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: existing, error: lookupError } = await supabase
    .from("asset_security_settings")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const payload = {
    allowed_domain: serializeAllowedDomains(value.allowedDomains),
    session_timeout: value.sessionTimeout,
  };

  let savedRow: SecuritySettingsRow | null = null;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("asset_security_settings")
      .update(payload)
      .eq("id", existing.id)
      .select("id, allowed_domain, session_timeout")
      .single();

    if (error) throw error;
    savedRow = data;
  } else {
    const { data, error } = await supabase
      .from("asset_security_settings")
      .insert(payload)
      .select("id, allowed_domain, session_timeout")
      .single();

    if (error) throw error;
    savedRow = data;
  }

  return {
    allowedDomains: parseAllowedDomains(savedRow.allowed_domain),
    sessionTimeout: savedRow.session_timeout,
  };
}
