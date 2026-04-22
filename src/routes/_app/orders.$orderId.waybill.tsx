import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { formatLKR } from "@/lib/i18n";

export const Route = createFileRoute("/_app/orders/$orderId/waybill")({
  component: WaybillPage,
});

function WaybillPage() {
  const { orderId } = Route.useParams();
  const { business } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["order-waybill", orderId],
    queryFn: async () => {
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase.from("order_items").select("product_name,quantity").eq("order_id", orderId),
      ]);
      return { order: orderRes.data, items: itemsRes.data ?? [] };
    },
  });

  useEffect(() => {
    document.title = data?.order ? `Waybill ${data.order.order_number}` : "Waybill";
  }, [data]);

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  if (!data?.order) return <div className="p-12 text-center">Not found</div>;

  const o = data.order;
  const totalItems = data.items.reduce((a, b) => a + (b.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between no-print">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/orders/$orderId", params: { orderId } })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to order
        </Button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print label
        </Button>
      </div>

      <div className="print-page max-w-2xl mx-auto bg-white text-black rounded-xl shadow-sm border-2 border-black overflow-hidden">
        <div className="flex justify-between items-center px-6 py-3 border-b-2 border-black bg-black text-white">
          <div className="text-lg font-bold tracking-wide">SHIPPING LABEL</div>
          <div className="text-sm font-mono">{o.courier || "—"}</div>
        </div>

        <div className="grid grid-cols-2 divide-x-2 divide-black">
          <div className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">From</div>
            <div className="font-bold">{business?.business_name || "—"}</div>
            {business?.owner_name && <div className="text-sm">{business.owner_name}</div>}
            {business?.address && <div className="text-sm">{business.address}</div>}
            {business?.city && <div className="text-sm">{business.city}</div>}
            {business?.phone && <div className="text-sm mt-1">Tel: {business.phone}</div>}
          </div>
          <div className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">To</div>
            <div className="font-bold text-lg leading-tight">{o.customer_name}</div>
            {o.customer_address && <div className="text-sm mt-1">{o.customer_address}</div>}
            {o.customer_city && <div className="text-sm font-medium">{o.customer_city}</div>}
            {o.customer_phone && <div className="text-sm mt-2">Tel: {o.customer_phone}</div>}
          </div>
        </div>

        <div className="border-t-2 border-black px-6 py-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-600">Order #</div>
            <div className="font-bold text-lg">{o.order_number}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-600">Waybill</div>
            <div className="font-bold text-lg font-mono">{o.waybill_number || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-600">Items</div>
            <div className="font-bold text-lg">{totalItems}</div>
          </div>
        </div>

        <div className="border-t-2 border-black px-6 py-4">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-600">Payment</div>
              <div className="font-bold uppercase">
                {o.payment_method === "cod" ? "Cash on Delivery" : "Prepaid"}
              </div>
            </div>
            {o.payment_method === "cod" && o.payment_status !== "paid" && (
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-gray-600">Collect</div>
                <div className="text-2xl font-bold tabular-nums">{formatLKR(o.total)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t-2 border-black px-6 py-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Contents</div>
          <ul className="text-xs space-y-0.5">
            {data.items.map((it, i) => (
              <li key={i} className="flex justify-between">
                <span className="truncate pr-2">{it.product_name}</span>
                <span className="font-mono">×{it.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}