import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  packed: "bg-accent text-accent-foreground border-border",
  shipped: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  delivered: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  unpaid: "bg-warning/15 text-warning-foreground border-warning/30",
  paid: "bg-success/15 text-success border-success/30",
  refunded: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ value, kind = "status" }: { value: string; kind?: "status" | "payment" }) {
  const { t } = useAuth();
  const cls = STATUS_STYLES[value] ?? "bg-muted text-muted-foreground border-border";
  // Translate known keys
  const label = (() => {
    try {
      // @ts-expect-error - dynamic translation key
      return t(value);
    } catch {
      return value;
    }
  })();
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        cls,
      )}
      data-kind={kind}
    >
      {label}
    </span>
  );
}