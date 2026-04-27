import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  orderId: string;
  orderNumber: string;
  customerPhone: string | null;
  /** How many other inquiries from the same phone are currently pending */
  duplicateCount?: number;
}

/**
 * Banner + actions shown on an order detail page when the order is an
 * inquiry from the public form. The merchant either confirms it (becomes a
 * real order) or rejects it as fake (status → cancelled, note appended).
 */
export function InquiryActions({ orderId, customerPhone, duplicateCount = 0 }: Props) {
  const { t } = useAuth();
  const qc = useQueryClient();

  const confirm = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("orders")
        .update({ is_inquiry: false })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("inquiryConfirmed"));
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async () => {
      // We use a SECURITY DEFINER-style update: cancel + flag
      const { error } = await supabase
        .from("orders")
        .update({
          is_inquiry: false,
          status: "cancelled",
          notes: "[Rejected as fake inquiry]",
        })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("inquiryRejected"));
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 mb-6">
      <div className="flex items-start gap-3">
        <Globe className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-amber-900 dark:text-amber-200">
            {t("inquiryFromPublicForm")}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("inquiryReviewDesc")}
          </p>

          {duplicateCount > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-destructive/10 text-destructive px-2 py-1 text-xs font-medium">
              ⚠️ {customerPhone} has {duplicateCount} other open inquir{duplicateCount === 1 ? "y" : "ies"}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => confirm.mutate()}
              disabled={confirm.isPending || reject.isPending}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {confirm.isPending ? "..." : t("confirmInquiry")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!confirm.isPending && !reject.isPending) {
                  if (window.confirm(t("confirmRejectInquiry"))) {
                    reject.mutate();
                  }
                }
              }}
              disabled={confirm.isPending || reject.isPending}
              className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground"
            >
              <XCircle className="h-3.5 w-3.5" />
              {reject.isPending ? "..." : t("rejectAsFake")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}