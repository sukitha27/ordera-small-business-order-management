import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { Plus, Minus, ShoppingBag, CheckCircle2, AlertTriangle } from "lucide-react";
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

/**
 * Public order form. No authentication required. Customers fill out the
 * form and submit; submission becomes an "inquiry" in the merchant's inbox.
 *
 * The customer-facing flow is intentionally simple: find merchant by slug,
 * pick products + quantities, fill contact details, submit. No account
 * creation, no order tracking, no login.
 */
function PublicOrderFormPage() {
  const { slug } = useParams({ from: "/order/$slug" });

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);

  // Cart state — keyed by product id, value is quantity
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank">("cod");

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch business + products on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Step 1: fetch the business by slug. RLS restricts this to businesses
      // with public_form_enabled=true, so a 0-row response means either the
      // slug doesn't exist OR the merchant has disabled their form.
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

      // Step 2: fetch active products for this business. RLS only allows
      // anon to see active products of public-form-enabled businesses.
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
  // No shipping fee shown on customer form — merchant decides on confirmation
  const total = subtotal;

  const incQty = (pid: string, max: number) => {
    setQuantities((q) => ({ ...q, [pid]: Math.min((q[pid] || 0) + 1, max > 0 ? max : 999) }));
  };
  const decQty = (pid: string) => {
    setQuantities((q) => ({ ...q, [pid]: Math.max((q[pid] || 0) - 1, 0) }));
  };

  // Form validation
  const errors: string[] = [];
  if (!customerName.trim()) errors.push("Name");
  if (!customerPhone.trim() || customerPhone.replace(/\D/g, "").length < 9) errors.push("Phone");
  if (!customerAddress.trim()) errors.push("Address");
  if (!customerCity.trim()) errors.push("City");
  if (cart.length === 0) errors.push("Products");
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

    // Generate the order_number client-side. It's not security-sensitive;
    // collisions with merchant's own numbering are fine since this prefix
    // marks it as web-submitted.
    const orderNumber = `WEB-${Date.now().toString(36).toUpperCase()}`;

    // Step 1: create the order row marked as inquiry
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
        payment_status: "unpaid",
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
      // Captcha tokens are single-use; clear so a retry can re-verify
      setCaptchaToken(null);
      toast.error(orderErr?.message || "Could not place order");
      return;
    }

    const orderId = (orderRows as { id: string }).id;

    // Step 2: insert the line items
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
      // Items failed but order created — log it. Merchant will still see
      // the order, just without line items. Better than rolling back here
      // since RLS on orders.delete for anon doesn't exist (intentionally).
      console.error("Items insert failed:", itemsErr);
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
              // Reset and let them place another order
              setSubmitted(false);
              setQuantities({});
              setCustomerName("");
              setCustomerPhone("");
              setCustomerAddress("");
              setCustomerCity("");
              setNotes("");
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
      {/* Top header — minimal, branded */}
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
              onClick={() => setPaymentMethod("bank")}
              className={`rounded-lg border-2 p-3 text-sm font-medium text-left transition-colors ${
                paymentMethod === "bank"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div>Bank transfer</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Seller will share details
              </div>
            </button>
          </div>
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
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Powered by Ordera
          </p>
        </div>
      </form>
    </div>
  );
}