import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OrderForm } from "@/components/app/OrderForm";
import { PlanLimitWall } from "@/components/app/PlanLimitWall";

export const Route = createFileRoute("/_app/orders/new")({
  component: NewOrderPage,
});

interface LimitCheck {
  allowed: boolean;
  used: number;
  limit: number;
  plan: string;
}

function NewOrderPage() {
  const navigate = useNavigate();
  const { business } = useAuth();

  // Check plan limit before showing the form. If the merchant has hit their
  // monthly limit, show the upgrade wall instead of the order form.
  // We use the server-side can_create_order() function so the check is
  // accurate and can't be gamed by the client.
  const { data: limitCheck, isLoading } = useQuery<LimitCheck>({
    queryKey: ["plan-limit-check", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("can_create_order", {
  business_uuid: business!.id,
});
if (error) throw error;
return data as unknown as LimitCheck;
    },
    // Don't cache this for long — it needs to be fresh each visit
    staleTime: 10_000,
  });

  if (isLoading || !limitCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // At or over limit — show the upgrade wall
  if (!limitCheck.allowed) {
    return (
      <PlanLimitWall
        used={limitCheck.used}
        limit={limitCheck.limit}
        plan={limitCheck.plan}
      />
    );
  }

  // Under limit — show the normal order form
  return <OrderForm onDone={() => navigate({ to: "/orders" })} />;
}