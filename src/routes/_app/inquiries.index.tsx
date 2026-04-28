import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  CheckCircle2,
  XCircle,
  X,
  Inbox,
  AlertTriangle,
  Globe,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatLKR } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/app/PageHeader";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface InquiriesSearch {
  view?: "pending" | "rejected" | "all";
}

export const Route = createFileRoute("/_app/inquiries/")({
  validateSearch: (raw: Record<string, unknown>): InquiriesSearch => ({
    view: raw.view === "rejected" || raw.view === "all" ? raw.view : "pending",
  }),
  component: InquiriesPage,
});

interface InquiryRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  customer_city: string | null;
  status: string;
  payment_method: string;
  total: number | string;
  notes: string | null;
  inquiry_source: string | null;
  created_at: string;
  is_inquiry: boolean;
}

function InquiriesPage() {
  const { t, business } = useAuth();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const view = search.view ?? "pending";

  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Single query: ALL rows where is_inquiry=true. Then we partition them
  // into pending (status != 'cancelled') and rejected (status = 'cancelled')
  // client-side. This is much simpler than two queries + dedupe.
  const { data: rawInquiries = [], isLoading } = useQuery({
    queryKey: ["inquiries", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("is_inquiry", true)
        .order("created_at", { ascending: false });
      return (data ?? []) as InquiryRow[];
    },
  });

  // Item counts for the visible inquiries
  const inquiryIds = rawInquiries.map((r) => r.id);
  const { data: items = [] } = useQuery({
    queryKey: ["inquiry-items", inquiryIds.sort().join(",")],
    enabled: inquiryIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("order_id, product_name, quantity")
        .in("order_id", inquiryIds);
      return data ?? [];
    },
  });

  const itemCountByOrder = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of items) {
      map[it.order_id] = (map[it.order_id] || 0) + it.quantity;
    }
    return map;
  }, [items]);

  // Duplicate-phone detection across PENDING inquiries only
  const duplicatePhones = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rawInquiries) {
      if (r.status === "cancelled") continue;
      const p = (r.customer_phone || "").replace(/\s+/g, "");
      if (!p) continue;
      counts[p] = (counts[p] || 0) + 1;
    }
    return new Set(Object.entries(counts).filter(([, n]) => n > 1).map(([p]) => p));
  }, [rawInquiries]);

  // Partition by view
  const pendingRows = rawInquiries.filter((r) => r.status !== "cancelled");
  const rejectedRows = rawInquiries.filter((r) => r.status === "cancelled");

  const inquiries =
    view === "pending" ? pendingRows : view === "rejected" ? rejectedRows : rawInquiries;

  // Apply search
  const filtered = inquiries.filter((r) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      r.order_number.toLowerCase().includes(s) ||
      r.customer_name.toLowerCase().includes(s) ||
      (r.customer_phone || "").toLowerCase().includes(s) ||
      (r.customer_city || "").toLowerCase().includes(s)
    );
  });

  const pendingCount = pendingRows.length;
  const rejectedCount = rejectedRows.length;

  // Bulk actions
  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const bulkConfirm = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected);
      const { error } = await supabase
        .from("orders")
        .update({ is_inquiry: false })
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(t("inquiriesConfirmedCount").replace("{count}", String(count)));
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["inquiries"] });
      qc.invalidateQueries({ queryKey: ["sidebar-inquiries-count"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkReject = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected);
      // Keep is_inquiry=true — rejected inquiries stay in /inquiries
      // (Rejected tab) and never pollute the main /orders list.
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          notes: "[Rejected as fake inquiry — bulk action]",
        })
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(t("inquiriesRejectedCount").replace("{count}", String(count)));
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["inquiries"] });
      qc.invalidateQueries({ queryKey: ["sidebar-inquiries-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const slug = (business as unknown as { slug?: string | null })?.slug;
  const formEnabled = (business as unknown as { public_form_enabled?: boolean | null })
    ?.public_form_enabled;

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-7xl">
      <PageHeader title={t("inquiries")} description={t("inquiriesDesc")} />

      {/* Public form status */}
      {!formEnabled && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3">
          <Globe className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-amber-900 dark:text-amber-200">
              {t("publicFormNotEnabled")}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{t("publicFormNotEnabledDesc")}</p>
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm" className="shrink-0">
              {t("enableInSettings")}
            </Button>
          </Link>
        </div>
      )}

      {formEnabled && slug && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 flex items-center gap-3">
          <Globe className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wider">
              {t("yourPublicUrl")}
            </div>
            <code className="text-sm font-mono truncate block">
              {window.location.origin}/order/{slug}
            </code>
          </div>
          <a href={`/order/${slug}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              {t("preview")}
            </Button>
          </a>
        </div>
      )}

      {/* View tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        <Link
          to="/inquiries"
          search={{ view: "pending" }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            view === "pending"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("pendingReview")}
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-destructive text-destructive-foreground">
              {pendingCount}
            </span>
          )}
        </Link>
        <Link
          to="/inquiries"
          search={{ view: "rejected" }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            view === "rejected"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("rejected")}
          {rejectedCount > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">({rejectedCount})</span>
          )}
        </Link>
        <Link
          to="/inquiries"
          search={{ view: "all" }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            view === "all"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("all")}
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchInquiries")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {view === "pending" && selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-border">
            <span className="text-sm font-medium">
              {selected.size} {t("selected")}
            </span>
            <Button
              size="sm"
              onClick={() => bulkConfirm.mutate()}
              disabled={bulkConfirm.isPending || bulkReject.isPending}
              className="h-8 gap-1.5 text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {bulkConfirm.isPending ? "..." : t("confirmAll")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (window.confirm(t("confirmBulkReject"))) {
                  bulkReject.mutate();
                }
              }}
              disabled={bulkConfirm.isPending || bulkReject.isPending}
              className="h-8 gap-1.5 text-xs text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground"
            >
              <XCircle className="h-3.5 w-3.5" />
              {bulkReject.isPending ? "..." : t("rejectAll")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="ml-auto gap-1"
            >
              <X className="h-3 w-3" /> {t("clear")}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">{t("loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {view === "pending"
                ? t("noPendingInquiries")
                : view === "rejected"
                  ? t("noRejectedInquiries")
                  : t("noInquiriesYet")}
            </p>
            {view === "pending" && formEnabled && slug && (
              <p className="text-xs text-muted-foreground mt-2">{t("shareUrlForOrders")}</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {view === "pending" && (
                    <th className="px-4 py-3 w-10">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    </th>
                  )}
                  <th className="px-4 py-3">{t("orderNumber")}</th>
                  <th className="px-4 py-3">{t("when")}</th>
                  <th className="px-4 py-3">{t("customer")}</th>
                  <th className="px-4 py-3">{t("address")}</th>
                  <th className="px-4 py-3">{t("items")}</th>
                  <th className="px-4 py-3">{t("payment")}</th>
                  <th className="px-4 py-3 text-right">{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const phone = (r.customer_phone || "").replace(/\s+/g, "");
                  const isDuplicate = phone && duplicatePhones.has(phone);
                  const itemCount = itemCountByOrder[r.id] || 0;
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                      {view === "pending" && (
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selected.has(r.id)}
                            onCheckedChange={() => toggleOne(r.id)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <Link
                          to="/orders/$orderId"
                          params={{ orderId: r.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {r.order_number}
                        </Link>
                        {isDuplicate && (
                          <span
                            title={t("duplicatePhoneWarning")}
                            className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold"
                          >
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {t("duplicate")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="text-sm">{format(new Date(r.created_at), "MMM d, p")}</div>
                        <div className="text-xs">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{r.customer_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.customer_address && (
                          <div className="text-muted-foreground line-clamp-1">
                            {r.customer_address}
                          </div>
                        )}
                        {r.customer_city && <div className="font-medium">{r.customer_city}</div>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {itemCount} {itemCount === 1 ? t("item") : t("itemPlural")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted">
                          {r.payment_method === "cod" ? "COD" : t("bankTransfer")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatLKR(Number(r.total))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && view === "pending" && (
        <p className="mt-4 text-xs text-muted-foreground text-center">{t("clickInquiryToReview")}</p>
      )}
    </div>
  );
}