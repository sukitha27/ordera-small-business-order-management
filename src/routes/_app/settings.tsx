import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/PageHeader";
import { LogoUpload } from "@/components/app/LogoUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t, business, refreshBusiness, lang, setLang, updatePassword } = useAuth();
  const [form, setForm] = useState({
    business_name: "",
    owner_name: "",
    phone: "",
    address: "",
    city: "",
  });
  const [saving, setSaving] = useState(false);

  // Change-password local state
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (business)
      setForm({
        business_name: business.business_name || "",
        owner_name: business.owner_name || "",
        phone: business.phone || "",
        address: business.address || "",
        city: business.city || "",
      });
  }, [business]);

  const save = async () => {
    if (!business) return;
    setSaving(true);
    const { error } = await supabase.from("businesses").update(form).eq("id", business.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
    refreshBusiness();
  };

  const changePassword = async () => {
    if (pwd.next.length < 6) return toast.error(t("passwordTooShort"));
    if (pwd.next !== pwd.confirm) return toast.error(t("passwordMismatch"));

    setChangingPassword(true);

    // Re-authenticate with current password first — Supabase doesn't require this
    // for updateUser({ password }), but doing it prevents session-hijack scenarios
    // where someone with an open tab could change the password.
    const userEmail = (await supabase.auth.getUser()).data.user?.email;
    if (!userEmail) {
      setChangingPassword(false);
      return toast.error("Could not verify user");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: pwd.current,
    });
    if (signInError) {
      setChangingPassword(false);
      return toast.error(t("currentPasswordWrong"));
    }

    const { error } = await updatePassword(pwd.next);
    setChangingPassword(false);
    if (error) return toast.error(error.message);
    toast.success(t("passwordChanged"));
    setPwd({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-3xl">
      <PageHeader title={t("settings")} />

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="font-semibold mb-4">{t("language")}</h2>
        <div className="inline-flex rounded-lg bg-muted p-1">
          {(["en", "si"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                lang === l ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              {l === "en" ? "English" : "සිංහල"}
            </button>
          ))}
        </div>
      </div>

      {/* Branding — logo appears on invoice, waybill, and dashboard sidebar */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="font-semibold mb-1">{t("branding")}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t("brandingDesc")}</p>
        <LogoUpload />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="font-semibold mb-4">{t("profile")}</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("businessName")}</Label>
            <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("ownerName")}</Label>
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("address")}</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t("city")}</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "..." : t("save")}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-1">{t("changePassword")}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t("changePasswordDesc")}</p>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label>{t("currentPassword")}</Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("newPassword")}</Label>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={pwd.next}
              onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("confirmPassword")}</Label>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            />
          </div>
          <div className="pt-2">
            <Button
              onClick={changePassword}
              disabled={
                changingPassword || !pwd.current || !pwd.next || !pwd.confirm
              }
            >
              {changingPassword ? "..." : t("changePassword")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}