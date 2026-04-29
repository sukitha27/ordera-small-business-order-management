import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  ordersIncluded: string;
  features: string[];
  cta: string;
  popular: boolean;
  isFree?: boolean;
}

// Your WhatsApp number — update this to your real number
const WHATSAPP_NUMBER = "94761148054";

export function PricingCard({
  name,
  price,
  period,
  ordersIncluded,
  features,
  cta,
  popular,
  isFree = false,
}: PricingCardProps) {
  const whatsappMessage = encodeURIComponent(
    `Hi, I'd like to subscribe to the Ordera ${name} plan (Rs. ${price}${period}). Please help me get started.`,
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border p-8 relative ${
        popular ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border bg-card"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{ordersIncluded}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold">Rs. {price}</span>
        <span className="text-muted-foreground">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      {isFree ? (
        // Free plan → go straight to signup
        <Link to="/signup">
          <Button className="w-full" variant="outline">
            {cta}
          </Button>
        </Link>
      ) : (
        // Paid plans → WhatsApp with pre-filled message
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" variant={popular ? "default" : "outline"}>
            {cta}
          </Button>
        </a>
      )}
    </motion.div>
  );
}