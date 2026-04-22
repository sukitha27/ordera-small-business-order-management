import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatLKR } from "@/lib/i18n";
import { Trash2, ShieldCheck, Search } from "lucide-react";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
});

interface BusinessRow {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
}

interface Stat {
  business_id: string;
  orders: number;
  revenue: number;
}

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<BusinessRow[]>([]);
  const [stats, setStats] = useState<Record<string, Stat>>({});
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    const [biz, ord, roles] = await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("business_id,total"),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    if (biz.data) setRows(biz.data as BusinessRow[]);
    const map: Record<string, Stat> = {};
    (ord.data || []).forEach((o: { business_id: string; total: number | string }) => {
      const s = map[o.business_id] || { business_id: o.business_id, orders: 0, revenue: 0 };
      s.orders += 1;
      s.revenue += Number(o.total) || 0;
      map[o.business_id] = s;
    });
    setStats(map);
    setAdminIds(new Set((roles.data || []).map((r: { user_id: string }) => r.user_id)));
    setBusy(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/dashboard" });
  }, [loading, isAdmin, navigate]);

  if (!isAdmin) return null;

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase();
    return (
      !s ||
      r.business_name.toLowerCase().includes(s) ||
      (r.owner_name || "").toLowerCase().includes(s) ||
      (r.city || "").toLowerCase().includes(s)
    );
  });

  const totalRevenue = Object.values(stats).reduce((a, b) => a + b.revenue, 0);
  const totalOrders = Object.values(stats).reduce((a, b) => a + b.orders, 0);

  const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
    if (makeAdmin) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Admin role granted");
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
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

  return (
    <div className="container mx-auto p-6 lg:p-10">
      <PageHeader
        title="Platform Admin"
        description="Oversight across all Ordera businesses"
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Businesses</div>
          <div className="text-3xl font-bold mt-1">{rows.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total orders</div>
          <div className="text-3xl font-bold mt-1">{totalOrders}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">GMV</div>
          <div className="text-3xl font-bold mt-1">{formatLKR(totalRevenue)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search businesses…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-xs text-muted-foreground ml-auto">
            {busy ? "Loading…" : `${filtered.length} shown`}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Business</th>
                <th className="text-left px-4 py-3">Owner</th>
                <th className="text-left px-4 py-3">City</th>
                <th className="text-right px-4 py-3">Orders</th>
                <th className="text-right px-4 py-3">Revenue</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const s = stats[r.id];
                const isUserAdmin = adminIds.has(r.user_id);
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {r.business_name}
                        {isUserAdmin && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            <ShieldCheck className="h-3 w-3" /> admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.owner_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.city || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s?.orders || 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatLKR(s?.revenue || 0)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAdmin(r.user_id, !isUserAdmin)}
                        >
                          {isUserAdmin ? "Revoke admin" : "Make admin"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBusiness(r.id, r.business_name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!busy && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No businesses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}