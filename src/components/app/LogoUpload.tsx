import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Trash2, ImageIcon, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BusinessLogo } from "@/components/app/BusinessLogo";
import { toast } from "sonner";

const BUCKET = "business-assets";
const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

/**
 * Logo management UI for the settings page. Handles upload (with image
 * compression), preview of the current logo, and removal. After any change
 * we call refreshBusiness() so the new logo immediately shows in the
 * sidebar/header without a page reload.
 */
export function LogoUpload() {
  const { t, business, refreshBusiness } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!business) throw new Error("No business loaded");
      if (!ACCEPTED.includes(file.type)) {
        throw new Error(t("invalidFileType"));
      }

      // Compress raster formats. Don't compress SVG (vector) — pass through.
      let toUpload: File | Blob = file;
      if (file.type !== "image/svg+xml" && file.type.startsWith("image/")) {
        try {
          toUpload = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 600,
            useWebWorker: true,
            initialQuality: 0.9,
          });
        } catch (err) {
          // If compression fails (rare), upload original — the bucket cap will
          // reject anything genuinely too large.
          console.warn("Logo compression failed, uploading original", err);
        }
      }

      if (toUpload.size > MAX_BYTES) {
        throw new Error(t("fileTooLarge"));
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      // Stable filename per business so old objects get replaced via upsert.
      // We include a short random suffix to bust any CDN caches.
      const filename = `logo-${Date.now()}.${ext}`;
      const path = `${business.id}/logo/${filename}`;

      // Delete previous logo (if any) to prevent storage clutter
      if (business.logo_url) {
        await supabase.storage.from(BUCKET).remove([business.logo_url]);
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, toUpload, {
          contentType: file.type,
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("businesses")
        .update({ logo_url: path })
        .eq("id", business.id);
      if (dbError) {
        // Best-effort cleanup if DB update fails
        await supabase.storage.from(BUCKET).remove([path]);
        throw dbError;
      }
    },
    onSuccess: () => {
      toast.success(t("logoUploaded"));
      refreshBusiness();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!business?.logo_url) return;
      await supabase.storage.from(BUCKET).remove([business.logo_url]);
      const { error } = await supabase
        .from("businesses")
        .update({ logo_url: null })
        .eq("id", business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("logoRemoved"));
      refreshBusiness();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    upload.mutate(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const isBusy = upload.isPending || remove.isPending;
  const hasLogo = !!business?.logo_url;

  return (
    <div className="space-y-3">
      {hasLogo ? (
        // Existing logo — show preview with remove + replace actions
        <div className="rounded-xl border border-border bg-background p-5 flex items-center gap-4">
          <div className="h-20 w-20 rounded-lg bg-muted/40 border border-border flex items-center justify-center shrink-0 overflow-hidden">
            <BusinessLogo
              path={business?.logo_url}
              alt={business?.business_name}
              size="lg"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{t("currentLogo")}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("logoAppearsOn")}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => inputRef.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                t("replace")
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => {
                if (window.confirm(t("confirmRemoveLogo"))) {
                  remove.mutate();
                }
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        // No logo — show drop zone
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!isBusy) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !isBusy && inputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/40"
          } ${isBusy ? "opacity-60 cursor-wait" : ""}`}
        >
          {upload.isPending ? (
            <Loader2 className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2 animate-spin" />
          ) : (
            <Upload className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
          )}
          <p className="text-sm font-medium">{t("dropLogoHere")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("logoFileHint")}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onPick}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ImageIcon className="h-3 w-3" />
        {t("logoTip")}
      </p>
    </div>
  );
}