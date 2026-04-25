import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t, sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await sendPasswordResetEmail(email);
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
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
          <h2 className="text-4xl font-bold mb-4">{t("resetPassword")}</h2>
          <p className="text-primary-foreground/80 text-lg">{t("resetPasswordDesc")}</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        {sent ? (
          <div className="w-full max-w-sm space-y-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">{t("checkEmail")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("resetLinkSent")} <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>
            <div className="pt-4 space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="w-full"
              >
                {t("sendAgain")}
              </Button>
              <Link to="/login">
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" /> {t("backToLogin")}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
            <div className="md:hidden mb-8">
              <Link to="/" className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg"
                  style={{ background: "var(--gradient-primary)" }}
                />
                <span className="text-xl font-bold">Ordera</span>
              </Link>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t("resetPassword")}</h1>
              <p className="text-sm text-muted-foreground mt-2">{t("resetPasswordDesc")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : t("sendResetLink")}
            </Button>
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {t("backToLogin")}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}