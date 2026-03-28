import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function signInWithGoogle() {
  if (!supabase) throw new Error("Supabase is not configured");

  const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
}

export async function signOutAuth() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function refreshCurrentSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data.session;
}
