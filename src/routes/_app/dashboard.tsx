import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  FileText,
  ChevronRight,
  Inbox,
  Package,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatLKR } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import {
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  format,
  eachDayOfInterval,
} from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

// ── MUI X-style tooltip ───────────────────────────────────────────────────────
function RevenueTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs shadow-xl"
      style={{
        background: "oklch(0.18 0.04 265 / 0.97)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mb-1 font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
        {d?.date}
      </div>
      <div
        className="text-lg font-bold tabular-nums"
        style={{ color: "oklch(0.78 0.20 264)" }}
      >
        {formatLKR(payload[0].value)}
      </div>
      {d?.count > 0 && (
        <div className="mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {d.count} order{d.count !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const { t, business } = useAuth();

  // ── Main orders query ───────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, status, payment_status, total, created_at, is_inquiry",
        )
        .eq("is_inquiry", false)
        .order("created_at", { ascending: false });
      return orders ?? [];
    },
  });

  // ── Pending slips ───────────────────────────────────────────────────────────
  const { data: pendingSlipsData } = useQuery({
    queryKey: ["dashboard-pending-slips", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_slips")
        .select("id, slip_amount")
        .eq("status", "pending");
      if (error) return { count: 0, sum: 0 };
      const count = (data ?? []).length;
      const sum = (data ?? []).reduce((s, slip) => s + Number(slip.slip_amount), 0);
      return { count, sum };
    },
  });

  // ── Pending inquiries ───────────────────────────────────────────────────────
  const { data: pendingInquiries = 0 } = useQuery({
    queryKey: ["dashboard-inquiries", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("is_inquiry", true)
        .neq("status", "cancelled");
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });

  const orders = data ?? [];
  const today = startOfDay(new Date());
  const week = startOfWeek(new Date());
  const month = startOfMonth(new Date());

  const sum = (arr: typeof orders) =>
    arr.reduce((s, o) => s + Number(o.total || 0), 0);

  const todayOrders = orders.filter((o) => new Date(o.created_at) >= today);
  const todayRev = sum(todayOrders);
  const weekRev = sum(orders.filter((o) => new Date(o.created_at) >= week));
  const monthRev = sum(orders.filter((o) => new Date(o.created_at) >= month));

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
  const packedCount = orders.filter((o) => o.status === "packed").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  // ── 30-day chart data ───────────────────────────────────────────────────────
  const chartData = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  }).map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayOrders = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= dayStart && d < dayEnd;
    });
    return {
      date: format(day, "MMM d"),
      shortDate: format(day, "d"),
      revenue: sum(dayOrders),
      count: dayOrders.length,
    };
  });

  const hasChartData = chartData.some((d) => d.revenue > 0);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = [
    { icon: TrendingUp, label: t("todayRevenue"), value: formatLKR(todayRev), tint: "text-primary" },
    { icon: ShoppingBag, label: t("weekRevenue"), value: formatLKR(weekRev), tint: "text-chart-2" },
    { icon: Clock, label: t("pending"), value: pendingCount, tint: "text-warning-foreground" },
    { icon: CheckCircle2, label: t("delivered"), value: deliveredCount, tint: "text-success" },
  ];

  // ── Action cards ────────────────────────────────────────────────────────────
  const actionCards = [];
  if (pendingInquiries > 0) {
    actionCards.push({
      key: "pending-inquiries",
      icon: Inbox,
      title: "new inquiries from your order form",
      count: pendingInquiries,
      meta: "Tap to review and confirm or reject",
      to: "/inquiries" as const,
      search: { view: "pending" as const },
      tone: "blue",
    });
  }
  if (pendingSlipsData && pendingSlipsData.count > 0) {
    actionCards.push({
      key: "pending-slips",
      icon: FileText,
      title: t("slipsAwaitingVerification"),
      count: pendingSlipsData.count,
      meta: `${formatLKR(pendingSlipsData.sum)} ${t("inPendingSlips")}`,
      to: "/orders" as const,
      search: { paymentFilter: "pending_verification" as const },
      tone: "amber",
    });
  }

  // ── Today's tasks ───────────────────────────────────────────────────────────
  const tasks = [
    pendingInquiries > 0 && {
      key: "inquiries",
      icon: Inbox,
      label: `${pendingInquiries} inquir${pendingInquiries === 1 ? "y" : "ies"} to review`,
      to: "/inquiries",
      search: { view: "pending" as const },
      done: false,
    },
    pendingSlipsData && pendingSlipsData.count > 0 && {
      key: "slips",
      icon: FileText,
      label: `${pendingSlipsData.count} payment slip${pendingSlipsData.count === 1 ? "" : "s"} to verify`,
      to: "/orders",
      search: { paymentFilter: "pending_verification" as const },
      done: false,
    },
    confirmedCount > 0 && {
      key: "pack",
      icon: Package,
      label: `${confirmedCount} order${confirmedCount === 1 ? "" : "s"} ready to pack`,
      to: "/orders",
      search: { statusFilter: "confirmed" as const },
      done: false,
    },
    packedCount > 0 && {
      key: "dispatch",
      icon: ShoppingBag,
      label: `${packedCount} order${packedCount === 1 ? "" : "s"} packed — ready to dispatch`,
      to: "/orders",
      search: { statusFilter: "packed" as const },
      done: false,
    },
    shippedCount > 0 && {
      key: "shipped",
      icon: PackageCheck,
      label: `${shippedCount} order${shippedCount === 1 ? "" : "s"} shipped — follow up`,
      to: "/orders",
      search: { statusFilter: "shipped" as const },
      done: false,
    },
    pendingInquiries === 0 &&
      (!pendingSlipsData || pendingSlipsData.count === 0) &&
      confirmedCount === 0 &&
      packedCount === 0 && {
        key: "all-clear",
        icon: CheckCircle2,
        label: "All caught up!",
        to: "/orders" as const,
        search: {},
        done: true,
      },
  ].filter(Boolean) as {
    key: string;
    icon: any;
    label: string;
    to: string;
    search: Record<string, string>;
    done: boolean;
  }[];

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

      {/* ── Action needed ── */}
      {actionCards.length > 0 && (
        <div className="mb-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {t("actionNeeded")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionCards.map((c) => {
              const isBlue = c.tone === "blue";
              return (
                <Link
                  key={c.key}
                  to={c.to}
                  search={c.search}
                  className={`group rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                    isBlue
                      ? "border-blue-500/40 bg-blue-500/5 hover:border-blue-500/70 hover:bg-blue-500/10"
                      : "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70 hover:bg-amber-500/10"
                  }`}
                >
                  <div
                    className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${
                      isBlue ? "bg-blue-500/15" : "bg-amber-500/15"
                    }`}
                  >
                    <c.icon
                      className={`h-5 w-5 ${
                        isBlue
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm flex items-baseline gap-2">
                      <span
                        className={`text-2xl font-bold tabular-nums ${
                          isBlue
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {c.count}
                      </span>
                      <span>{c.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.meta}</div>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 shrink-0 transition-colors text-muted-foreground ${
                      isBlue
                        ? "group-hover:text-blue-700 dark:group-hover:text-blue-400"
                        : "group-hover:text-amber-700 dark:group-hover:text-amber-400"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <s.icon className={`h-4 w-4 ${s.tint}`} />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Revenue chart + Today's tasks ── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* ── MUI X style area chart ── */}
        <div
          className="lg:col-span-2 rounded-xl overflow-hidden relative"
          style={{
            background: "oklch(0.14 0.035 265)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 15% 100%, oklch(0.488 0.243 264 / 0.20) 0%, transparent 65%)",
            }}
          />

          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div
                  className="text-xs uppercase tracking-widest font-semibold mb-1.5"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  Revenue
                </div>
                <div className="text-3xl font-bold tabular-nums text-white">
                  {formatLKR(monthRev)}
                </div>
                <div className="text-xs mt-1.5 flex items-center gap-2">
                  <span style={{ color: "oklch(0.72 0.18 264)" }}>last 30 days</span>
                  {hasChartData && (
                    <span style={{ color: "rgba(255,255,255,0.20)" }}>
                      · {chartData.filter((d) => d.revenue > 0).length} active days
                    </span>
                  )}
                </div>
              </div>

              {/* Today box */}
              <div
                className="rounded-xl px-4 py-3 text-right"
                style={{
                  background: "oklch(0.18 0.04 265)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  Today
                </div>
                <div className="text-xl font-bold tabular-nums text-white">
                  {formatLKR(todayRev)}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {todayOrders.length} order{todayOrders.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Chart */}
            {!hasChartData ? (
              <div className="h-48 flex flex-col items-center justify-center">
                <AlertCircle className="h-8 w-8 mb-2 text-white/20" />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                  No orders yet — your chart will appear here
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.25 264)" stopOpacity="0.45" />
                      <stop offset="55%" stopColor="oklch(0.55 0.22 264)" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="oklch(0.488 0.243 264)" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(255,255,255,0.04)"
                    strokeDasharray="0"
                  />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.22)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.22)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                    }
                  />
                  <Tooltip
                    content={<RevenueTooltip />}
                    cursor={{
                      stroke: "oklch(0.65 0.25 264 / 0.35)",
                      strokeWidth: 1,
                      strokeDasharray: "4 3",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="oklch(0.72 0.20 264)"
                    strokeWidth={2.5}
                    fill="url(#areaFill)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "oklch(0.72 0.20 264)",
                      stroke: "oklch(0.14 0.035 265)",
                      strokeWidth: 2.5,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* Bottom bar */}
            {hasChartData && (() => {
              const maxDay = chartData.reduce(
                (a, b) => (b.revenue > a.revenue ? b : a),
                chartData[0],
              );
              const totalOrders = chartData.reduce((s, d) => s + d.count, 0);
              return (
                <div
                  className="flex items-center justify-between mt-4 pt-4"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                    Best day:{" "}
                    <span style={{ color: "rgba(255,255,255,0.65)" }} className="font-medium">
                      {maxDay.date}
                    </span>
                    {" — "}
                    <span style={{ color: "oklch(0.75 0.18 264)" }} className="font-semibold">
                      {formatLKR(maxDay.revenue)}
                    </span>
                  </div>
                  <div className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.22)" }}>
                    {totalOrders} orders · 30 days
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Today's tasks ── */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4">Today's tasks</h2>
          <div className="space-y-1.5">
            {tasks.map((task) =>
              task.done ? (
                <div
                  key={task.key}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                >
                  <task.icon className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                    {task.label}
                  </span>
                </div>
              ) : (
                <Link
                  key={task.key}
                  to={task.to}
                  search={task.search}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-colors group"
                >
                  <task.icon className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                  <span className="text-sm flex-1 text-muted-foreground group-hover:text-foreground transition-colors">
                    {task.label}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
                </Link>
              ),
            )}
          </div>

          {/* Pipeline summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Pipeline today
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Pending", count: pendingCount, color: "bg-amber-500" },
                { label: "Confirmed", count: confirmedCount, color: "bg-blue-500" },
                { label: "Packed", count: packedCount, color: "bg-violet-500" },
                { label: "Shipped", count: shippedCount, color: "bg-orange-500" },
                { label: "Delivered", count: deliveredCount, color: "bg-emerald-500" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <div className={`h-1.5 w-1.5 rounded-full ${s.color} shrink-0`} />
                  <span className="text-muted-foreground flex-1">{s.label}</span>
                  <span className="font-medium tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent orders ── */}
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
                    <td className="px-6 py-3 font-medium">
                      <Link
                        to="/orders/$orderId"
                        params={{ orderId: o.id }}
                        className="hover:text-primary hover:underline"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3">{o.customer_name}</td>
                    <td className="px-6 py-3">
                      <StatusBadge value={o.status} />
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge value={o.payment_status} kind="payment" />
                    </td>
                    <td className="px-6 py-3 text-right font-medium">
                      {formatLKR(o.total)}
                    </td>
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