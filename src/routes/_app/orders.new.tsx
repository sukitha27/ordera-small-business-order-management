import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OrderForm } from "@/components/app/OrderForm";

export const Route = createFileRoute("/_app/orders/new")({
  component: NewOrderPage,
});

function NewOrderPage() {
  const navigate = useNavigate();
  return <OrderForm onDone={() => navigate({ to: "/orders" })} />;
}