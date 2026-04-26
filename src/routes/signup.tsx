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
      // Captcha tokens are single-use — clear so user gets a fresh challenge
      setCaptchaToken(null);
      return toast.error(error.message);
    }
    // Update business profile with full details (trigger created the row)
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
      <div
        className="hidden md:flex items-center justify-center p-12 text-primary-foreground"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-white/20 backdrop-blur" />
            <span className="text-2xl font-bold">Ordera</span>
          </Link>
          <h2 className="text-4xl font-bold mb-4">{t("getStarted")}</h2>
          <p className="text-primary-foreground/80 text-lg">{t("heroDesc")}</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 overflow-y-auto">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 py-8">
          <div className="md:hidden mb-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg" style={{ background: "var(--gradient-primary)" }} />
              <span className="text-xl font-bold">Ordera</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{t("create")}</h1>
          <div className="space-y-2">
            <Label>{t("businessName")}</Label>
            <Input required value={form.business_name} onChange={(e) => update("business_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("ownerName")}</Label>
              <Input value={form.owner_name} onChange={(e) => update("owner_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("address")}</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("city")}</Label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("email")}</Label>
            <Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("password")}</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
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
            {loading ? "..." : t("create")}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}