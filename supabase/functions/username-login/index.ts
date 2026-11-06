import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond(405, { error: "method_not_allowed" });

  let payload: { username?: string; password?: string };
  try {
    payload = await request.json();
  } catch {
    return respond(400, { error: "invalid_request" });
  }

  const username = String(payload.username ?? "").trim().replace(/^@/, "").toLowerCase();
  const password = String(payload.password ?? "");
  if (!/^[a-z0-9._-]{3,24}$/.test(username) || !password || password.length > 1024) {
    return respond(400, { error: "invalid_credentials" });
  }

  // The public key is already sent by the Supabase client in the `apikey` header.
  // It is safe to use as the Auth API key; the service-role key never leaves this function.
  const publicKey = request.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!publicKey || !supabaseUrl || !serviceRoleKey) {
    return respond(500, { error: "configuration_error" });
  }

  const { data: profile, error: profileError } = await admin
    .from("studymaximizer_profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  // A database/configuration error is different from a missing username, but never return account details.
  if (profileError) return respond(503, { error: "profile_configuration_error" });
  // Keep the response generic to avoid revealing which usernames are registered.
  if (!profile?.user_id) return respond(401, { error: "invalid_credentials" });

  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.user_id);
  const email = userResult?.user?.email;
  if (userError || !email) return respond(401, { error: "invalid_credentials" });

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publicKey,
      Authorization: `Bearer ${publicKey}`,
    },
    body: JSON.stringify({ email, password }),
  });
  const authBody = await authResponse.json().catch(() => ({}));
  if (!authResponse.ok) {
    const authCode = String(authBody.error_code || authBody.code || "").toLowerCase();
    if (authCode === "email_not_confirmed" || String(authBody.msg || authBody.message || "").toLowerCase().includes("email not confirmed")) {
      // This is returned only after Auth has validated the password, so it does not expose the state of arbitrary usernames.
      return respond(200, { error: "email_not_confirmed" });
    }
    return respond(authResponse.status === 429 ? 429 : 401, {
      error: authResponse.status === 429 ? "too_many_attempts" : "invalid_credentials",
    });
  }
  return respond(200, authBody as Record<string, unknown>);
});
