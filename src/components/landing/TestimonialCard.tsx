import { motion } from "framer-motion";
import { Star, Users } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  index: number;
}

export function TestimonialCard({ quote, name, role, index }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
        ))}
      </div>
      <blockquote className="text-sm text-muted-foreground mb-4 leading-relaxed">
        "{quote}"
      </blockquote>
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
    </motion.div>
  );
}