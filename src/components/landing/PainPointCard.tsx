import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface PainPointCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
  index: number;
}

export function PainPointCard({ icon: Icon, title, description, stat, statLabel, index }: PainPointCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="rounded-xl border border-border bg-card p-6 hover:border-destructive/30 transition-all group"
    >
      <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
        <Icon className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="pt-4 border-t border-border">
        <div className="text-2xl font-bold text-destructive">{stat}</div>
        <div className="text-xs text-muted-foreground">{statLabel}</div>
      </div>
    </motion.div>
  );
}