import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatLKR } from "@/lib/i18n";
import {
  Trash2,
  ShieldCheck,
  Search,
  Users,
  BarChart3,
  CreditCard,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Globe,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
});

// Matches the admin_business_usage view columns
interface BusinessUsageRow {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  city: string | null;
  plan: string;
  plan_order_limit: number;
  trial_ends_at: string | null;
  is_suspended: boolean;
  suspended_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  last_active_at: string | null;
  slug: string | null;
  public_form_enabled: boolean;
  deletion_scheduled_at: string | null;
  orders_this_month: number;
  orders_total: number;
  revenue_total: number;
  last_order_at: string | null;
}

type Tab = "overview" | "tenants" | "subscriptions" | "system";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  growth: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  business: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  custom: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const PLAN_LIMITS: Record<string, number> = {
  free: 50,
  starter: 500,
  growth: 2000,
  business: 10000,
  custom: 99999,
};

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("overview");
  const [rows, setRows] = useState<BusinessUsageRow[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});
  const [systemStats, setSystemStats] = useState<{
    storageObjects: number;
    publicFormEnabled: number;
    totalInquiries: number;
    deletionPending: number;
    suspended: number;
  } | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/dashboard" });
  }, [loading, isAdmin, navigate]);

  const load = useCallback(async () => {
    setBusy(true);
    const [bizRes, rolesRes, sysRes] = await Promise.all([
      supabase.from("admin_business_usage").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("is_inquiry", true),
    ]);

    if (bizRes.data) {
      const biz = bizRes.data as BusinessUsageRow[];
      setRows(biz);
      // Initialise note values map
      const notes: Record<string, string> = {};
      biz.forEach((b) => { notes[b.id] = b.admin_notes || ""; });
      setNoteValues(notes);

      setSystemStats({
        storageObjects: 0, // filled below if needed
        publicFormEnabled: biz.filter((b) => b.public_form_enabled).length,
        totalInquiries: (sysRes.count ?? 0),
        deletionPending: biz.filter((b) => b.deletion_scheduled_at).length,
        suspended: biz.filter((b) => b.is_suspended).length,
      });
    }
    setAdminIds(new Set((rolesRes.data || []).map((r: { user_id: string }) => r.user_id)));
    setBusy(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (loading || !isAdmin) return null;

  // ── Derived stats ──────────────────────────────────────────────────────

  const totalRevenue = rows.reduce((a, b) => a + Number(b.revenue_total), 0);
  const totalOrders = rows.reduce((a, b) => a + Number(b.orders_total), 0);
  const newThisWeek = rows.filter((r) => {
    const days = differenceInDays(new Date(), new Date(r.created_at));
    return days <= 7;
  }).length;

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      r.business_name.toLowerCase().includes(s) ||
      (r.owner_name || "").toLowerCase().includes(s) ||
      (r.city || "").toLowerCase().includes(s) ||
      r.plan.toLowerCase().includes(s)
    );
  });

  // ── Actions ────────────────────────────────────────────────────────────

  const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
    if (makeAdmin) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Admin role granted");
    } else {
      const { error } = await supabase.from("user_roles").delete()
        .eq("user_id", userId).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin role revoked");
    }
    load();
  };

  const deleteBusiness = async (id: string, name: string) => {
    if (!confirm(`Delete business "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("businesses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Business deleted");
    load();
  };

  const toggleSuspend = async (id: string, isSuspended: boolean, name: string) => {
    if (!isSuspended) {
      const reason = prompt(`Suspend "${name}"?\nReason (shown to merchant):`);
      if (reason === null) return;
      const { error } = await supabase.from("businesses")
        .update({ is_suspended: true, suspended_reason: reason || "Account suspended by admin" })
        .eq("id", id);
      if (error) return toast.error(error.message);
      toast.success("Business suspended");
    } else {
      const { error } = await supabase.from("businesses")
        .update({ is_suspended: false, suspended_reason: null })
        .eq("id", id);
      if (error) return toast.error(error.message);
      toast.success("Business unsuspended");
    }
    load();
  };

  const updatePlan = async (id: string, plan: string) => {
    const limit = PLAN_LIMITS[plan] ?? 50;
    const { error } = await supabase.from("businesses")
      .update({ plan, plan_order_limit: limit })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Plan updated to ${plan}`);
    load();
  };

  const updatePlanLimit = async (id: string, limit: number) => {
    const { error } = await supabase.from("businesses")
      .update({ plan_order_limit: limit })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order limit updated");
    load();
  };

  const setTrial = async (id: string) => {
    const days = prompt("Set trial duration (days):", "14");
    if (!days || isNaN(Number(days))) return;
    const trialEnd = new Date(Date.now() + Number(days) * 86400000).toISOString();
    const { error } = await supabase.from("businesses")
      .update({ trial_ends_at: trialEnd, plan: "starter" })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Trial set: ${days} days (Starter plan)`);
    load();
  };

  const clearTrial = async (id: string) => {
    const { error } = await supabase.from("businesses")
      .update({ trial_ends_at: null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Trial cleared");
    load();
  };

  const saveNote = async (id: string) => {
    setSavingNote(id);
    const { error } = await supabase.from("businesses")
      .update({ admin_notes: noteValues[id] || null })
      .eq("id", id);
    setSavingNote(null);
    if (error) return toast.error(error.message);
    toast.success("Note saved");
    load();
  };

  // ── Tab: Overview ──────────────────────────────────────────────────────

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Businesses", value: rows.length, sub: `+${newThisWeek} this week` },
          { label: "Total orders", value: totalOrders.toLocaleString(), sub: "All time" },
          { label: "GMV", value: formatLKR(totalRevenue), sub: "All time" },
          { label: "Suspended", value: systemStats?.suspended ?? 0, sub: "Active restrictions" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="text-3xl font-bold mt-1">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Plan distribution</div>
          {["free", "starter", "growth", "business", "custom"].map((p) => {
            const count = rows.filter((r) => r.plan === p).length;
            if (!count) return null;
            return (
              <div key={p} className="flex items-center justify-between py-1.5 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[p]}`}>
                  {p}
                </span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Public form</div>
          <div className="text-3xl font-bold">{systemStats?.publicFormEnabled ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">merchants with form enabled</div>
          <div className="mt-3 text-sm">
            <span className="text-muted-foreground">{systemStats?.totalInquiries ?? 0}</span>
            <span className="text-xs text-muted-foreground ml-1">total inquiries received</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Attention needed</div>
          <div className="space-y-2 text-sm">
            {systemStats?.deletionPending ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {systemStats.deletionPending} account{systemStats.deletionPending > 1 ? "s" : ""} scheduled for deletion
              </div>
            ) : null}
            {systemStats?.suspended ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                {systemStats.suspended} suspended account{systemStats.suspended > 1 ? "s" : ""}
              </div>
            ) : null}
            {rows.filter((r) => r.trial_ends_at && differenceInDays(new Date(r.trial_ends_at), new Date()) <= 3 && differenceInDays(new Date(r.trial_ends_at), new Date()) >= 0).length > 0 && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                {rows.filter((r) => r.trial_ends_at && differenceInDays(new Date(r.trial_ends_at), new Date()) <= 3 && differenceInDays(new Date(r.trial_ends_at), new Date()) >= 0).length} trial{" "}
                {rows.filter((r) => r.trial_ends_at && differenceInDays(new Date(r.trial_ends_at), new Date()) <= 3).length > 1 ? "s" : ""} expiring soon
              </div>
            )}
            {!systemStats?.deletionPending && !systemStats?.suspended && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                All systems normal
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-medium">Recent signups</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Business</th>
              <th className="text-left px-4 py-2">Owner</th>
              <th className="text-left px-4 py-2">Plan</th>
              <th className="text-left px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-2 font-medium">{r.business_name}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.owner_name || "—"}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[r.plan]}`}>
                    {r.plan}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Tab: Tenants ───────────────────────────────────────────────────────

  const TenantsTab = () => (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="text-xs text-muted-foreground ml-auto">{busy ? "Loading…" : `${filtered.length} shown`}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Business</th>
              <th className="text-left px-4 py-3">Owner</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Orders</th>
              <th className="text-right px-4 py-3">Revenue</th>
              <th className="text-left px-4 py-3">Last active</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const isUserAdmin = adminIds.has(r.user_id);
              const isExpanded = expandedId === r.id;
              return (
                <>
                  <tr
                    key={r.id}
                    className={`border-t border-border hover:bg-muted/30 cursor-pointer ${isExpanded ? "bg-muted/20" : ""}`}
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {r.business_name}
                        {isUserAdmin && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            <ShieldCheck className="h-3 w-3" /> admin
                          </span>
                        )}
                        {r.is_suspended && (
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">
                            Suspended
                          </span>
                        )}
                        {r.deletion_scheduled_at && (
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold">
                            Deleting
                          </span>
                        )}
                      </div>
                      {r.slug && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">/order/{r.slug}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{r.owner_name || "—"}</div>
                      <div className="text-xs">{r.city || ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[r.plan]}`}>
                        {r.plan}
                      </span>
                      {r.trial_ends_at && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                          Trial ends {format(new Date(r.trial_ends_at), "MMM d")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.public_form_enabled ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <Globe className="h-3 w-3" /> Form on
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(r.orders_total)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatLKR(Number(r.revenue_total))}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {r.last_order_at
                        ? formatDistanceToNow(new Date(r.last_order_at), { addSuffix: true })
                        : "No orders yet"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button size="sm" variant="outline"
                          onClick={(e) => { e.stopPropagation(); toggleAdmin(r.user_id, !isUserAdmin); }}>
                          {isUserAdmin ? "Revoke admin" : "Admin"}
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={(e) => { e.stopPropagation(); toggleSuspend(r.id, r.is_suspended, r.business_name); }}
                          className={r.is_suspended ? "text-emerald-600 border-emerald-500/40" : "text-amber-600 border-amber-500/40"}>
                          {r.is_suspended ? "Unsuspend" : "Suspend"}
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={(e) => { e.stopPropagation(); deleteBusiness(r.id, r.business_name); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <tr key={`${r.id}-expanded`} className="border-t border-border bg-muted/10">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1 text-sm">
                            <div className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-2">Details</div>
                            <div>📞 {r.phone || "No phone"}</div>
                            <div>🏙 {r.city || "No city"}</div>
                            <div>🌐 Slug: {r.slug || "not set"}</div>
                            {r.deletion_scheduled_at && (
                              <div className="text-destructive">
                                ⚠️ Deletes {format(new Date(new Date(r.deletion_scheduled_at).getTime() + 30 * 86400000), "MMM d, yyyy")}
                              </div>
                            )}
                            {r.is_suspended && r.suspended_reason && (
                              <div className="text-amber-600 dark:text-amber-400">
                                🚫 Reason: {r.suspended_reason}
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-2">Usage this month</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${Math.min(100, (Number(r.orders_this_month) / r.plan_order_limit) * 100)}%` }}
                                />
                              </div>
                              <span className="tabular-nums text-xs whitespace-nowrap">
                                {Number(r.orders_this_month)} / {r.plan_order_limit}
                              </span>
                            </div>
                            {Number(r.orders_this_month) >= r.plan_order_limit && (
                              <div className="text-destructive text-xs">⚠️ At limit — upgrade needed</div>
                            )}
                            {r.trial_ends_at && (
                              <div className="text-amber-600 dark:text-amber-400 text-xs">
                                Trial: {differenceInDays(new Date(r.trial_ends_at), new Date())} days left
                                <button
                                  className="ml-2 underline text-muted-foreground"
                                  onClick={() => clearTrial(r.id)}
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-2">Admin notes</div>
                            <Textarea
                              value={noteValues[r.id] || ""}
                              onChange={(e) => setNoteValues((n) => ({ ...n, [r.id]: e.target.value }))}
                              placeholder="Internal notes about this merchant…"
                              rows={3}
                              className="text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => saveNote(r.id)}
                              disabled={savingNote === r.id}
                            >
                              {savingNote === r.id ? "Saving…" : "Save note"}
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {!busy && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  No businesses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Tab: Subscriptions ─────────────────────────────────────────────────

  const SubscriptionsTab = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        {["free", "starter", "growth", "business"].map((p) => {
          const count = rows.filter((r) => r.plan === p).length;
          return (
            <div key={p} className="rounded-xl border border-border bg-card p-5">
              <div className={`text-xs uppercase tracking-wider font-medium mb-1 ${PLAN_COLORS[p].split(" ")[1]}`}>{p}</div>
              <div className="text-3xl font-bold">{count}</div>
              <div className="text-xs text-muted-foreground mt-1">merchants</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Business</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-left px-4 py-3">Order limit</th>
                <th className="text-left px-4 py-3">This month</th>
                <th className="text-left px-4 py-3">Trial ends</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const usagePct = Math.min(100, (Number(r.orders_this_month) / r.plan_order_limit) * 100);
                const atLimit = Number(r.orders_this_month) >= r.plan_order_limit;
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {r.business_name}
                      <div className="text-xs text-muted-foreground">{r.owner_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={r.plan} onValueChange={(v) => updatePlan(r.id, v)}>
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["free", "starter", "growth", "business", "custom"].map((p) => (
                            <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        className="h-8 w-24 text-xs"
                        value={r.plan_order_limit}
                        onBlur={(e) => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v !== r.plan_order_limit) updatePlanLimit(r.id, v);
                        }}
                        onChange={() => {}}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${atLimit ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${usagePct}%` }}
                          />
                        </div>
                        <span className={`text-xs tabular-nums ${atLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {Number(r.orders_this_month)}/{r.plan_order_limit}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.trial_ends_at ? (
                        <div>
                          <span className={differenceInDays(new Date(r.trial_ends_at), new Date()) <= 3 ? "text-destructive" : "text-amber-600 dark:text-amber-400"}>
                            {format(new Date(r.trial_ends_at), "MMM d, yyyy")}
                          </span>
                          <div className="text-muted-foreground">
                            {differenceInDays(new Date(r.trial_ends_at), new Date())} days left
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setTrial(r.id)}>
                          Set trial
                        </Button>
                        {r.trial_ends_at && (
                          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => clearTrial(r.id)}>
                            Clear
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── Tab: System ────────────────────────────────────────────────────────

  const SystemTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Public form stats</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Forms enabled</span>
              <span className="font-medium">{systemStats?.publicFormEnabled ?? 0} / {rows.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total inquiries</span>
              <span className="font-medium tabular-nums">{systemStats?.totalInquiries ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Account health</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deletion scheduled</span>
              <span className={`font-medium ${(systemStats?.deletionPending ?? 0) > 0 ? "text-amber-600" : ""}`}>
                {systemStats?.deletionPending ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suspended</span>
              <span className={`font-medium ${(systemStats?.suspended ?? 0) > 0 ? "text-destructive" : ""}`}>
                {systemStats?.suspended ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active trials</span>
              <span className="font-medium">
                {rows.filter((r) => r.trial_ends_at && new Date(r.trial_ends_at) > new Date()).length}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">At-limit merchants</div>
          {rows.filter((r) => Number(r.orders_this_month) >= r.plan_order_limit).length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle2 className="h-4 w-4" /> None at limit
            </div>
          ) : (
            <div className="space-y-1">
              {rows
                .filter((r) => Number(r.orders_this_month) >= r.plan_order_limit)
                .map((r) => (
                  <div key={r.id} className="text-sm text-destructive">
                    ⚠ {r.business_name} ({r.plan})
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Merchants at >80% usage */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-medium">
          Usage alerts ({'>'}80% of plan limit this month)
        </div>
        {rows.filter((r) => Number(r.orders_this_month) / r.plan_order_limit >= 0.8).length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            No merchants near their limit this month.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Business</th>
                <th className="text-left px-4 py-2">Plan</th>
                <th className="text-left px-4 py-2">Usage</th>
                <th className="text-left px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => Number(r.orders_this_month) / r.plan_order_limit >= 0.8)
                .map((r) => {
                  const pct = Math.min(100, Math.round((Number(r.orders_this_month) / r.plan_order_limit) * 100));
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-2 font-medium">{r.business_name}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[r.plan]}`}>{r.plan}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${pct >= 100 ? "bg-destructive" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs tabular-nums">{Number(r.orders_this_month)}/{r.plan_order_limit} ({pct}%)</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => { setTab("subscriptions"); }}>
                          Upgrade plan
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "tenants", label: "Tenants", icon: Users },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "system", label: "System", icon: Activity },
  ];

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-7xl">
      <PageHeader
        title="Platform Admin"
        description="Oversight across all Ordera businesses"
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={busy} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "tenants" && <TenantsTab />}
      {tab === "subscriptions" && <SubscriptionsTab />}
      {tab === "system" && <SystemTab />}
    </div>
  );
}