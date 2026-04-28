import { motion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";

interface FeatureSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  visual: string;
  index: number;
}

export function FeatureSection({ icon: Icon, title, description, bullets, visual, index }: FeatureSectionProps) {
  const isReversed = index % 2 === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="grid md:grid-cols-2 gap-12 items-center"
    >
      {/* Visual Side */}
      <div className={isReversed ? "md:order-2" : ""}>
        <div className="rounded-xl border border-border bg-card p-1">
          <div className="aspect-video rounded-lg bg-muted/30 flex items-center justify-center">
            <div className="text-center">
              <Icon className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
              <span className="text-sm text-muted-foreground">
                {visual === "pipeline" && "Interactive Pipeline Preview"}
                {visual === "payment" && "Payment Tracking Dashboard"}
                {visual === "courier" && "Courier Integration Panel"}
                {visual === "dashboard" && "Revenue Analytics View"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Side */}
      <div className={isReversed ? "md:order-1" : ""}>
        <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4 bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        <ul className="space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}