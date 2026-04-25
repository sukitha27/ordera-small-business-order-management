import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatLKR } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const STORAGE_BUCKET = "payment-slips";
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

interface PaymentSlip {
  id: string;
  order_id: string;
  business_id: string;
  image_path: string;
  mime_type: string | null;
  slip_amount: number;
  status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  notes: string | null;
  uploaded_at: string;
  verified_at: string | null;
}

export function SlipUploadPanel({
  orderId,
  businessId,
  orderTotal,
}: {
  orderId: string;
  businessId: string;
  orderTotal: number;
}) {
  const { t } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingAmount, setPendingAmount] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [previewSlip, setPreviewSlip] = useState<PaymentSlip | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: slips = [], isLoading } = useQuery<PaymentSlip[]>({
    queryKey: ["payment-slips", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_slips")
        .select("*")
        .eq("order_id", orderId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentSlip[];
    },
  });

  const verifiedSum = slips
    .filter((s) => s.status === "verified")
    .reduce((sum, s) => sum + Number(s.slip_amount), 0);
  const pendingSum = slips
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + Number(s.slip_amount), 0);
  const remaining = Math.max(0, orderTotal - verifiedSum);

  const handleFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t("invalidFileType"));
      return;
    }
    setPendingFile(file);
    setPendingAmount(remaining > 0 ? remaining.toFixed(2) : "");
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const upload = useMutation({
    mutationFn: async () => {
      if (!pendingFile) throw new Error(t("selectFile"));
      const amt = parseFloat(pendingAmount);
      if (!amt || amt <= 0) throw new Error(t("enterAmount"));

      setUploading(true);

      let fileToUpload: File | Blob = pendingFile;
      if (pendingFile.type.startsWith("image/")) {
        try {
          fileToUpload = await imageCompression(pendingFile, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1800,
            useWebWorker: true,
            initialQuality: 0.85,
          });
        } catch (err) {
          console.warn("Image compression failed, uploading original", err);
        }
      }

      if (fileToUpload.size > MAX_FILE_BYTES) {
        throw new Error(t("fileTooLarge"));
      }

      const ext = pendingFile.name.split(".").pop()?.toLowerCase() ?? "bin";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${businessId}/${orderId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, fileToUpload, {
          contentType: pendingFile.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("payment_slips").insert({
        order_id: orderId,
        business_id: businessId,
        image_path: path,
        mime_type: pendingFile.type,
        slip_amount: amt,
      });
      if (insertError) {
        await supabase.storage.from(STORAGE_BUCKET).remove([path]);
        throw insertError;
      }
    },
    onSuccess: () => {
      toast.success(t("slipUploaded"));
      setPendingFile(null);
      setPendingAmount("");
      qc.invalidateQueries({ queryKey: ["payment-slips", orderId] });
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setUploading(false),
  });

  const verify = useMutation({
    mutationFn: async (slip: PaymentSlip) => {
      const { error } = await supabase
        .from("payment_slips")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .eq("id", slip.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["payment-slips", orderId] });
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });

      const { data: order } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", orderId)
        .single();
      if (order?.payment_status === "paid") {
        toast.success(t("autoMarkedPaid"));
      } else {
        toast.success(t("slipVerified"));
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async ({ slip, reason }: { slip: PaymentSlip; reason: string }) => {
      const { error } = await supabase
        .from("payment_slips")
        .update({
          status: "rejected",
          rejection_reason: reason || null,
        })
        .eq("id", slip.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("slipRejected"));
      qc.invalidateQueries({ queryKey: ["payment-slips", orderId] });
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (slip: PaymentSlip) => {
      await supabase.storage.from(STORAGE_BUCKET).remove([slip.image_path]);
      const { error } = await supabase.from("payment_slips").delete().eq("id", slip.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("slipDeleted"));
      qc.invalidateQueries({ queryKey: ["payment-slips", orderId] });
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openPreview = async (slip: PaymentSlip) => {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(slip.image_path, 60 * 5);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPreviewSlip(slip);
    setPreviewUrl(data.signedUrl);
  };

  const closePreview = () => {
    setPreviewSlip(null);
    setPreviewUrl(null);
  };

  const enteredAmount = parseFloat(pendingAmount);
  const amountMismatch =
    pendingFile && enteredAmount > 0 && remaining > 0 && Math.abs(enteredAmount - remaining) > 0.01;

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> {t("bankTransferSlips")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("slipsHelpText")}</p>
        </div>

        {/* Summary — vertical stack so amounts don't overflow in narrow columns */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("orderTotal")}</span>
            <span className="font-medium tabular-nums">{formatLKR(orderTotal)}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
            <span>{t("verifiedAmount")}</span>
            <span className="font-medium tabular-nums">{formatLKR(verifiedSum)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-border text-amber-700 dark:text-amber-400">
            <span>{t("remaining")}</span>
            <span className="font-bold tabular-nums">{formatLKR(remaining)}</span>
          </div>
        </div>

        {!pendingFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/40"
            }`}
          >
            <Upload className="h-7 w-7 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium">{t("dropSlipHere")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("slipFileHint")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={onFilePick}
              className="hidden"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {pendingFile.type.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{pendingFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(pendingFile.size / 1024).toFixed(0)} KB
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => {
                  setPendingFile(null);
                  setPendingAmount("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("amountOnSlip")}</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={pendingAmount}
                onChange={(e) => setPendingAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
              {amountMismatch && (
                <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    {t("amountMismatchWarning")} {formatLKR(remaining)}.
                  </span>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={() => upload.mutate()}
              disabled={uploading || !pendingAmount || parseFloat(pendingAmount) <= 0}
            >
              {uploading ? t("uploading") : t("uploadSlip")}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-4">{t("loading")}</div>
        ) : slips.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("uploadedSlips")} ({slips.length})
            </div>
            {slips.map((slip) => (
              <SlipRow
                key={slip.id}
                slip={slip}
                onPreview={() => openPreview(slip)}
                onVerify={() => verify.mutate(slip)}
                onReject={() => {
                  const reason = window.prompt(t("rejectionReasonPrompt"), "");
                  if (reason !== null) {
                    reject.mutate({ slip, reason });
                  }
                }}
                onDelete={() => {
                  if (window.confirm(t("confirmDeleteSlip"))) {
                    remove.mutate(slip);
                  }
                }}
                t={t}
              />
            ))}
            {pendingSum > 0 && (
              <div className="text-xs text-muted-foreground italic pt-1">
                {t("pendingVerificationOf")} {formatLKR(pendingSum)}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {previewSlip && previewUrl && (
        <SlipPreviewModal slip={previewSlip} url={previewUrl} onClose={closePreview} t={t} />
      )}
    </>
  );
}

function SlipRow({
  slip,
  onPreview,
  onVerify,
  onReject,
  onDelete,
  t,
}: {
  slip: PaymentSlip;
  onPreview: () => void;
  onVerify: () => void;
  onReject: () => void;
  onDelete: () => void;
  t: (k: any) => string;
}) {
  const isImage = slip.mime_type?.startsWith("image/");
  const ago = formatDistanceToNow(new Date(slip.uploaded_at), { addSuffix: true });

  const statusConfig = {
    verified: {
      Icon: CheckCircle2,
      label: t("verified"),
      classes: "border-emerald-500/40 bg-emerald-500/5",
      textClass: "text-emerald-700 dark:text-emerald-400",
      iconClass: "text-emerald-600",
    },
    pending: {
      Icon: Clock,
      label: t("pending"),
      classes: "border-amber-500/40 bg-amber-500/5",
      textClass: "text-amber-700 dark:text-amber-400",
      iconClass: "text-amber-600",
    },
    rejected: {
      Icon: X,
      label: t("rejected"),
      classes: "border-rose-500/40 bg-rose-500/5",
      textClass: "text-rose-700 dark:text-rose-400",
      iconClass: "text-rose-600",
    },
  }[slip.status];

  return (
    <div className={`rounded-lg border p-3 ${statusConfig.classes}`}>
      {/* Top row: thumbnail + amount/status info */}
      <div className="flex items-start gap-3 mb-2">
        <button
          onClick={onPreview}
          className="h-11 w-11 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 hover:bg-muted transition-colors"
          title={t("preview")}
        >
          {isImage ? (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="font-bold tabular-nums text-foreground">
            {formatLKR(slip.slip_amount)}
          </div>
          <div className={`inline-flex items-center gap-1 text-xs ${statusConfig.textClass}`}>
            <statusConfig.Icon className={`h-3 w-3 ${statusConfig.iconClass}`} />
            {statusConfig.label}
            <span className="text-muted-foreground ml-1">· {ago}</span>
          </div>
          {slip.rejection_reason && (
            <div className="text-xs italic mt-1 text-rose-700 dark:text-rose-400 wrap-break-word">
              {slip.rejection_reason}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs flex-1 gap-1"
          onClick={onPreview}
        >
          <Eye className="h-3 w-3" /> {t("preview")}
        </Button>

        {slip.status === "pending" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs flex-1 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              onClick={onVerify}
            >
              <Check className="h-3 w-3" /> {t("verify")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs flex-1 gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
              onClick={onReject}
            >
              <X className="h-3 w-3" /> {t("reject")}
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onDelete}
          title={t("delete")}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function SlipPreviewModal({
  slip,
  url,
  onClose,
  t,
}: {
  slip: PaymentSlip;
  url: string;
  onClose: () => void;
  t: (k: any) => string;
}) {
  const isImage = slip.mime_type?.startsWith("image/");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{formatLKR(slip.slip_amount)}</div>
            <div className="text-xs text-muted-foreground capitalize">{slip.status}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} title={t("close")}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
          {isImage ? (
            <img src={url} alt="Slip" className="max-w-full max-h-[70vh] rounded-lg shadow" />
          ) : (
            <iframe
              src={url}
              className="w-full h-[70vh] rounded-lg border border-border bg-white"
              title="Slip PDF"
            />
          )}
        </div>
      </div>
    </div>
  );
}