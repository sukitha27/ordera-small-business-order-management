import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Captcha } from "@/components/app/Captcha";
import { toast } from "sonner";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Captcha token expires after ~5 min; we ask the user to re-verify if so.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      return toast.error(t("completeCaptcha"));
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken: captchaToken ?? undefined,
      },
    });
    setLoading(false);
    if (error) {
      // Captcha token is single-use — clear it on any failure so the user
      // gets a fresh challenge for their next attempt.
      setCaptchaToken(null);
      return toast.error(error.message);
    }
    toast.success(t("welcome"));
    navigate({ to: "/dashboard" });
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
          <h2 className="text-4xl font-bold mb-4">{t("welcome")}</h2>
          <p className="text-primary-foreground/80 text-lg">{t("tagline")}</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div className="md:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg" style={{ background: "var(--gradient-primary)" }} />
              <span className="text-xl font-bold">Ordera</span>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t("signIn")}</h1>
          </div>
          <div className="space-y-2">
            <Label>{t("email")}</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("password")}</Label>
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {TURNSTILE_SITE_KEY && (
            <Captcha
              siteKey={TURNSTILE_SITE_KEY}
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (!!TURNSTILE_SITE_KEY && !captchaToken)}
          >
            {loading ? "..." : t("signIn")}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            {t("noAccount")}{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              {t("signUp")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}