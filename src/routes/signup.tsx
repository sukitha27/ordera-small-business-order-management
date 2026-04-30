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

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { t } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    business_name: "",
    owner_name: "",
    phone: "",
    address: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      return toast.error(t("completeCaptcha"));
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        captchaToken: captchaToken ?? undefined,
        data: {
          business_name: form.business_name,
          owner_name: form.owner_name,
          phone: form.phone,
        },
      },
    });
    if (error) {
      setLoading(false);
      setCaptchaToken(null);
      return toast.error(error.message);
    }
    if (data.user) {
      await supabase
        .from("businesses")
        .update({
          business_name: form.business_name,
          owner_name: form.owner_name,
          phone: form.phone,
          address: form.address,
          city: form.city,
        })
        .eq("user_id", data.user.id);
    }
    setLoading(false);
    toast.success(t("created"));
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

          <h2 className="text-4xl font-bold mb-3">{t("getStarted")}</h2>
          <p className="text-primary-foreground/75 text-lg mb-10">
            Set up your account in under 2 minutes.
          </p>

          {/* What you get bullets */}
          <div className="space-y-4">
            {[
              "50 orders/month — completely free",
              "COD & bank slip verification",
              "Koombiyo, Pronto, Domex dispatch",
              "Sinhala + English interface",
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
      <div className="flex items-center justify-center p-8 overflow-y-auto">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 py-8">
          {/* Mobile logo */}
          <div className="md:hidden mb-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/ordera-logo.svg" alt="Ordera" className="h-8 w-auto light-only" />
              <img src="/logo-lockup-inverse.svg" alt="Ordera" className="h-8 w-auto dark-only" />
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold">{t("create")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start managing your orders for free
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("businessName")}</Label>
            <Input
              required
              value={form.business_name}
              onChange={(e) => update("business_name", e.target.value)}
              placeholder="My Online Store"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("ownerName")}</Label>
              <Input
                value={form.owner_name}
                onChange={(e) => update("owner_name", e.target.value)}
                placeholder="Nimal Perera"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <Input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="077..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("address")}</Label>
            <Input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="123, Main Street"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("city")}</Label>
            <Input
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Colombo"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("email")}</Label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("password")}</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min. 6 characters"
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
            {loading ? "Creating account..." : t("create")}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t("signIn")}
            </Link>
          </p>

          <p className="text-xs text-center text-muted-foreground/60">
            By creating an account you agree to our{" "}
            <Link to="/terms" className="hover:text-muted-foreground underline">Terms</Link>
            {" "}and{" "}
            <Link to="/privacy" className="hover:text-muted-foreground underline">Privacy Policy</Link>
          </p>
        </form>
      </div>
    </div>
  );
}