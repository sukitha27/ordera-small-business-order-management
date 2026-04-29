import { Link } from "@tanstack/react-router";
import { TrendingUp, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLKR } from "@/lib/i18n";

interface Props {
  used: number;
  limit: number;
  plan: string;
}

const NEXT_PLAN: Record<string, { name: string; price: number; limit: number }> = {
  free: { name: "Starter", price: 1490, limit: 500 },
  starter: { name: "Growth", price: 3490, limit: 2000 },
  growth: { name: "Business", price: 7490, limit: 10000 },
  business: { name: "Custom", price: 0, limit: 99999 },
};

/**
 * Full-page upgrade wall shown when a merchant has hit their monthly
 * order limit. Displayed instead of the new-order form.
 *
 * Shows:
 * - Current usage (used / limit)
 * - Progress bar at 100%
 * - Current plan + next plan with pricing
 * - CTA to contact for upgrade (or self-serve when billing is wired up)
 */
export function PlanLimitWall({ used, limit, plan }: Props) {
  const next = NEXT_PLAN[plan] ?? NEXT_PLAN.business;
  const isTopPlan = plan === "business" || plan === "custom";

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-2xl">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div
          className="p-8 text-primary-foreground text-center"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Monthly order limit reached</h1>
          <p className="text-primary-foreground/80 mt-2 text-sm">
            You've used all {limit} orders in your{" "}
            <span className="font-semibold capitalize">{plan}</span> plan this month.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Usage display */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Orders this month</span>
              <span className="text-destructive font-bold">
                {used} / {limit}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-3 bg-destructive rounded-full w-full" />
            </div>
            <p className="text-xs text-muted-foreground">
              Resets on the 1st of next month. Existing orders are not affected.
            </p>
          </div>

          {/* Upgrade option */}
          {!isTopPlan ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold">
                    Upgrade to {next.name} plan
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {next.limit.toLocaleString()} orders/month ·{" "}
                    {next.price > 0 ? `${formatLKR(next.price)}/month` : "Contact us for pricing"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`https://wa.me/94${/* your phone */ "776884455"}?text=${encodeURIComponent(
                        `Hi, I'd like to upgrade my Ordera account from ${plan} to ${next.name} plan.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="gap-2">
                        Upgrade via WhatsApp
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Link to="/settings">
                      <Button size="sm" variant="outline">
                        View settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
              <p className="text-sm font-medium">You're on the highest plan</p>
              <p className="text-xs text-muted-foreground mt-1">
                Contact us for a custom enterprise plan with higher limits.
              </p>
              <a
                href="https://wa.me/94776884455"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3"
              >
                <Button size="sm">Contact support</Button>
              </a>
            </div>
          )}

          {/* Back link */}
          <div className="text-center">
            <Link
              to="/orders"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}