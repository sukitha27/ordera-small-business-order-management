// Edge Function: delete-account
//
// Schedules a 30-day soft deletion of the calling user's account by setting
// deletion_scheduled_at on their business row. Verifies the password
// re-authentication first to prevent session-hijack scenarios.
//
// Path: supabase/functions/delete-account/index.ts
// Deploy: supabase functions deploy delete-account
//
// The user calls this from the client by hitting:
//   POST https://<project>.supabase.co/functions/v1/delete-account
// with their access token in Authorization header and
// { password, captchaToken } in body.
//
// captchaToken is required because Supabase has captcha enforcement enabled
// globally — signInWithPassword (used here for password verification) will
// reject calls without a fresh captcha token.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Read the user's JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("Missing authorization header", 401);
    }

    // Service-role client (admin operations)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Get the calling user from their JWT
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData.user) {
      return jsonError("Invalid session", 401);
    }
    const user = userData.user;

    // Parse the body for password + captcha token
    const body = await req.json().catch(() => ({}));
    const { password, captchaToken } = body as {
      password?: string;
      captchaToken?: string;
    };
    if (!password) {
      return jsonError("Password required for confirmation", 400);
    }
    if (!captchaToken) {
      return jsonError("Captcha token required", 400);
    }

    // Re-authenticate by attempting a password sign-in. If it fails,
    // the password is wrong and we abort. We pass the captchaToken because
    // the project has Cloudflare Turnstile enforcement enabled — without
    // a token, signInWithPassword would always fail.
    //
    // Note: Cloudflare Turnstile tokens are single-use. The token used here
    // is consumed and cannot be reused for the user's next login attempt.
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: user.email!,
      password,
      options: {
        captchaToken,
      },
    });
    if (signInError) {
      return jsonError("Incorrect password", 401);
    }

    // All checks passed. Schedule deletion by stamping the business row.
    const { error: updateError } = await supabaseAdmin
      .from("businesses")
      .update({ deletion_scheduled_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (updateError) {
      return jsonError(`Could not schedule deletion: ${updateError.message}`, 500);
    }

    // Return the cutoff date for the client to display
    const purgeAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_at: new Date().toISOString(),
        purge_at: purgeAt,
        message: "Account scheduled for deletion. You have 30 days to cancel.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    return jsonError(`Server error: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
});

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}