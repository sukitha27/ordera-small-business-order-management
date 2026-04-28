import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef, type FormEvent } from "react";
import {
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X as XIcon,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BusinessLogo } from "@/components/app/BusinessLogo";
import { Captcha } from "@/components/app/Captcha";
import { formatLKR } from "@/lib/i18n";
import { toast } from "sonner";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
// 2MB upload limit — same as merchant slip upload
const MAX_SLIP_BYTES = 2 * 1024 * 1024;
const ALLOWED_SLIP_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const Route = createFileRoute("/order/$slug")({
  component: PublicOrderFormPage,
});

interface PublicBusiness {
  id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  city: string | null;
  logo_url: string | null;
  slug: string;
}

interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

function PublicOrderFormPage() {
  const { slug } = useParams({ from: "/order/$slug" });

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [notes, setNotes] = useState("");
  // Use 'cod' or 'bank_transfer' — these match the orders_payment_method_check
  // CHECK constraint exactly. Don't change without updating the constraint.
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");

  // Bank-transfer slip upload state
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const slipInputRef = useRef<HTMLInputElement>(null);

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch business + products
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: bizRows, error: bizErr } = await supabase
        .from("businesses")
        .select("id,business_name,owner_name,phone,city,logo_url,slug")
        .eq("slug", slug)
        .limit(1);
      if (cancelled) return;
      if (bizErr || !bizRows || bizRows.length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const biz = bizRows[0] as PublicBusiness;
      setBusiness(biz);
      const { data: prodRows } = await supabase
        .from("products")
        .select("id,name,description,price,image_url,stock")
        .eq("business_id", biz.id)
        .eq("is_active", true)
        .order("name");
      if (cancelled) return;
      setProducts((prodRows as PublicProduct[]) || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Cart calculations
  const cart: CartItem[] = useMemo(() => {
    return Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([pid, qty]) => {
        const p = products.find((x) => x.id === pid);
        return {
          productId: pid,
          name: p?.name || "",
          unitPrice: p ? Number(p.price) : 0,
          quantity: qty,
        };
      });
  }, [quantities, products]);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = subtotal;

  const incQty = (pid: string, max: number) => {
    setQuantities((q) => ({ ...q, [pid]: Math.min((q[pid] || 0) + 1, max > 0 ? max : 999) }));
  };
  const decQty = (pid: string) => {
    setQuantities((q) => ({ ...q, [pid]: Math.max((q[pid] || 0) - 1, 0) }));
  };

  // Handle slip file selection
  const handleSlipFile = (file: File | null) => {
    if (!file) {
      setSlipFile(null);
      setSlipPreview(null);
      return;
    }
    if (!ALLOWED_SLIP_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP images allowed");
      return;
    }
    if (file.size > MAX_SLIP_BYTES) {
      toast.error("File too large (max 2MB)");
      return;
    }
    setSlipFile(file);
    // Generate a local preview URL — revoked when component unmounts
    const url = URL.createObjectURL(file);
    setSlipPreview(url);
  };

  // Cleanup preview blob URL when changed/unmounted
  useEffect(() => {
    return () => {
      if (slipPreview) URL.revokeObjectURL(slipPreview);
    };
  }, [slipPreview]);

  // Validation
  const errors: string[] = [];
  if (!customerName.trim()) errors.push("Name");
  if (!customerPhone.trim() || customerPhone.replace(/\D/g, "").length < 9) errors.push("Phone");
  if (!customerAddress.trim()) errors.push("Address");
  if (!customerCity.trim()) errors.push("City");
  if (cart.length === 0) errors.push("Products");
  // If bank transfer is chosen, the slip is required (otherwise the merchant
  // has nothing to verify against — they can still process the order, but
  // we want to keep the data flow clean).
  if (paymentMethod === "bank_transfer" && !slipFile) errors.push("Bank slip");
  if (TURNSTILE_SITE_KEY && !captchaToken) errors.push("Captcha");

  const canSubmit = errors.length === 0 && !submitting;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!business || cart.length === 0) return;
    if (!canSubmit) {
      toast.error(`Please complete: ${errors.join(", ")}`);
      return;
    }

    setSubmitting(true);

    const orderNumber = `WEB-${Date.now().toString(36).toUpperCase()}`;
    // For bank transfer with slip, set order to pending_verification immediately.
    // The merchant will see the slip in their existing slip-verification queue.
    const initialPaymentStatus =
      paymentMethod === "bank_transfer" && slipFile ? "pending_verification" : "unpaid";

    // Step 1: create the order
    const { data: orderRows, error: orderErr } = await supabase
      .from("orders")
      .insert({
        business_id: business.id,
        order_number: orderNumber,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        customer_city: customerCity.trim(),
        status: "pending",
        payment_method: paymentMethod,
        payment_status: initialPaymentStatus,
        subtotal,
        shipping_fee: 0,
        total,
        notes: notes.trim() || null,
        is_inquiry: true,
        inquiry_source: "public_form",
      })
      .select("id")
      .single();

    if (orderErr || !orderRows) {
      setSubmitting(false);
      setCaptchaToken(null);
      toast.error(orderErr?.message || "Could not place order");
      return;
    }

    const orderId = (orderRows as { id: string }).id;

    // Step 2: insert line items
    const itemsPayload = cart.map((c) => ({
      order_id: orderId,
      business_id: business.id,
      product_id: c.productId,
      product_name: c.name,
      quantity: c.quantity,
      unit_price: c.unitPrice,
      line_total: c.unitPrice * c.quantity,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
    if (itemsErr) {
      console.error("Items insert failed:", itemsErr);
    }

    // Step 3: if bank transfer, upload slip + create payment_slips row
    if (paymentMethod === "bank_transfer" && slipFile) {
      try {
        // Path format: {business_id}/inquiry-{order_id}-{timestamp}.{ext}
        // The 'inquiry-' prefix is required by storage RLS for anon uploads.
        const ext = slipFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = ALLOWED_SLIP_TYPES.includes(`image/${ext}`)
          ? ext
          : slipFile.type.split("/")[1] || "jpg";
        const path = `${business.id}/inquiry-${orderId}-${Date.now()}.${safeExt}`;

        const { error: uploadErr } = await supabase.storage
          .from("payment-slips")
          .upload(path, slipFile, {
            contentType: slipFile.type,
            upsert: false,
          });

        if (uploadErr) {
          throw uploadErr;
        }

        // Create payment_slips row pointing at the uploaded file
        const { error: slipRowErr } = await supabase.from("payment_slips").insert({
          order_id: orderId,
          business_id: business.id,
          image_path: path,
          mime_type: slipFile.type,
          slip_amount: total,
          status: "pending",
          notes: "Uploaded via public order form",
        });

        if (slipRowErr) {
          console.error("Slip row insert failed:", slipRowErr);
          // Slip uploaded but row failed — orphan file. Best-effort: try to delete
          // the storage object so we don't leave junk.
          // (Anon doesn't have delete permissions, so this will likely also fail —
          // but not catastrophic. Merchant can clean up via dashboard.)
          await supabase.storage.from("payment-slips").remove([path]);
          throw slipRowErr;
        }
      } catch (err) {
        // Slip upload failed but order was created. Best UX: tell user the order
        // was placed but slip didn't upload, and ask them to send slip directly.
        console.error("Slip flow failed:", err);
        toast.error(
          "Order placed but slip upload failed. The seller will contact you for payment.",
        );
        setSubmitting(false);
        setSubmitted(true);
        return;
      }
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  // ---- Render states ----------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Order form not available</h1>
          <p className="text-sm text-muted-foreground mt-2">
            This shop's order form is not currently available. Please contact the seller directly.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <div className="max-w-md text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold">Order received!</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Thank you, {customerName}. {business.business_name} will contact you shortly to confirm
            your order.
          </p>
          {paymentMethod === "bank_transfer" && slipFile && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-3 px-3 py-2 rounded-md bg-emerald-500/10">
              ✓ Your bank transfer slip was uploaded. The seller will verify the payment.
            </p>
          )}
          <div className="mt-6 rounded-lg border border-border bg-card p-4 text-left text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Your order
            </div>
            {cart.map((c) => (
              <div key={c.productId} className="flex justify-between py-0.5">
                <span>
                  {c.name} × {c.quantity}
                </span>
                <span className="tabular-nums">{formatLKR(c.unitPrice * c.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-border mt-2 pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span className="tabular-nums">{formatLKR(total)}</span>
            </div>
          </div>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setQuantities({});
              setCustomerName("");
              setCustomerPhone("");
              setCustomerAddress("");
              setCustomerCity("");
              setNotes("");
              setPaymentMethod("cod");
              setSlipFile(null);
              setSlipPreview(null);
              setCaptchaToken(null);
            }}
          >
            Place another order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Branded header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {business.logo_url ? (
            <BusinessLogo
              path={business.logo_url}
              alt={business.business_name}
              size="md"
              className="max-w-[180px]"
            />
          ) : (
            <>
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-lg leading-tight">{business.business_name}</div>
                {business.city && (
                  <div className="text-xs text-muted-foreground">{business.city}</div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <form onSubmit={onSubmit} className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Place an order</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in your details and {business.business_name} will contact you to confirm.
          </p>
        </div>

        {/* Products */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold mb-3">Select products</h2>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No products available right now.
            </p>
          ) : (
            <div className="space-y-2">
              {products.map((p) => {
                const qty = quantities[p.id] || 0;
                const outOfStock = p.stock <= 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-14 w-14 rounded-md object-cover bg-muted shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {p.description}
                        </div>
                      )}
                      <div className="text-sm font-semibold tabular-nums mt-0.5">
                        {formatLKR(Number(p.price))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => decQty(p.id)}
                        disabled={qty === 0}
                        className="h-8 w-8"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => incQty(p.id, p.stock)}
                        disabled={outOfStock || qty >= p.stock}
                        className="h-8 w-8"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {cart.length > 0 && (
            <div className="border-t border-border mt-4 pt-3 flex justify-between font-semibold">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatLKR(subtotal)}</span>
            </div>
          )}
        </section>

        {/* Customer details */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Your details</h2>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Phone *</Label>
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="07XXXXXXXX"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Address *</Label>
            <Textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="House #, street, area"
              rows={2}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>City *</Label>
            <Input
              value={customerCity}
              onChange={(e) => setCustomerCity(e.target.value)}
              placeholder="Colombo, Kandy, Galle..."
              required
            />
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Payment method</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={`rounded-lg border-2 p-3 text-sm font-medium text-left transition-colors ${
                paymentMethod === "cod"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div>Cash on delivery</div>
              <div className="text-xs text-muted-foreground mt-0.5">Pay when received</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("bank_transfer")}
              className={`rounded-lg border-2 p-3 text-sm font-medium text-left transition-colors ${
                paymentMethod === "bank_transfer"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div>Bank transfer</div>
              <div className="text-xs text-muted-foreground mt-0.5">Upload slip below</div>
            </button>
          </div>

          {/* Slip uploader — only when bank transfer is selected */}
          {paymentMethod === "bank_transfer" && (
            <div className="space-y-2 pt-2">
              <Label>Bank transfer slip *</Label>
              <p className="text-xs text-muted-foreground">
                Transfer the total ({formatLKR(total)}) to {business.business_name}'s bank account
                and upload your slip here. The seller will share account details if needed.
              </p>

              {slipPreview ? (
                <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
                  <img
                    src={slipPreview}
                    alt="Slip preview"
                    className="w-full max-h-64 object-contain bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => handleSlipFile(null)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    aria-label="Remove slip"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                  <div className="text-xs text-muted-foreground p-2 border-t border-border bg-card">
                    {slipFile?.name} • {slipFile ? Math.round(slipFile.size / 1024) : 0} KB
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => slipInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-border bg-muted/20 p-6 flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm font-medium">Tap to upload slip</div>
                  <div className="text-xs text-muted-foreground">JPG, PNG, or WEBP • Max 2MB</div>
                </button>
              )}
              <input
                ref={slipInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleSlipFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
          )}
        </section>

        {/* Notes */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions, delivery preferences..."
            rows={2}
          />
        </section>

        {/* Captcha */}
        {TURNSTILE_SITE_KEY && (
          <Captcha
            siteKey={TURNSTILE_SITE_KEY}
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
          />
        )}

        {/* Submit */}
        <div className="sticky bottom-0 -mx-4 px-4 py-4 bg-background border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold tabular-nums">{formatLKR(total)}</span>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={!canSubmit}>
            {submitting ? "Placing order..." : "Place order"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-2">Powered by Ordera</p>
        </div>
      </form>
    </div>
  );
}