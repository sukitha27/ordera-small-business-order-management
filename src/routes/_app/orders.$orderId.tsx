import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrderForm } from "@/components/app/OrderForm";

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
    <OrderForm
      existing={{ order: data.order, items: data.items }}
      onDone={() => navigate({ to: "/orders" })}
    />
  );
}