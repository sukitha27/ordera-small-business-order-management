import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingBag, TrendingUp, Clock, CheckCircle2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatLKR } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { format, startOfDay, startOfMonth, startOfWeek } from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { t, business } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status, payment_status, total, created_at")
        .order("created_at", { ascending: false });
      return orders ?? [];
    },
  });

  const orders = data ?? [];
  const today = startOfDay(new Date());
  const week = startOfWeek(new Date());
  const month = startOfMonth(new Date());

  const sum = (arr: typeof orders) =>
    arr.reduce((s, o) => s + Number(o.total || 0), 0);

  const todayRev = sum(orders.filter((o) => new Date(o.created_at) >= today));
  const weekRev = sum(orders.filter((o) => new Date(o.created_at) >= week));
  const monthRev = sum(orders.filter((o) => new Date(o.created_at) >= month));
  const pending = orders.filter((o) => o.status === "pending").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;

  const stats = [
    { icon: TrendingUp, label: t("todayRevenue"), value: formatLKR(todayRev), tint: "text-primary" },
    { icon: ShoppingBag, label: t("weekRevenue"), value: formatLKR(weekRev), tint: "text-chart-2" },
    { icon: Clock, label: t("pending"), value: pending, tint: "text-warning-foreground" },
    { icon: CheckCircle2, label: t("delivered"), value: delivered, tint: "text-success" },
  ];

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-7xl">
      <PageHeader
        title={t("dashboard")}
        description={`${t("monthRevenue")}: ${formatLKR(monthRev)}`}
        action={
          <Link to="/orders/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> {t("newOrder")}
            </Button>
          </Link>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.tint}`} />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">{t("recentOrders")}</h2>
          <Link to="/orders" className="text-sm text-primary hover:underline">
            {t("orders")} →
          </Link>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground mb-4">{t("noOrders")}</p>
            <Link to="/orders/new">
              <Button>{t("addFirstOrder")}</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">{t("orderNumber")}</th>
                  <th className="px-6 py-3">{t("customer")}</th>
                  <th className="px-6 py-3">{t("status")}</th>
                  <th className="px-6 py-3">{t("payment")}</th>
                  <th className="px-6 py-3 text-right">{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">{o.order_number}</td>
                    <td className="px-6 py-3">{o.customer_name}</td>
                    <td className="px-6 py-3">
                      <StatusBadge value={o.status} />
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge value={o.payment_status} kind="payment" />
                    </td>
                    <td className="px-6 py-3 text-right font-medium">{formatLKR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}