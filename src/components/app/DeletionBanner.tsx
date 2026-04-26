import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Top-of-page banner that appears when the user's account has been scheduled
 * for deletion. Shows the days remaining until purge and a button to cancel
 * the deletion (clears deletion_scheduled_at on the business row).
 *
 * Renders nothing if the account isn't scheduled for deletion.
 */
export function DeletionBanner() {
  const { t, business, refreshBusiness } = useAuth();

  const cancelDeletion = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error("No business loaded");
      const { error } = await supabase
        .from("businesses")
        .update({ deletion_scheduled_at: null })
        .eq("id", business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("deletionCancelled"));
      refreshBusiness();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // The Business type in AuthContext may not yet include deletion_scheduled_at
  // if types haven't been regenerated. Cast through unknown so TS doesn't choke.
  const scheduledAtRaw = (business as unknown as { deletion_scheduled_at?: string | null })
    ?.deletion_scheduled_at;

  if (!scheduledAtRaw) return null;

  const scheduledAt = new Date(scheduledAtRaw);
  const purgeAt = new Date(scheduledAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, differenceInDays(purgeAt, new Date()));

  // Build the localized message via simple string replacement since our t()
  // helper only accepts a key, not interpolation args. The translation
  // strings include {days} and {date} placeholders we substitute here.
  const message = t("daysUntilDeletion")
    .replace("{days}", String(daysLeft))
    .replace("{date}", format(purgeAt, "PPP"));

  return (
    <div className="bg-destructive/10 border-b border-destructive/30">
      <div className="container mx-auto p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-destructive">
            {t("accountScheduledForDeletion")}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => cancelDeletion.mutate()}
          disabled={cancelDeletion.isPending}
          className="shrink-0 gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          {cancelDeletion.isPending ? "..." : t("cancelDeletion")}
        </Button>
      </div>
    </div>
  );
}