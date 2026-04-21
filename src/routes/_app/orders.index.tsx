import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Truck } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatLKR, ORDER_STATUSES } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  const { t, business } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("updated"));
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(s) ||
        o.customer_name.toLowerCase().includes(s) ||
        (o.customer_phone || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-7xl">
      <PageHeader
        title={t("orders")}
        action={
          <Link to="/orders/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> {t("newOrder")}
            </Button>
          </Link>
        }
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(s as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
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
                  <th className="px-4 py-3">{t("orderNumber")}</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">{t("customer")}</th>
                  <th className="px-4 py-3">{t("courier")}</th>
                  <th className="px-4 py-3">{t("payment")}</th>
                  <th className="px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3 text-right">{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to="/orders/$orderId"
                        params={{ orderId: o.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(o.created_at), "MMM d")}
                    </td>
                    <td className="px-4 py-3">
                      <div>{o.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      {o.courier ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Truck className="h-3 w-3" /> {o.courier}
                          {o.waybill_number && (
                            <span className="text-muted-foreground">· {o.waybill_number}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={o.payment_status} kind="payment" />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={o.status}
                        onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {t(s as any)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatLKR(o.total)}</td>
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