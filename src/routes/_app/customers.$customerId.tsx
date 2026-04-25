import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MessageCircle,
  Phone,
  MapPin,
  Mail,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Calendar,
  Star,
  AlertCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatLKR } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { buildWhatsAppLink, normalizePhoneForWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/customers/$customerId")({
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { customerId } = Route.useParams();
  const { t, business } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Sync form when customer loads
  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name ?? "",
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        address: customer.address ?? "",
        city: customer.city ?? "",
        notes: customer.notes ?? "",
      });
    }
  }, [customer]);

  // Find this customer's orders. We match by customer_id when present
  // (newer orders), and fall back to phone match for legacy orders that
  // were created before phone-autocomplete linking existed.
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["customer-orders", customerId, customer?.phone],
    enabled: !!customer,
    queryFn: async () => {
      if (!customer) return [];
      const phone = customer.phone;

      // Build the OR filter — id match first, phone fallback if available
      const filters = [`customer_id.eq.${customerId}`];
      if (phone) {
        // Match orders that have the same phone but no customer_id linked
        filters.push(`and(customer_phone.eq.${phone},customer_id.is.null)`);
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(filters.join(","))
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const updateNotes = useMutation({
    mutationFn: async (notes: string) => {
      const { error } = await supabase
        .from("customers")
        .update({ notes: notes || null })
        .eq("id", customerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("saved"));
      qc.invalidateQueries({ queryKey: ["customer", customerId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { error } = await supabase
        .from("customers")
        .update({
          name: payload.name,
          phone: payload.phone || null,
          email: payload.email || null,
          address: payload.address || null,
          city: payload.city || null,
          notes: payload.notes || null,
        })
        .eq("id", customerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("saved"));
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["customer", customerId] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customers").delete().eq("id", customerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("deleted"));
      qc.invalidateQueries({ queryKey: ["customers"] });
      navigate({ to: "/customers" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (customerLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  }
  if (!customer) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{t("customerNotFound")}</p>
        <Link to="/customers">
          <Button variant="outline" className="mt-4">
            {t("backToCustomers")}
          </Button>
        </Link>
      </div>
    );
  }

  // Aggregate stats
  const totalOrders = orders.length;
  const lifetimeSpend = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const avgOrder = totalOrders > 0 ? lifetimeSpend / totalOrders : 0;
  const lastOrder = orders[0];
  const daysSinceLastOrder = lastOrder
    ? Math.floor(
        (Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  // Customer segment based on order count
  const segment = (() => {
    if (totalOrders >= 5)
      return {
        label: t("vipCustomer"),
        Icon: Star,
        classes: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };
    if (totalOrders >= 2)
      return {
        label: t("returningCustomer"),
        Icon: TrendingUp,
        classes: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      };
    if (totalOrders === 1)
      return {
        label: t("newCustomer"),
        Icon: ShoppingBag,
        classes: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
      };
    return null;
  })();

  // WhatsApp link with a friendly check-in message
  const whatsappLink = (() => {
    if (!customer.phone || !business) return null;
    const normalized = normalizePhoneForWhatsApp(customer.phone);
    if (!normalized) return null;
    const message =
      business.language === "si"
        ? `ආයුබෝවන් ${customer.name}, ${business.business_name} වෙතින්!`
        : `Hi ${customer.name}, this is ${business.business_name}!`;
    return buildWhatsAppLink(customer.phone, message);
  })();

  const visibleOrders = orders.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = orders.length > visibleOrders.length;

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-5xl">
      {/* Back link */}
      <Link
        to="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> {t("backToCustomers")}
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              {segment && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${segment.classes}`}
                >
                  <segment.Icon className="h-3 w-3" />
                  {segment.label}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground space-y-0.5 mt-2">
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {customer.email}
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 mt-0.5" />
                  <span>{[customer.address, customer.city].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
              </a>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> {t("edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (window.confirm(t("confirmDeleteCustomer"))) {
                  del.mutate();
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> {t("delete")}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
          <StatTile
            icon={ShoppingBag}
            label={t("totalOrders")}
            value={String(totalOrders)}
            tint="text-primary"
          />
          <StatTile
            icon={Wallet}
            label={t("lifetimeSpend")}
            value={formatLKR(lifetimeSpend)}
            tint="text-emerald-600"
          />
          <StatTile
            icon={TrendingUp}
            label={t("avgOrderValue")}
            value={formatLKR(avgOrder)}
            tint="text-chart-2"
          />
          <StatTile
            icon={Calendar}
            label={t("lastOrder")}
            value={
              daysSinceLastOrder === null
                ? "—"
                : daysSinceLastOrder === 0
                  ? t("today")
                  : `${daysSinceLastOrder}${t("daysAgoSuffix")}`
            }
            tint="text-amber-600"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("customerNotes")}
        </Label>
        <Textarea
          className="mt-2"
          rows={3}
          placeholder={t("customerNotesPlaceholder")}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          onBlur={() => {
            // Only save on blur if it's actually changed
            if (form.notes !== (customer.notes ?? "")) {
              updateNotes.mutate(form.notes);
            }
          }}
        />
        <p className="text-xs text-muted-foreground mt-2">{t("notesAutoSave")}</p>
      </div>

      {/* Order history */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{t("orderHistory")}</h2>
        </div>
        {ordersLoading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {t("noOrdersFromCustomer")}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{t("orderNumber")}</th>
                    <th className="px-4 py-3">{t("date")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3">{t("payment")}</th>
                    <th className="px-4 py-3 text-right">{t("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((o) => (
                    <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          to="/orders/$orderId"
                          params={{ orderId: o.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div title={format(new Date(o.created_at), "PPp")}>
                          {format(new Date(o.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs">
                          {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={o.status} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={o.payment_status} kind="payment" />
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatLKR(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div className="px-4 py-3 border-t border-border text-center">
                <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)}>
                  {t("loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editCustomer")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("phone")}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("address")}</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("city")}</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => update.mutate(form)}
              disabled={!form.name || update.isPending}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: any;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${tint}`} />
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}