import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Package2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrderForm } from "@/components/app/OrderForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/orders/$orderId")({
  component: EditOrderPage,
});

function EditOrderPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();

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
      return { order, items: items ?? [] };
    },
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading...</div>;
  if (!data?.order) return <div className="p-12 text-center">Not found</div>;

  return (
    <>
      <div className="container mx-auto max-w-4xl px-6 lg:px-10 pt-6 flex justify-end gap-2">
        <Link to="/orders/$orderId/invoice" params={{ orderId }}>
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" /> Invoice
          </Button>
        </Link>
        <Link to="/orders/$orderId/waybill" params={{ orderId }}>
          <Button variant="outline" size="sm" className="gap-2">
            <Package2 className="h-4 w-4" /> Waybill
          </Button>
        </Link>
      </div>
      <OrderForm
        existing={{ order: data.order, items: data.items }}
        onDone={() => navigate({ to: "/orders" })}
      />
    </>
  );
}