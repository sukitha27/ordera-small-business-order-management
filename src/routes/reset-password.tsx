import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t, updatePassword } = useAuth();
  const navigate = useNavigate();

  // When the user clicks the link in the reset email, Supabase creates a
  // temporary session automatically via the onAuthStateChange 'PASSWORD_RECOVERY' event.
  // We need to gate the form on that session existing, so random visitors can't set passwords.
  const [ready, setReady] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [password, setPasswordInput] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Check if we have a session (Supabase puts one in place from the recovery link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        // Wait briefly for the recovery event to fire on the URL hash
        const timeout = setTimeout(() => setTokenError(true), 2500);
        const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
          if (event === "PASSWORD_RECOVERY" || sess) {
            clearTimeout(timeout);
            setReady(true);
            setTokenError(false);
          }
        });
        return () => sub.subscription.unsubscribe();
      }
    });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error(t("passwordTooShort"));
    if (password !== confirm) return toast.error(t("passwordMismatch"));
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) return toast.error(error.message);
    setDone(true);
    toast.success(t("passwordChanged"));
    // Sign out so the temporary recovery session is gone, then send them to login
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate({ to: "/login" });
    }, 1500);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div
        className="hidden md:flex items-center justify-center p-12 text-primary-foreground relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-white/20 backdrop-blur" />
            <span className="text-2xl font-bold">Ordera</span>
          </Link>
          <h2 className="text-4xl font-bold mb-4">{t("setNewPassword")}</h2>
          <p className="text-primary-foreground/80 text-lg">{t("setNewPasswordDesc")}</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-lg"
                style={{ background: "var(--gradient-primary)" }}
              />
              <span className="text-xl font-bold">Ordera</span>
            </Link>
          </div>

          {tokenError ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">{t("linkExpired")}</h1>
                <p className="text-sm text-muted-foreground">{t("linkExpiredDesc")}</p>
              </div>
              <div className="pt-4 space-y-2">
                <Link to="/forgot-password">
                  <Button className="w-full">{t("sendResetLink")}</Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" /> {t("backToLogin")}
                  </Button>
                </Link>
              </div>
            </div>
          ) : done ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">{t("passwordChanged")}</h1>
                <p className="text-sm text-muted-foreground">{t("redirectingLogin")}</p>
              </div>
            </div>
          ) : !ready ? (
            <div className="text-center text-muted-foreground">Loading…</div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <h1 className="text-3xl font-bold">{t("setNewPassword")}</h1>
                <p className="text-sm text-muted-foreground mt-2">{t("setNewPasswordDesc")}</p>
              </div>
              <div className="space-y-2">
                <Label>{t("newPassword")}</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>{t("confirmPassword")}</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : t("changePassword")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}