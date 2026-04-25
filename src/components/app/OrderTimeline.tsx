import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  PlusCircle,
  ArrowRight,
  CreditCard,
  Truck,
  Package2,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OrderEvent {
  id: string;
  event_type: string;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
  created_by: string | null;
  actor_email?: string | null;
}

export function OrderTimeline({ orderId }: { orderId: string }) {
  const { t } = useAuth();

  const { data: events = [], isLoading } = useQuery<OrderEvent[]>({
    queryKey: ["order-events", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_events")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderEvent[];
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground text-sm">Loading history…</div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-12 text-center">
        <Activity className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
        <p className="text-sm text-muted-foreground">No history recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((e, idx) => (
        <TimelineItem key={e.id} event={e} t={t} isLast={idx === events.length - 1} />
      ))}
    </div>
  );
}

function TimelineItem({
  event,
  t,
  isLast,
}: {
  event: OrderEvent;
  t: (k: any) => string;
  isLast: boolean;
}) {
  const when = new Date(event.created_at);
  const relative = formatDistanceToNow(when, { addSuffix: true });
  const absolute = format(when, "PPp");
  const dayLabel = isToday(when)
    ? "Today"
    : isYesterday(when)
      ? "Yesterday"
      : format(when, "MMM d, yyyy");
  const timeLabel = format(when, "HH:mm");

  const config = eventConfig(event, t);

  return (
    <div className="flex gap-3">
      {/* Timeline rail */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-background ${config.borderClass}`}
        >
          <config.Icon className={`h-3.5 w-3.5 ${config.iconClass}`} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border my-1" />}
      </div>

      {/* Event content */}
      <div className={`flex-1 pb-6 ${isLast ? "" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm">{config.title}</div>
            {config.detail && (
              <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                {config.detail}
              </div>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground shrink-0" title={absolute}>
            <div>{dayLabel}</div>
            <div className="tabular-nums">{timeLabel}</div>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground/70 mt-1">{relative}</div>
      </div>
    </div>
  );
}

function eventConfig(event: OrderEvent, t: (k: any) => string) {
  const from = event.from_value;
  const to = event.to_value;

  // Pretty-print a value, falling back to the translation key when it matches a known status
  const pretty = (v: string | null): string => {
    if (!v) return "—";
    // Try the i18n dict first; if no translation, just return the raw value
    try {
      const translated = t(v as any);
      return typeof translated === "string" && translated.length > 0 ? translated : v;
    } catch {
      return v;
    }
  };

  switch (event.event_type) {
    case "created":
      return {
        Icon: PlusCircle,
        borderClass: "border-emerald-500/40",
        iconClass: "text-emerald-600",
        title: "Order created",
        detail: to ? (
          <>
            <span>Status:</span>
            <Pill>{pretty(to)}</Pill>
          </>
        ) : null,
      };

    case "status_changed":
      return {
        Icon: Activity,
        borderClass: "border-indigo-500/40",
        iconClass: "text-indigo-600",
        title: "Status changed",
        detail: (
          <>
            <Pill muted>{pretty(from)}</Pill>
            <ArrowRight className="h-3 w-3" />
            <Pill>{pretty(to)}</Pill>
          </>
        ),
      };

    case "payment_changed":
      return {
        Icon: CreditCard,
        borderClass: "border-amber-500/40",
        iconClass: "text-amber-600",
        title: "Payment status changed",
        detail: (
          <>
            <Pill muted>{pretty(from)}</Pill>
            <ArrowRight className="h-3 w-3" />
            <Pill>{pretty(to)}</Pill>
          </>
        ),
      };

    case "courier_changed":
      return {
        Icon: Truck,
        borderClass: "border-sky-500/40",
        iconClass: "text-sky-600",
        title: !from ? "Courier assigned" : !to ? "Courier removed" : "Courier changed",
        detail:
          !from && to ? (
            <Pill>{to}</Pill>
          ) : from && !to ? (
            <Pill muted>{from}</Pill>
          ) : from && to ? (
            <>
              <Pill muted>{from}</Pill>
              <ArrowRight className="h-3 w-3" />
              <Pill>{to}</Pill>
            </>
          ) : null,
      };

    case "waybill_changed":
      return {
        Icon: Package2,
        borderClass: "border-purple-500/40",
        iconClass: "text-purple-600",
        title: !from ? "Waybill added" : !to ? "Waybill cleared" : "Waybill updated",
        detail:
          !from && to ? (
            <Pill mono>{to}</Pill>
          ) : from && !to ? (
            <Pill mono muted>
              {from}
            </Pill>
          ) : from && to ? (
            <>
              <Pill mono muted>
                {from}
              </Pill>
              <ArrowRight className="h-3 w-3" />
              <Pill mono>{to}</Pill>
            </>
          ) : null,
      };

    default:
      return {
        Icon: Clock,
        borderClass: "border-gray-400/40",
        iconClass: "text-gray-600",
        title: event.event_type.replace(/_/g, " "),
        detail:
          from || to ? (
            <>
              {from && <Pill muted>{from}</Pill>}
              {from && to && <ArrowRight className="h-3 w-3" />}
              {to && <Pill>{to}</Pill>}
            </>
          ) : null,
      };
  }
}

function Pill({
  children,
  muted,
  mono,
}: {
  children: React.ReactNode;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs ${
        muted
          ? "bg-muted text-muted-foreground"
          : "bg-primary/10 text-primary dark:text-primary-foreground"
      } ${mono ? "font-mono" : ""}`}
    >
      {children}
    </span>
  );
}