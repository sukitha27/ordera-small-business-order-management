import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Captcha } from "@/components/app/Captcha";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

/**
 * "Danger Zone" card for the settings page. Lets the user request a 30-day
 * scheduled deletion of their account. Calls the delete-account edge function
 * which validates their password (with captcha token, since captcha enforcement
 * is enabled globally on auth) then sets deletion_scheduled_at on the
 * business row. After confirmation we sign them out so they're forced to
 * log back in (and see the deletion banner) if they want to recover.
 */
export function DeleteAccountSection() {
  const { t, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const scheduleDeletion = useMutation({
    mutationFn: async () => {
      if (confirmText !== "DELETE") {
        throw new Error(t("typeDeleteToConfirm"));
      }
      if (!password) {
        throw new Error(t("passwordRequired"));
      }
      if (TURNSTILE_SITE_KEY && !captchaToken) {
        throw new Error(t("completeCaptcha"));
      }

      // Get the user's access token to authenticate the function call
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password,
          captchaToken: captchaToken ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: async () => {
      toast.success(t("accountScheduledForDeletion"));
      setOpen(false);
      // Sign out — they'll see the banner if they log back in within 30 days
      await signOut();
      window.location.href = "/";
    },
    onError: (e: Error) => {
      // Captcha tokens are single-use — clear so user gets a fresh challenge
      // for their next attempt
      setCaptchaToken(null);
      toast.error(e.message);
    },
  });

  // Reset form fields when dialog opens to avoid stale state from previous attempts
  const openDialog = () => {
    setPassword("");
    setConfirmText("");
    setCaptchaToken(null);
    setOpen(true);
  };

  return (
    <>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="font-semibold text-destructive flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4" />
          {t("dangerZone")}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">{t("dangerZoneDesc")}</p>

        <div className="rounded-lg border border-border bg-background p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm">{t("deleteAccount")}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("deleteAccountDesc")}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground gap-2"
            onClick={openDialog}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("deleteAccount")}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t("deleteAccountConfirmTitle")}
            </DialogTitle>
            <DialogDescription>{t("deleteAccountConfirmDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
              <div className="font-medium mb-1">{t("whatGetsDeleted")}</div>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>{t("deletedItem1")}</li>
                <li>{t("deletedItem2")}</li>
                <li>{t("deletedItem3")}</li>
                <li>{t("deletedItem4")}</li>
              </ul>
              <div className="text-xs mt-2 italic">{t("deletionGracePeriod")}</div>
            </div>

            <div className="space-y-2">
              <Label>{t("currentPassword")}</Label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("enterPasswordToConfirm")}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t("typeToConfirm")}{" "}
                <span className="font-mono text-destructive">DELETE</span>
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>

            {/* Captcha — required because Supabase has Turnstile enforcement
                enabled globally, so the password verification call inside
                the edge function needs a fresh token */}
            {TURNSTILE_SITE_KEY && (
              <Captcha
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => scheduleDeletion.mutate()}
              disabled={
                scheduleDeletion.isPending ||
                !password ||
                confirmText !== "DELETE" ||
                (!!TURNSTILE_SITE_KEY && !captchaToken)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {scheduleDeletion.isPending ? "..." : t("scheduleDeletion")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}