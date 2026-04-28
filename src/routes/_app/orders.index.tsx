import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Truck, FileText, Package2, X, Printer, MessageCircle, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatLKR, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/app/PageHeader";
import { format } from "date-fns";
import { toast } from "sonner";
import { buildOrderMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { ExportOrdersDialog } from "@/components/app/ExportOrdersDialog";

interface OrdersSearch {
  paymentFilter?: string;
  statusFilter?: string;
}

export const Route = createFileRoute("/_app/orders/")({
  validateSearch: (raw: Record<string, unknown>): OrdersSearch => ({
    paymentFilter: typeof raw.paymentFilter === "string" ? raw.paymentFilter : undefined,
    statusFilter: typeof raw.statusFilter === "string" ? raw.statusFilter : undefined,
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { t, business } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const searchParams = Route.useSearch();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.statusFilter ?? "all");
  const [paymentFilter, setPaymentFilter] = useState<string>(searchParams.paymentFilter ?? "all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);

  // Sync local state if URL params change after mount (e.g. clicking dashboard badge)
  useEffect(() => {
    if (searchParams.paymentFilter && searchParams.paymentFilter !== paymentFilter) {
      setPaymentFilter(searchParams.paymentFilter);
    }
    if (searchParams.statusFilter && searchParams.statusFilter !== statusFilter) {
      setStatusFilter(searchParams.statusFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.paymentFilter, searchParams.statusFilter]);

  // Inquiries from the public form live in their own dedicated /inquiries
  // page. Filter them out here so the main Orders list shows confirmed
  // orders only — keeps the mental model clean.
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("is_inquiry", false)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Fetch all order items for the loaded orders for WhatsApp message generation
  const orderIds = orders.map((o) => o.id);
  const { data: allItems = [] } = useQuery({
    queryKey: ["all-order-items", orderIds.sort().join(",")],
    enabled: orderIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("order_id, product_name, quantity, unit_price")
        .in("order_id", orderIds);
      return data ?? [];
    },
  });

  const itemsByOrder = allItems.reduce<
    Record<string, { product_name: string; quantity: number; unit_price: number }[]>
  >((acc, it) => {
    (acc[it.order_id] ||= []).push({
      product_name: it.product_name,
      quantity: it.quantity,
      unit_price: Number(it.unit_price),
    });
    return acc;
  }, {});

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("updated"));
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["dashboard-pending-slips"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePayment = useMutation({
    mutationFn: async ({
      id,
      payment_status,
    }: {
      id: string;
      payment_status: string;
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("updated"));
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkUpdate = useMutation({
    mutationFn: async (status: string) => {
      const ids = Array.from(selected);
      const { error } = await supabase.from("orders").update({ status }).in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} order${count === 1 ? "" : "s"} updated`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkUpdatePayment = useMutation({
    mutationFn: async (payment_status: string) => {
      const ids = Array.from(selected);
      const { error } = await supabase
        .from("orders")
        .update({ payment_status })
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} order${count === 1 ? "" : "s"} updated`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
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

  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));
  const toggleAll = () => {
    if (allFilteredSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((o) => o.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const printWaybills = () => {
    const selectedOrders = orders.filter((o) => selected.has(o.id));
    const missing = selectedOrders.filter((o) => !o.waybill_number);
    if (missing.length > 0) {
      toast.error(
        `${missing.length} order${missing.length === 1 ? "" : "s"} missing waybill number: ${missing
          .slice(0, 3)
          .map((o) => o.order_number)
          .join(", ")}${missing.length > 3 ? "…" : ""}`,
      );
      return;
    }
    const ids = Array.from(selected).join(",");
    navigate({ to: "/orders/print-batch", search: { ids, layout: "4up" } });
  };

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
          <SelectTrigger className="w-full sm:w-44">
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
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(s as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setExportOpen(true)}
          className="gap-2 sm:w-auto"
        >
          <Download className="h-4 w-4" /> Export
        </Button>

        <ExportOrdersDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        filteredOrders={filtered}
      />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-border">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Select onValueChange={(v) => bulkUpdate.mutate(v)}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="Set status to…" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {t(s as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(v) => bulkUpdatePayment.mutate(v)}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="Set payment to…" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {t(s as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={printWaybills}
              className="h-8 gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" /> Print waybills
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="ml-auto gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </Button>
          </div>
        )}
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
                  <th className="px-4 py-3 w-10">
                    <Checkbox checked={allFilteredSelected} onCheckedChange={toggleAll} />
                  </th>
                  <th className="px-4 py-3">{t("orderNumber")}</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">{t("customer")}</th>
                  <th className="px-4 py-3">{t("courier")}</th>
                  <th className="px-4 py-3">{t("payment")}</th>
                  <th className="px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3 text-right">{t("total")}</th>
                  <th className="px-4 py-3 text-right">Print</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(o.id)}
                        onCheckedChange={() => toggleOne(o.id)}
                      />
                    </td>
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
                      <Select
                        value={o.payment_status}
                        onValueChange={(v) =>
                          updatePayment.mutate({ id: o.id, payment_status: v })
                        }
                      >
                        <SelectTrigger
                          className={`h-8 w-32 text-xs ${
                            o.payment_status === "paid"
                              ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : o.payment_status === "refunded"
                                ? "border-rose-500/40 text-rose-600 dark:text-rose-400"
                                : o.payment_status === "pending_verification"
                                  ? "border-blue-500/40 text-blue-600 dark:text-blue-400"
                                  : "border-amber-500/40 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {t(s as any)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {(() => {
                          if (!business || !o.customer_phone) return null;
                          const items = itemsByOrder[o.id] ?? [];
                          if (items.length === 0) return null;
                          const message = buildOrderMessage({
                            order: {
                              order_number: o.order_number,
                              customer_name: o.customer_name,
                              customer_phone: o.customer_phone,
                              customer_address: o.customer_address,
                              customer_city: o.customer_city,
                              status: o.status,
                              payment_method: o.payment_method,
                              payment_status: o.payment_status,
                              subtotal: o.subtotal,
                              shipping_fee: o.shipping_fee,
                              total: o.total,
                              courier: o.courier,
                              waybill_number: o.waybill_number,
                            },
                            business: {
                              business_name: business.business_name,
                              phone: business.phone,
                            },
                            items,
                            lang: business.language,
                          });
                          const link = buildWhatsAppLink(o.customer_phone, message);
                          if (!link) return null;
                          return (
                            <a href={link} target="_blank" rel="noopener noreferrer">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                title={
                                  o.waybill_number
                                    ? "Send tracking on WhatsApp"
                                    : "Send confirmation on WhatsApp"
                                }
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          );
                        })()}
                        <Link to="/orders/$orderId/invoice" params={{ orderId: o.id }}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Invoice">
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link to="/orders/$orderId/waybill" params={{ orderId: o.id }}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Waybill">
                            <Package2 className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
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