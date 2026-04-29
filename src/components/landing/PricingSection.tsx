import { motion } from "framer-motion";
import { Check, X, ArrowRight, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

// ─── Update your WhatsApp number here ───────────────────────────────────────
const WHATSAPP_NUMBER = "94761148054";

const buildWhatsApp = (plan: string, price: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi, I'd like to subscribe to the Ordera ${plan} plan (Rs. ${price}/month). Please help me get started.`,
  )}`;

// ─── Plan data ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0",
    priceNote: "forever",
    orders: 50,
    ordersLabel: "50 orders/month",
    perOrder: null,
    color: "border-border",
    badge: null,
    cta: "Get started free",
    ctaType: "signup" as const,
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "3,000",
    priceNote: "/month",
    orders: 500,
    ordersLabel: "500 orders/month",
    perOrder: "Rs. 6/order",
    color: "border-blue-500/40",
    badge: null,
    cta: "Start with Starter",
    ctaType: "whatsapp" as const,
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "6,500",
    priceNote: "/month",
    orders: 2000,
    ordersLabel: "2,000 orders/month",
    perOrder: "Rs. 3.25/order",
    color: "border-primary",
    badge: "Most Popular",
    cta: "Start with Growth",
    ctaType: "whatsapp" as const,
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    price: "12,000",
    priceNote: "/month",
    orders: 10000,
    ordersLabel: "10,000 orders/month",
    perOrder: "Rs. 1.20/order",
    color: "border-amber-500/40",
    badge: null,
    cta: "Start with Business",
    ctaType: "whatsapp" as const,
    highlight: false,
  },
  {
    id: "custom",
    name: "Custom",
    price: "Custom",
    priceNote: "pricing",
    orders: 999999,
    ordersLabel: "Unlimited orders",
    perOrder: "Best rate",
    color: "border-border",
    badge: null,
    cta: "Contact sales",
    ctaType: "whatsapp" as const,
    highlight: false,
  },
] as const;

// ─── Feature rows for comparison table ───────────────────────────────────────
type PlanId = "free" | "starter" | "growth" | "business" | "custom";

interface FeatureRow {
  category?: string; // makes it a section header row
  label?: string;
  values?: Partial<Record<PlanId, string | boolean>>;
}

const FEATURES: FeatureRow[] = [
  { category: "Orders & Usage" },
  {
    label: "Monthly orders",
    values: {
      free: "50",
      starter: "500",
      growth: "2,000",
      business: "10,000",
      custom: "Unlimited",
    },
  },
  {
    label: "Cost per order",
    values: {
      free: "—",
      starter: "Rs. 6",
      growth: "Rs. 3.25",
      business: "Rs. 1.20",
      custom: "Best rate",
    },
  },
  {
    label: "Order history",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },

  { category: "Core Features" },
  {
    label: "Sinhala + English UI",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Bank slip verification",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Customer database",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Invoice & waybill printing",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "CSV export",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Dark mode + theme toggle",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },

  { category: "Public Order Form" },
  {
    label: "Shareable order URL",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Bank slip upload by customer",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Inquiry inbox with bulk actions",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },

  { category: "Couriers" },
  {
    label: "Manual waybill entry",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Koombiyo integration",
    values: {
      free: false,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Royal Express + TransExpress",
    values: {
      free: false,
      starter: false,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "All courier integrations",
    values: {
      free: false,
      starter: false,
      growth: false,
      business: true,
      custom: true,
    },
  },

  { category: "Support" },
  {
    label: "Community support",
    values: {
      free: true,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Email support",
    values: {
      free: false,
      starter: true,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Priority WhatsApp support",
    values: {
      free: false,
      starter: false,
      growth: true,
      business: true,
      custom: true,
    },
  },
  {
    label: "Dedicated account manager",
    values: {
      free: false,
      starter: false,
      growth: false,
      business: false,
      custom: true,
    },
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function FeatureValue({ val }: { val: string | boolean | undefined }) {
  if (val === undefined || val === false)
    return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  if (val === true)
    return <Check className="h-4 w-4 text-emerald-500 mx-auto" />;
  return <span className="text-xs font-medium text-foreground">{val}</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PricingSection() {
  const [showTable, setShowTable] = useState(false);

  return (
    <section id="pricing" className="container mx-auto px-4 sm:px-6 py-20">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            No hidden fees. No long-term contracts. Cancel anytime.
          </p>

          {/* vs StoreMate callout */}
          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            <Zap className="h-4 w-4" />
            Up to 3x cheaper than Other OMS
          </div>
        </motion.div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto mb-8">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className={`relative rounded-xl border p-5 flex flex-col ${
              plan.highlight
                ? "border-primary bg-primary/5 ring-2 ring-primary shadow-lg shadow-primary/10"
                : `${plan.color} bg-card`
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                {plan.badge}
              </div>
            )}

            <div className="mb-4">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {plan.name}
              </div>
              <div className="flex items-end gap-1">
                {plan.price === "Custom" ? (
                  <span className="text-2xl font-bold">Custom</span>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">Rs.</span>
                    <span className="text-3xl font-bold">{plan.price}</span>
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {plan.priceNote}
              </div>
            </div>

            <div className="mb-4 space-y-1">
              <div className="text-sm font-medium">{plan.ordersLabel}</div>
              {plan.perOrder && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {plan.perOrder}
                </div>
              )}
            </div>

            <div className="mt-auto pt-4">
              {plan.ctaType === "signup" ? (
                <Link to="/signup" className="block">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              ) : (
                <a
                  href={
                    plan.id === "custom"
                      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, I'm interested in the Ordera Custom enterprise plan. Please contact me.")}`
                      : buildWhatsApp(plan.name, plan.price)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    size="sm"
                    variant={plan.highlight ? "default" : "outline"}
                    className="w-full text-xs gap-1.5"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {plan.cta}
                  </Button>
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toggle feature table */}
      <div className="text-center mb-8">
        <button
          onClick={() => setShowTable((v) => !v)}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showTable ? "Hide" : "Compare all features"}
          <ArrowRight
            className={`h-4 w-4 transition-transform ${showTable ? "rotate-90" : ""}`}
          />
        </button>
      </div>

      {/* Full feature comparison table */}
      {showTable && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto overflow-x-auto"
        >
          <div className="rounded-xl border border-border bg-card overflow-hidden min-w-[700px]">
            {/* Table header */}
            <div className="grid grid-cols-6 border-b border-border bg-muted/30">
              <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Feature
              </div>
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`px-2 py-3 text-center text-xs font-bold uppercase tracking-wider ${
                    plan.highlight ? "text-primary" : "text-foreground"
                  }`}
                >
                  {plan.name}
                </div>
              ))}
            </div>

            {/* Table rows */}
            {FEATURES.map((row, i) => {
              if (row.category) {
                return (
                  <div
                    key={row.category}
                    className="grid grid-cols-6 bg-muted/50 border-b border-border"
                  >
                    <div className="px-4 py-2 col-span-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {row.category}
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={row.label}
                  className={`grid grid-cols-6 border-b border-border last:border-0 ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/10"
                  }`}
                >
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    {row.label}
                  </div>
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className={`px-2 py-3 text-center ${
                        plan.highlight ? "bg-primary/5" : ""
                      }`}
                    >
                      <FeatureValue val={row.values?.[plan.id]} />
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Table footer — CTA row */}
            <div className="grid grid-cols-6 border-t-2 border-border bg-muted/20">
              <div className="px-4 py-4 text-sm font-medium">Get started</div>
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`px-2 py-4 text-center ${
                    plan.highlight ? "bg-primary/5" : ""
                  }`}
                >
                  {plan.ctaType === "signup" ? (
                    <Link to="/signup">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Free
                      </Button>
                    </Link>
                  ) : (
                    <a
                      href={
                        plan.id === "custom"
                          ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, I'm interested in the Ordera Custom enterprise plan.")}`
                          : buildWhatsApp(plan.name, plan.price)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant={plan.highlight ? "default" : "outline"}
                        className="w-full text-xs"
                      >
                        {plan.highlight ? "Most Popular" : "Start"}
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom note */}
      <div className="text-center mt-8 space-y-2">
        <p className="text-sm text-muted-foreground">
          All plans include: Sinhala UI · Bank slip verification · Invoice printing · CSV export · Mobile responsive
        </p>
        <p className="text-xs text-muted-foreground">
          Monthly limits reset on the 1st of each month. No setup fees. No contracts.
        </p>
      </div>
    </section>
  );
}