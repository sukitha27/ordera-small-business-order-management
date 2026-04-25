import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buildCsv, csvFilename, downloadCsv } from "@/lib/csv";
import { toast } from "sonner";

type DateRange = "today" | "7days" | "30days" | "thisMonth" | "all" | "custom";
type ExportScope = "filtered" | "all";
type ExportFormat = "summary" | "detailed";

interface FilteredOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  customer_city: string | null;
  status: string;
  payment_method: string;
  payment_status: string;
  courier: string | null;
  waybill_number: string | null;
  subtotal: number | string;
  shipping_fee: number | string;
  total: number | string;
  notes: string | null;
  created_at: string;
}

export function ExportOrdersDialog({
  open,
  onOpenChange,
  filteredOrders,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredOrders: FilteredOrder[];
}) {
  const { t, business } = useAuth();

  const [scope, setScope] = useState<ExportScope>("filtered");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("summary");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const computeDateBounds = (): { from?: Date; to?: Date } => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "7days":
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case "30days":
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case "thisMonth":
        return { from: startOfMonth(now), to: endOfDay(now) };
      case "custom":
        return {
          from: customFrom ? startOfDay(new Date(customFrom)) : undefined,
          to: customTo ? endOfDay(new Date(customTo)) : undefined,
        };
      default:
        return {};
    }
  };

  const exportNow = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error("No business loaded");

      let orders: FilteredOrder[];

      if (scope === "filtered") {
        orders = filteredOrders;
      } else {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        orders = (data ?? []) as FilteredOrder[];
      }

      // Apply date range on top of the selected scope
      const { from, to } = computeDateBounds();
      if (from || to) {
        orders = orders.filter((o) => {
          const d = new Date(o.created_at);
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        });
      }

      if (orders.length === 0) {
        throw new Error(t("noOrdersToExport"));
      }

      // Detailed format requires fetching items for each order
      if (exportFormat === "detailed") {
        const orderIds = orders.map((o) => o.id);
        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select("order_id, product_name, quantity, unit_price, line_total")
          .in("order_id", orderIds);
        if (itemsError) throw itemsError;

        const headers = [
          "Order #",
          "Date",
          "Customer",
          "Phone",
          "City",
          "Address",
          "Status",
          "Payment Method",
          "Payment Status",
          "Courier",
          "Waybill",
          "Item Name",
          "Qty",
          "Unit Price",
          "Line Total",
          "Order Subtotal",
          "Shipping",
          "Order Total",
          "Notes",
        ];

        const rows: unknown[][] = [];
        const orderById = new Map(orders.map((o) => [o.id, o]));
        const itemsByOrder = new Map<string, typeof items>();
        for (const it of items ?? []) {
          const list = itemsByOrder.get(it.order_id) ?? [];
          list.push(it);
          itemsByOrder.set(it.order_id, list);
        }

        // Preserve order chronology — iterate orders, not items
        for (const o of orders) {
          const orderItems = itemsByOrder.get(o.id) ?? [];
          if (orderItems.length === 0) {
            rows.push([
              o.order_number,
              format(new Date(o.created_at), "yyyy-MM-dd HH:mm"),
              o.customer_name,
              o.customer_phone ?? "",
              o.customer_city ?? "",
              o.customer_address ?? "",
              o.status,
              o.payment_method,
              o.payment_status,
              o.courier ?? "",
              o.waybill_number ?? "",
              "", // no items
              "",
              "",
              "",
              o.subtotal,
              o.shipping_fee,
              o.total,
              o.notes ?? "",
            ]);
          } else {
            for (const it of orderItems) {
              rows.push([
                o.order_number,
                format(new Date(o.created_at), "yyyy-MM-dd HH:mm"),
                o.customer_name,
                o.customer_phone ?? "",
                o.customer_city ?? "",
                o.customer_address ?? "",
                o.status,
                o.payment_method,
                o.payment_status,
                o.courier ?? "",
                o.waybill_number ?? "",
                it.product_name,
                it.quantity,
                it.unit_price,
                it.line_total,
                o.subtotal,
                o.shipping_fee,
                o.total,
                o.notes ?? "",
              ]);
            }
          }
        }

        const csv = buildCsv(headers, rows);
        downloadCsv(csvFilename("orders-detailed"), csv);
        return { count: orders.length, format: exportFormat };
      } else {
        // Summary: one row per order
        const headers = [
          "Order #",
          "Date",
          "Customer",
          "Phone",
          "City",
          "Address",
          "Status",
          "Payment Method",
          "Payment Status",
          "Courier",
          "Waybill",
          "Subtotal",
          "Shipping",
          "Total",
          "Notes",
        ];

        const rows = orders.map((o) => [
          o.order_number,
          format(new Date(o.created_at), "yyyy-MM-dd HH:mm"),
          o.customer_name,
          o.customer_phone ?? "",
          o.customer_city ?? "",
          o.customer_address ?? "",
          o.status,
          o.payment_method,
          o.payment_status,
          o.courier ?? "",
          o.waybill_number ?? "",
          o.subtotal,
          o.shipping_fee,
          o.total,
          o.notes ?? "",
        ]);

        const csv = buildCsv(headers, rows);
        downloadCsv(csvFilename("orders"), csv);
        return { count: orders.length, format: exportFormat };
      }
    },
    onSuccess: ({ count }) => {
      toast.success(`${count} ${t("ordersExported")}`);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> {t("exportOrders")}
          </DialogTitle>
          <DialogDescription>{t("exportOrdersDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Scope */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("ordersToExport")}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceCard
                active={scope === "filtered"}
                onClick={() => setScope("filtered")}
                title={t("currentView")}
                meta={`${filteredOrders.length} ${t("ordersUnit")}`}
              />
              <ChoiceCard
                active={scope === "all"}
                onClick={() => setScope("all")}
                title={t("allOrders")}
                meta={t("ignoreFilters")}
              />
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("format")}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceCard
                active={exportFormat === "summary"}
                onClick={() => setExportFormat("summary")}
                title={t("summary")}
                meta={t("oneRowPerOrder")}
              />
              <ChoiceCard
                active={exportFormat === "detailed"}
                onClick={() => setExportFormat("detailed")}
                title={t("detailed")}
                meta={t("oneRowPerItem")}
              />
            </div>
          </div>

          {/* Date range */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("dateRange")}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { v: "all", l: t("allTime") },
                  { v: "today", l: t("todayLabel") },
                  { v: "7days", l: t("last7Days") },
                  { v: "30days", l: t("last30Days") },
                  { v: "thisMonth", l: t("thisMonth") },
                  { v: "custom", l: t("custom") },
                ] as { v: DateRange; l: string }[]
              ).map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setDateRange(opt.v)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    dateRange === opt.v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
            {dateRange === "custom" && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("from")}</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("to")}</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={() => exportNow.mutate()} disabled={exportNow.isPending} className="gap-2">
            <Download className="h-4 w-4" />
            {exportNow.isPending ? t("exporting") : t("downloadCsv")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceCard({
  active,
  onClick,
  title,
  meta,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  meta: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border p-3 transition-colors ${
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:bg-muted/40"
      }`}
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{meta}</div>
    </button>
  );
}