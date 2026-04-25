import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Printer, ArrowLeft, AlertTriangle } from "lucide-react";
import Barcode from "react-barcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { formatLKR } from "@/lib/i18n";

type Layout = "4up" | "2up" | "1up";

interface Search {
  ids?: string;
  layout?: Layout;
}

export const Route = createFileRoute("/_app/orders/print-batch")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    ids: typeof raw.ids === "string" ? raw.ids : undefined,
    layout:
      raw.layout === "2up" || raw.layout === "1up" || raw.layout === "4up"
        ? raw.layout
        : "4up",
  }),
  component: BatchPrintPage,
});

function BatchPrintPage() {
  const { ids, layout: initialLayout } = useSearch({ from: Route.id });
  const { business } = useAuth();
  const navigate = useNavigate();
  const [layout, setLayout] = useState<Layout>(initialLayout ?? "4up");

  const orderIds = (ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { data, isLoading } = useQuery({
    queryKey: ["batch-waybills", orderIds.sort().join(",")],
    enabled: orderIds.length > 0,
    queryFn: async () => {
      const [ordersRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("*").in("id", orderIds),
        supabase
          .from("order_items")
          .select("order_id, product_name, quantity")
          .in("order_id", orderIds),
      ]);
      const itemsByOrder = new Map<string, { product_name: string; quantity: number }[]>();
      for (const it of itemsRes.data ?? []) {
        const list = itemsByOrder.get(it.order_id) ?? [];
        list.push({ product_name: it.product_name, quantity: it.quantity });
        itemsByOrder.set(it.order_id, list);
      }
      // Preserve the original selection order
      const orderMap = new Map((ordersRes.data ?? []).map((o) => [o.id, o]));
      const ordered = orderIds.map((id) => orderMap.get(id)).filter(Boolean);
      return {
        orders: ordered,
        itemsByOrder,
      };
    },
  });

  useEffect(() => {
    document.title = `Print ${orderIds.length} waybill${orderIds.length === 1 ? "" : "s"}`;
  }, [orderIds.length]);

  if (isLoading || !data) {
    return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  }

  if (data.orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-muted-foreground mb-4">No orders to print.</p>
          <Button onClick={() => navigate({ to: "/orders" })}>Back to orders</Button>
        </div>
      </div>
    );
  }

  // Orders without a waybill — we block by default for this batch view,
  // but the guard on the orders list should've caught this before navigating.
  const missing = data.orders.filter((o: any) => !o.waybill_number);
  if (missing.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-xl border border-amber-500/40 bg-amber-500/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold mb-1">
                {missing.length} order{missing.length === 1 ? "" : "s"} missing waybill number
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Add a waybill number to each of these before printing:
              </p>
              <ul className="text-sm space-y-1 mb-4">
                {missing.map((o: any) => (
                  <li key={o.id} className="flex justify-between">
                    <span className="font-medium">{o.order_number}</span>
                    <span className="text-muted-foreground">{o.customer_name}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate({ to: "/orders" })} variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const gridClass =
    layout === "4up"
      ? "grid grid-cols-2 grid-rows-2"
      : layout === "2up"
        ? "grid grid-cols-1 grid-rows-2"
        : "grid grid-cols-1 grid-rows-1";

  // Chunk orders per page based on layout
  const perPage = layout === "4up" ? 4 : layout === "2up" ? 2 : 1;
  const pages: any[][] = [];
  for (let i = 0; i < data.orders.length; i += perPage) {
    pages.push(data.orders.slice(i, i + perPage));
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Print-only CSS: A4, margin control, page breaks */}
      <style>{`
        @media print {
          @page { size: A4; margin: 6mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-page { break-after: page; page-break-after: always; }
          .print-page:last-child { break-after: auto; page-break-after: auto; }
          .batch-grid { height: calc(297mm - 12mm); }
        }
        .batch-grid { height: auto; }
      `}</style>

      {/* Toolbar (not printed) */}
      <div className="no-print sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/orders" })}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          <div className="text-sm text-muted-foreground">
            {data.orders.length} waybill{data.orders.length === 1 ? "" : "s"} ·{" "}
            {pages.length} page{pages.length === 1 ? "" : "s"}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
              {(["4up", "2up", "1up"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setLayout(v)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    layout === v
                      ? "bg-background shadow-sm font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v === "4up" ? "4 per page" : v === "2up" ? "2 per page" : "1 per page"}
                </button>
              ))}
            </div>
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* Print content */}
      <div className="py-6 px-4">
        {pages.map((pageOrders, pageIdx) => (
          <div
            key={pageIdx}
            className="print-page max-w-[210mm] mx-auto bg-white text-black mb-6 shadow print:shadow-none"
            style={{ minHeight: "calc(297mm - 12mm)" }}
          >
            <div className={`batch-grid ${gridClass} h-full`}>
              {pageOrders.map((o: any) => (
                <WaybillLabel
                  key={o.id}
                  order={o}
                  items={data.itemsByOrder.get(o.id) ?? []}
                  business={business}
                  layout={layout}
                />
              ))}
              {/* Fill empty cells in the last page so the grid keeps its shape */}
              {pageOrders.length < perPage &&
                Array.from({ length: perPage - pageOrders.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="border-2 border-dashed border-gray-200" />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WaybillLabel({
  order: o,
  items,
  business,
  layout,
}: {
  order: any;
  items: { product_name: string; quantity: number }[];
  business: any;
  layout: Layout;
}) {
  const totalItems = items.reduce((a, b) => a + (b.quantity || 0), 0);

  // Type sizing scales with layout density
  const headerClass = layout === "4up" ? "text-sm py-2 px-3" : "text-lg py-3 px-4";
  const sectionPad = layout === "4up" ? "px-3 py-2" : "px-4 py-3";
  const labelClass =
    layout === "4up" ? "text-[8px]" : "text-[10px]";
  const toNameClass = layout === "4up" ? "text-sm" : "text-lg";
  const bigNumClass = layout === "4up" ? "text-sm" : "text-lg";
  const itemTextClass = layout === "4up" ? "text-[10px]" : "text-xs";
  const barcodeHeight = layout === "4up" ? 30 : layout === "2up" ? 40 : 60;
  const barcodeFontSize = layout === "4up" ? 10 : 14;
  const barcodeWidth = layout === "4up" ? 1 : layout === "2up" ? 1.5 : 2;
  // Limit how many item lines show so tiny labels don't overflow
  const itemLimit = layout === "4up" ? 3 : layout === "2up" ? 6 : 999;
  const shownItems = items.slice(0, itemLimit);
  const hiddenCount = items.length - shownItems.length;

  return (
    <div className="border-2 border-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`flex justify-between items-center border-b-2 border-black bg-black text-white ${headerClass}`}>
        <div className="font-bold tracking-wide">SHIPPING LABEL</div>
        <div className="font-mono text-xs">{o.courier || "—"}</div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-2 divide-x-2 divide-black">
        <div className={sectionPad}>
          <div className={`uppercase tracking-widest text-gray-600 mb-1 ${labelClass}`}>From</div>
          <div className="font-bold text-xs leading-tight truncate">
            {business?.business_name || "—"}
          </div>
          {business?.city && layout !== "4up" && (
            <div className="text-xs truncate">{business.city}</div>
          )}
          {business?.phone && (
            <div className="text-[10px] text-gray-700 truncate">Tel: {business.phone}</div>
          )}
        </div>
        <div className={sectionPad}>
          <div className={`uppercase tracking-widest text-gray-600 mb-1 ${labelClass}`}>To</div>
          <div className={`font-bold leading-tight ${toNameClass}`}>{o.customer_name}</div>
          {o.customer_address && (
            <div className="text-[11px] leading-tight line-clamp-2">{o.customer_address}</div>
          )}
          {o.customer_city && (
            <div className="text-[11px] font-medium">{o.customer_city}</div>
          )}
          {o.customer_phone && (
            <div className="text-[11px] mt-0.5">Tel: {o.customer_phone}</div>
          )}
        </div>
      </div>

      {/* Numbers row */}
      <div className={`border-t-2 border-black grid grid-cols-3 gap-1 text-center ${sectionPad}`}>
        <div>
          <div className={`uppercase tracking-widest text-gray-600 ${labelClass}`}>Order #</div>
          <div className={`font-bold ${bigNumClass}`}>{o.order_number}</div>
        </div>
        <div>
          <div className={`uppercase tracking-widest text-gray-600 ${labelClass}`}>Waybill</div>
          <div className={`font-bold font-mono ${bigNumClass}`}>{o.waybill_number}</div>
        </div>
        <div>
          <div className={`uppercase tracking-widest text-gray-600 ${labelClass}`}>Items</div>
          <div className={`font-bold ${bigNumClass}`}>{totalItems}</div>
        </div>
      </div>

      {/* Barcode */}
      <div className="border-t-2 border-black flex justify-center items-center py-1 bg-white">
        <Barcode
          value={String(o.waybill_number)}
          format="CODE128"
          height={barcodeHeight}
          fontSize={barcodeFontSize}
          width={barcodeWidth}
          margin={0}
          displayValue={true}
          background="#ffffff"
          lineColor="#000000"
        />
      </div>

      {/* Payment + COD collect */}
      <div className={`border-t-2 border-black ${sectionPad}`}>
        <div className="flex justify-between items-baseline gap-2">
          <div className="min-w-0">
            <div className={`uppercase tracking-widest text-gray-600 ${labelClass}`}>Payment</div>
            <div className="font-bold uppercase text-xs">
              {o.payment_method === "cod" ? "Cash on Delivery" : "Prepaid"}
            </div>
          </div>
          {o.payment_method === "cod" && o.payment_status !== "paid" && (
            <div className="text-right shrink-0">
              <div className={`uppercase tracking-widest text-gray-600 ${labelClass}`}>Collect</div>
              <div className={`font-bold tabular-nums ${layout === "4up" ? "text-base" : "text-2xl"}`}>
                {formatLKR(o.total)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contents */}
      <div className={`border-t-2 border-black ${sectionPad} flex-1 min-h-0`}>
        <div className={`uppercase tracking-widest text-gray-600 mb-0.5 ${labelClass}`}>Contents</div>
        <ul className={`space-y-0.5 ${itemTextClass}`}>
          {shownItems.map((it, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="truncate">{it.product_name}</span>
              <span className="font-mono shrink-0">×{it.quantity}</span>
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="italic text-gray-600">+{hiddenCount} more item{hiddenCount === 1 ? "" : "s"}</li>
          )}
        </ul>
      </div>
    </div>
  );
}