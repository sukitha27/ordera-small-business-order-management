import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BusinessLogo } from "@/components/app/BusinessLogo";
import { formatLKR } from "@/lib/i18n";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/orders/$orderId/invoice")({
  component: InvoicePage,
});

function InvoicePage() {
  const { orderId } = Route.useParams();
  const { business } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["order-invoice", orderId],
    queryFn: async () => {
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase.from("order_items").select("*").eq("order_id", orderId),
      ]);
      return { order: orderRes.data, items: itemsRes.data ?? [] };
    },
  });

  useEffect(() => {
    document.title = data?.order ? `Invoice ${data.order.order_number}` : "Invoice";
  }, [data]);

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  if (!data?.order) return <div className="p-12 text-center">Not found</div>;

  const o = data.order;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between no-print">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/orders/$orderId", params: { orderId } })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to order
        </Button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      <div className="print-page max-w-3xl mx-auto bg-white text-black rounded-xl shadow-sm p-10 border border-border">
        <div className="flex justify-between items-start pb-6 border-b border-gray-200">
          <div className="flex items-start gap-4 min-w-0">
            {/* Logo on the left if uploaded — sized to match the heading height */}
            {business?.logo_url && (
              <div className="shrink-0 pt-1">
                <BusinessLogo
                  path={business.logo_url}
                  alt={business.business_name}
                  size="lg"
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{business?.business_name || "Business"}</h1>
              {business?.owner_name && <div className="text-sm text-gray-600">{business.owner_name}</div>}
              {business?.address && <div className="text-sm text-gray-600">{business.address}</div>}
              {business?.city && <div className="text-sm text-gray-600">{business.city}</div>}
              {business?.phone && <div className="text-sm text-gray-600">Tel: {business.phone}</div>}
            </div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-3xl font-bold tracking-tight">INVOICE</div>
            <div className="text-sm text-gray-600 mt-1">#{o.order_number}</div>
            <div className="text-sm text-gray-600">{format(new Date(o.created_at), "PPP")}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 my-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Bill to</div>
            <div className="font-medium">{o.customer_name}</div>
            {o.customer_phone && <div className="text-sm text-gray-700">{o.customer_phone}</div>}
            {o.customer_address && <div className="text-sm text-gray-700">{o.customer_address}</div>}
            {o.customer_city && <div className="text-sm text-gray-700">{o.customer_city}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Payment</div>
            <div className="text-sm">
              {o.payment_method === "cod" ? "Cash on Delivery" : o.payment_method === "bank_transfer" ? "Bank transfer" : "Cash"}
            </div>
            <div className="text-sm font-medium uppercase mt-1">{o.payment_status}</div>
            {o.courier && (
              <>
                <div className="text-xs uppercase tracking-wider text-gray-500 mt-3 mb-1">Courier</div>
                <div className="text-sm">{o.courier}{o.waybill_number ? ` · ${o.waybill_number}` : ""}</div>
              </>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left text-xs uppercase tracking-wider text-gray-600">
              <th className="py-2">Item</th>
              <th className="py-2 text-right w-16">Qty</th>
              <th className="py-2 text-right w-32">Unit price</th>
              <th className="py-2 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.id} className="border-b border-gray-100">
                <td className="py-3">{it.product_name}</td>
                <td className="py-3 text-right tabular-nums">{it.quantity}</td>
                <td className="py-3 text-right tabular-nums">{formatLKR(it.unit_price)}</td>
                <td className="py-3 text-right tabular-nums">{formatLKR(it.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-6">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="tabular-nums">{formatLKR(o.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="tabular-nums">{formatLKR(o.shipping_fee)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatLKR(o.total)}</span>
            </div>
          </div>
        </div>

        {o.notes && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Notes</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{o.notes}</div>
          </div>
        )}

        <div className="mt-10 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          Thank you for your business.
        </div>
      </div>
    </div>
  );
}