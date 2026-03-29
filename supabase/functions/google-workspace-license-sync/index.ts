import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

type LicenseAssignment = {
  productId?: string;
  skuId?: string;
  userId?: string;
};

type LicenseAssignmentPage = {
  items?: LicenseAssignment[];
  nextPageToken?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parsePrivateKey(value: string) {
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function base64UrlEncode(input: string | Uint8Array) {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : input;

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signJwt(unsignedToken: string, privateKeyPem: string) {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsignedToken));
  return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function getGoogleAccessToken() {
  const clientEmail = getRequiredEnv("GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL");
  const privateKey = parsePrivateKey(getRequiredEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"));
  const impersonatedAdmin = getRequiredEnv("GOOGLE_WORKSPACE_IMPERSONATED_ADMIN_EMAIL");
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      sub: impersonatedAdmin,
      scope: "https://www.googleapis.com/auth/apps.licensing",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const assertion = await signJwt(`${header}.${payload}`, privateKey);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to obtain Google access token: ${await tokenResponse.text()}`);
  }

  const tokenPayload = await tokenResponse.json();
  if (!tokenPayload.access_token) throw new Error("Google token response did not include an access token.");
  return tokenPayload.access_token as string;
}

async function listAssignmentsForProduct(accessToken: string, productId: string, customerId: string) {
  const assignments: LicenseAssignment[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`https://licensing.googleapis.com/apps/licensing/v1/product/${encodeURIComponent(productId)}/users`);
    url.searchParams.set("customerId", customerId);
    url.searchParams.set("maxResults", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Workspace licenses for ${productId}: ${await response.text()}`);
    }

    const payload = (await response.json()) as LicenseAssignmentPage;
    assignments.push(...(payload.items ?? []));
    pageToken = payload.nextPageToken;
  } while (pageToken);

  return assignments;
}

function parseSkuNameMap() {
  const raw = Deno.env.get("GOOGLE_WORKSPACE_SKU_NAME_MAP")?.trim();
  if (!raw) return {} as Record<string, string>;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {} as Record<string, string>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string")
    );
  } catch {
    return {} as Record<string, string>;
  }
}

async function updateRunStatus(
  supabaseAdmin: ReturnType<typeof createClient>,
  runId: string,
  payload: Record<string, unknown>
) {
  const { error } = await supabaseAdmin.from("asset_google_workspace_license_runs").update(payload).eq("id", runId);
  if (error) throw error;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const productIds = getRequiredEnv("GOOGLE_WORKSPACE_LICENSE_PRODUCT_IDS")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (productIds.length === 0) {
      throw new Error("GOOGLE_WORKSPACE_LICENSE_PRODUCT_IDS must include at least one product id.");
    }

    const customerId = Deno.env.get("GOOGLE_WORKSPACE_CUSTOMER_ID")?.trim() || "my_customer";
    const skuNameMap = parseSkuNameMap();

    const { data: runRow, error: runInsertError } = await supabaseAdmin
      .from("asset_google_workspace_license_runs")
      .insert({
        status: "running",
        total_products: productIds.length,
        total_assignments: 0,
      })
      .select("id")
      .single();

    if (runInsertError || !runRow?.id) throw runInsertError ?? new Error("Failed to create sync run.");
    const runId = runRow.id as string;

    try {
      const accessToken = await getGoogleAccessToken();
      const allAssignments = (
        await Promise.all(productIds.map((productId) => listAssignmentsForProduct(accessToken, productId, customerId)))
      ).flatMap((assignments, index) =>
        assignments
          .filter((assignment) => assignment.skuId && assignment.userId)
          .map((assignment) => ({
            run_id: runId,
            product_id: assignment.productId ?? productIds[index],
            sku_id: assignment.skuId!,
            sku_name: skuNameMap[assignment.skuId!] ?? null,
            user_id: assignment.userId!,
            user_email: assignment.userId!,
          }))
      );

      const { error: deleteError } = await supabaseAdmin.from("asset_google_workspace_licenses").delete().not("id", "is", null);
      if (deleteError) throw deleteError;

      if (allAssignments.length > 0) {
        const { error: insertError } = await supabaseAdmin.from("asset_google_workspace_licenses").insert(allAssignments);
        if (insertError) throw insertError;
      }

      await updateRunStatus(supabaseAdmin, runId, {
        status: "success",
        total_assignments: allAssignments.length,
        finished_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          runId,
          totalProducts: productIds.length,
          totalAssignments: allAssignments.length,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      await updateRunStatus(supabaseAdmin, runId, {
        status: "error",
        error_message: error instanceof Error ? error.message : String(error),
        finished_at: new Date().toISOString(),
      });
      throw error;
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
