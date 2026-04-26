// Edge Function: purge-deleted-accounts
//
// Runs on a schedule (daily). Finds businesses whose deletion_scheduled_at
// is older than 30 days, then permanently deletes:
//   1. All storage objects in business-assets/{business_id}/
//   2. All storage objects in payment-slips/{business_id}/
//   3. The auth.users row (cascades via FK to all DB rows including
//      orders, products, customers, business itself, user_roles,
//      payment_slips, order_events, order_items)
//
// Path: supabase/functions/purge-deleted-accounts/index.ts
// Deploy: supabase functions deploy purge-deleted-accounts
//
// Schedule via Supabase Dashboard:
//   Database → Cron Jobs → Create Job
//   Name: purge-deleted-accounts
//   Schedule: 0 2 * * *  (daily at 02:00 UTC)
//   HTTP request to:
//     https://<project>.supabase.co/functions/v1/purge-deleted-accounts
//   Headers: Authorization: Bearer <SERVICE_ROLE_KEY>
//
// Or invoke manually for testing:
//   curl -X POST -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
//     https://<project>.supabase.co/functions/v1/purge-deleted-accounts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  // Reject non-service-role callers. The cron job sends service-role JWT in
  // Authorization. Anyone else gets 401.
  const authHeader = req.headers.get("Authorization") ?? "";
  const expectedKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!authHeader.includes(expectedKey) || expectedKey === "") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Find all accounts past their 30-day window
    const { data: dueRows, error: dueError } = await supabaseAdmin.rpc(
      "businesses_due_for_purge",
    );
    if (dueError) {
      return new Response(`Could not fetch due rows: ${dueError.message}`, { status: 500 });
    }
    const due = (dueRows ?? []) as { user_id: string; business_id: string }[];

    const results: Array<{ user_id: string; status: "purged" | "error"; error?: string }> = [];

    for (const { user_id, business_id } of due) {
      try {
        // 1. Remove all storage objects under this business.
        // We list all files in each bucket scoped to the business folder
        // then delete them in a single batch.
        for (const bucket of ["business-assets", "payment-slips"]) {
          const { data: list } = await supabaseAdmin.storage
            .from(bucket)
            .list(business_id, { limit: 1000 });
          if (list && list.length > 0) {
            const paths = list.map((f) => `${business_id}/${f.name}`);
            // Recursive: also collect nested folders (logos, slips for orders)
            const nestedPaths: string[] = [];
            for (const item of list) {
              if (item.id === null) {
                // It's a folder, list its contents too
                const { data: nested } = await supabaseAdmin.storage
                  .from(bucket)
                  .list(`${business_id}/${item.name}`, { limit: 1000 });
                (nested ?? []).forEach((n) => {
                  nestedPaths.push(`${business_id}/${item.name}/${n.name}`);
                });
              }
            }
            const allPaths = [...paths, ...nestedPaths];
            if (allPaths.length > 0) {
              await supabaseAdmin.storage.from(bucket).remove(allPaths);
            }
          }
        }

        // 2. Delete the auth.users row.
        // This cascades to all FK-related rows: businesses, products,
        // customers, orders (and their items + events + slips), user_roles.
        // (Assumes your tables have ON DELETE CASCADE foreign keys.)
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
        if (deleteUserError) {
          throw deleteUserError;
        }

        results.push({ user_id, status: "purged" });
      } catch (err) {
        results.push({
          user_id,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return new Response(
      JSON.stringify({
        ran_at: new Date().toISOString(),
        due_count: due.length,
        purged_count: results.filter((r) => r.status === "purged").length,
        error_count: results.filter((r) => r.status === "error").length,
        details: results,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    return new Response(
      `Server error: ${err instanceof Error ? err.message : String(err)}`,
      { status: 500 },
    );
  }
});