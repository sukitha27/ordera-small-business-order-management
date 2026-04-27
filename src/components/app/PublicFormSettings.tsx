import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Copy, ExternalLink, Globe, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { slugify, getSlugError } from "@/lib/slug";
import { toast } from "sonner";

/**
 * Settings card for the public order form.
 *
 * Lets the merchant:
 *   - Enable/disable the public ordering URL
 *   - Set/edit their slug (the URL identifier)
 *   - Copy the public URL to clipboard
 *   - Open the URL in a new tab to preview
 *
 * Slug is auto-generated from the business name on first access if not set.
 */
export function PublicFormSettings() {
  const { t, business, refreshBusiness } = useAuth();

  // Treat business as a record we can spread; the generated type may not
  // include slug/public_form_enabled yet if types haven't been regenerated.
  const b = business as unknown as
    | {
        id: string;
        business_name: string;
        slug: string | null;
        public_form_enabled: boolean | null;
      }
    | null;

  const [slug, setSlug] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Hydrate local state when business loads/changes. If they don't have a
  // slug yet, suggest one from their business name.
  useEffect(() => {
    if (!b) return;
    setSlug(b.slug || slugify(b.business_name || ""));
    setEnabled(!!b.public_form_enabled);
  }, [b?.id, b?.slug, b?.public_form_enabled, b?.business_name]);

  const saveSlug = useMutation({
    mutationFn: async (newSlug: string) => {
      if (!b) throw new Error("No business loaded");
      const err = getSlugError(newSlug);
      if (err) throw new Error(err);
      const { error } = await supabase
        .from("businesses")
        .update({ slug: newSlug })
        .eq("id", b.id);
      if (error) {
        // Postgres unique-violation code 23505
        if (error.code === "23505") {
          throw new Error(t("slugTaken"));
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("saved"));
      refreshBusiness();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleEnabled = useMutation({
    mutationFn: async (next: boolean) => {
      if (!b) throw new Error("No business loaded");
      // Can't enable without a valid saved slug
      if (next && (!b.slug || getSlugError(b.slug))) {
        throw new Error(t("saveSlugFirst"));
      }
      const { error } = await supabase
        .from("businesses")
        .update({ public_form_enabled: next })
        .eq("id", b.id);
      if (error) throw error;
    },
    onSuccess: (_data, next) => {
      toast.success(next ? t("publicFormEnabled") : t("publicFormDisabled"));
      refreshBusiness();
    },
    onError: (e: Error) => {
      // Reset toggle to actual server state on error
      setEnabled(!!b?.public_form_enabled);
      toast.error(e.message);
    },
  });

  // Validate slug as user types (but only show error if non-empty)
  const onSlugChange = (next: string) => {
    setSlug(next);
    setSlugError(next ? getSlugError(next) : null);
  };

  const publicUrl = b?.slug
    ? `${window.location.origin}/order/${b.slug}`
    : "";

  const copyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t("urlCopied"));
    } catch {
      toast.error("Could not copy");
    }
  };

  if (!b) return null;

  const slugUnchanged = slug === b.slug;
  const canSave = !!slug && !slugError && !slugUnchanged;

  return (
    <div className="rounded-xl border border-border bg-card p-6 mb-6">
      <h2 className="font-semibold mb-1 flex items-center gap-2">
        <Globe className="h-4 w-4" />
        {t("publicOrderForm")}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">{t("publicOrderFormDesc")}</p>

      {/* Slug field */}
      <div className="space-y-2 mb-4">
        <Label>{t("publicFormUrl")}</Label>
        <div className="flex items-stretch gap-2">
          <div className="flex-1 flex items-stretch rounded-md border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
            <span className="px-3 py-2 text-sm text-muted-foreground bg-muted whitespace-nowrap select-none border-r border-border">
              /order/
            </span>
            <Input
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="my-shop"
              className="border-0 rounded-none focus-visible:ring-0"
            />
          </div>
          <Button
            onClick={() => saveSlug.mutate(slug)}
            disabled={!canSave || saveSlug.isPending}
            variant="outline"
          >
            {saveSlug.isPending ? "..." : t("saveSlug")}
          </Button>
        </div>
        {slugError && (
          <p className="text-xs text-destructive">{slugError}</p>
        )}
        {!slugError && (
          <p className="text-xs text-muted-foreground">{t("slugHint")}</p>
        )}
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{t("enablePublicForm")}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {enabled ? t("publicFormLive") : t("publicFormOff")}
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(next) => {
            setEnabled(next);
            toggleEnabled.mutate(next);
          }}
          disabled={toggleEnabled.isPending}
        />
      </div>

      {/* Live URL display when enabled */}
      {b.public_form_enabled && b.slug && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-2">
          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {t("yourPublicUrl")}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 truncate">
              {publicUrl}
            </code>
            <Button size="sm" variant="outline" onClick={copyUrl} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("copied") : t("copy")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(publicUrl, "_blank")}
              className="gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("preview")}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("shareUrlHint")}</p>
        </div>
      )}
    </div>
  );
}