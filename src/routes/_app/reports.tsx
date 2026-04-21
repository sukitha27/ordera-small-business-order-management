import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatLKR } from "@/lib/i18n";
import { PageHeader } from "@/components/app/PageHeader";
import { format, subDays, startOfDay } from "date-fns";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "oklch(0.78 0.16 75)",
  confirmed: "oklch(0.55 0.13 200)",
  packed: "oklch(0.65 0.15 175)",
  shipped: "oklch(0.68 0.14 195)",
  delivered: "oklch(0.65 0.15 155)",
  cancelled: "oklch(0.6 0.22 25)",
};

function ReportsPage() {
  const { t, business } = useAuth();

  const { data: orders = [] } = useQuery({
    queryKey: ["reports-orders", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, total, created_at");
      return data ?? [];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["reports-items", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("product_name, quantity, line_total");
      return data ?? [];
    },
  });

  // Last 14 days revenue
  const days: { date: string; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const next = startOfDay(subDays(new Date(), i - 1));
    const revenue = orders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d >= day && d < next;
      })
      .reduce((s, o) => s + Number(o.total || 0), 0);
    days.push({ date: format(day, "MMM d"), revenue });
  }

  const statusData = Object.entries(
    orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const topProducts = Object.entries(
    items.reduce<Record<string, { qty: number; total: number }>>((acc, it) => {
      if (!acc[it.product_name]) acc[it.product_name] = { qty: 0, total: 0 };
      acc[it.product_name].qty += it.quantity;
      acc[it.product_name].total += Number(it.line_total || 0);
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-7xl">
      <PageHeader title={t("reports")} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4">{t("salesOverTime")} (14 days)</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 220)" />
                <XAxis dataKey="date" stroke="oklch(0.5 0.025 230)" fontSize={12} />
                <YAxis stroke="oklch(0.5 0.025 230)" fontSize={12} />
                <Tooltip
                  formatter={(v: number) => formatLKR(v)}
                  contentStyle={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0.91 0.01 220)",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.55 0.13 200)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4">{t("statusBreakdown")}</h2>
          {statusData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
              {t("noOrders")}
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {statusData.map((d) => (
                      <Cell key={d.name} fill={STATUS_COLORS[d.name] || "oklch(0.5 0 0)"} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card mt-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{t("topProducts")}</h2>
        </div>
        {topProducts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">{t("noProducts")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3">{t("name")}</th>
                <th className="px-6 py-3 text-right">{t("units")}</th>
                <th className="px-6 py-3 text-right">{t("revenue")}</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(([name, v]) => (
                <tr key={name} className="border-t border-border">
                  <td className="px-6 py-3 font-medium">{name}</td>
                  <td className="px-6 py-3 text-right">{v.qty}</td>
                  <td className="px-6 py-3 text-right font-medium">{formatLKR(v.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}