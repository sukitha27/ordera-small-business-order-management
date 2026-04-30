import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Captcha } from "@/components/app/Captcha";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

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
      options: { captchaToken: captchaToken ?? undefined },
    });
    setLoading(false);
    if (error) {
      setCaptchaToken(null);
      return toast.error(error.message);
    }
    toast.success(t("welcome"));
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">

      {/* ── Left panel ── */}
      <div
        className="hidden md:flex flex-col justify-between p-12 text-primary-foreground relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3 mb-12">
            <img
              src="/logo-lockup-inverse.svg"
              alt="Ordera"
              className="h-9 w-auto"
              onError={(e) => {
                // Fallback if SVG not found
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                const next = el.nextElementSibling as HTMLElement | null;
                if (next) next.style.display = "flex";
              }}
            />
            {/* Fallback wordmark */}
            <span className="text-2xl font-bold hidden items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">O</div>
              Ordera
            </span>
          </Link>

          <h2 className="text-4xl font-bold mb-3">{t("welcome")}</h2>
          <p className="text-primary-foreground/75 text-lg mb-10">{t("tagline")}</p>

          {/* Feature bullets */}
          <div className="space-y-4">
            {[
              "COD & bank slip verification",
              "Pronto, Domex, Koombiyo dispatch",
              "Sinhala + English dashboard",
              "Public order form for customers",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-white/60 shrink-0" />
                <span className="text-primary-foreground/80 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-primary-foreground/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Free during beta — no card needed
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          {/* Mobile logo */}
          <div className="md:hidden mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/ordera-logo.svg" alt="Ordera" className="h-8 w-auto light-only" />
              <img src="/logo-lockup-inverse.svg" alt="Ordera" className="h-8 w-auto dark-only" />
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold">{t("signIn")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back to Ordera
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("email")}</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
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
              placeholder="••••••••"
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
            {loading ? "Signing in..." : t("signIn")}
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