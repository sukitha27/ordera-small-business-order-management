import {
  createFileRoute,
  useNavigate,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Package2, Pencil, History } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OrderForm } from "@/components/app/OrderForm";
import { OrderTimeline } from "@/components/app/OrderTimeline";
import { Button } from "@/components/ui/button";
import { InquiryActions } from "@/components/app/InquiryActions";

export const Route = createFileRoute("/_app/orders/$orderId")({
  component: EditOrderPage,
});

type Tab = "edit" | "history";

function EditOrderPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const matches = useMatches();
  const [tab, setTab] = useState<Tab>("edit");

  const hasChildRoute = matches.some(
    (m) =>
      m.routeId === "/_app/orders/$orderId/invoice" ||
      m.routeId === "/_app/orders/$orderId/waybill"
  );

  const { data, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      return {
        order,
        items: items ?? [],
      };
    },
    enabled: !hasChildRoute,
  });

  if (hasChildRoute) {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data?.order) {
    return <div className="p-12 text-center">Not found</div>;
  }

  return (
    <>
      {(data.order as { is_inquiry?: boolean }).is_inquiry && (
        <div className="container mx-auto max-w-5xl px-6 lg:px-10 pt-6">
          <InquiryActions
            orderId={data.order.id}
            orderNumber={data.order.order_number}
            customerPhone={data.order.customer_phone}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="container mx-auto max-w-5xl px-6 lg:px-10 pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              onClick={() => setTab("edit")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                tab === "edit"
                  ? "bg-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>

            <button
              onClick={() => setTab("history")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                tab === "history"
                  ? "bg-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              History
            </button>
          </div>

          <div className="flex gap-2">
            <Link to="/orders/$orderId/invoice" params={{ orderId }}>
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                Invoice
              </Button>
            </Link>

            <Link to="/orders/$orderId/waybill" params={{ orderId }}>
              <Button variant="outline" size="sm" className="gap-2">
                <Package2 className="h-4 w-4" />
                Waybill
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {tab === "edit" ? (
        <OrderForm
          existing={{
            order: data.order,
            items: data.items,
          }}
          onDone={() => navigate({ to: "/orders" })}
        />
      ) : (
        <div className="container mx-auto max-w-5xl px-6 lg:px-10 pb-10">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4">
              <h2 className="font-semibold">Order history</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Every status, payment, courier and waybill change is recorded
                automatically.
              </p>
            </div>

            <OrderTimeline orderId={orderId} />
          </div>
        </div>
      )}
    </>
  );
}