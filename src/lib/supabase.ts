import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (typeof window !== "undefined") {
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (!key || !/^sb-.*-auth-token$/.test(key)) continue;

    const currentValue = window.localStorage.getItem(key);
    if (currentValue) continue;

    const legacyValue = window.sessionStorage.getItem(key);
    if (!legacyValue) continue;

    window.localStorage.setItem(key, legacyValue);
  }
}

const browserAuthStorage =
  typeof window !== "undefined"
    ? {
        getItem: (key: string) => window.localStorage.getItem(key),
        setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
        removeItem: (key: string) => window.localStorage.removeItem(key),
      }
    : undefined;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: browserAuthStorage,
        persistSession: true,
      },
    })
  : null;
