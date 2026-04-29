import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Phone, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  COURIERS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  formatLKR,
} from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/app/PageHeader";
import { toast } from "sonner";
import { buildOrderMessage, buildWhatsAppLink, whatsappButtonLabel } from "@/lib/whatsapp";
import { SlipUploadPanel } from "@/components/app/SlipUploadPanel";

interface Item {
  id?: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface OrderState {
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  status: (typeof ORDER_STATUSES)[number];
  payment_method: (typeof PAYMENT_METHODS)[number];
  payment_status: (typeof PAYMENT_STATUSES)[number];
  courier: string;
  waybill_number: string;
  shipping_fee: number;
  notes: string;
}

const emptyOrder: OrderState = {
  order_number: "",
  customer_id: null,
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  customer_city: "",
  status: "pending",
  payment_method: "cod",
  payment_status: "unpaid",
  courier: "",
  waybill_number: "",
  shipping_fee: 0,
  notes: "",
};

// Strip everything except digits, then drop a leading 94 or 0 so
// '+94 77 123-4567', '0771234567', and '94771234567' all normalize to '771234567'.
function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("94")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

interface CustomerMatch {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  order_count?: number;
}

export function OrderForm({
  existing,
  onDone,
}: {
  existing?: { order: any; items: any[] };
  onDone: () => void;
}) {
  const { t, business } = useAuth();
  const qc = useQueryClient();
  const [order, setOrder] = useState<OrderState>(emptyOrder);
  const [items, setItems] = useState<Item[]>([]);

  // Phone autocomplete state
  const [phoneQuery, setPhoneQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const phoneWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existing) {
      setOrder({
        order_number: existing.order.order_number,
        customer_id: existing.order.customer_id ?? null,
        customer_name: existing.order.customer_name,
        customer_phone: existing.order.customer_phone ?? "",
        customer_address: existing.order.customer_address ?? "",
        customer_city: existing.order.customer_city ?? "",
        status: existing.order.status,
        payment_method: existing.order.payment_method,
        payment_status: existing.order.payment_status,
        courier: existing.order.courier ?? "",
        waybill_number: existing.order.waybill_number ?? "",
        shipping_fee: Number(existing.order.shipping_fee) || 0,
        notes: existing.order.notes ?? "",
      });
      setItems(
        existing.items.map((i) => ({
          id: i.id,
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          unit_price: Number(i.unit_price),
        })),
      );
    } else {
      setOrder({ ...emptyOrder, order_number: `ORD-${Date.now().toString().slice(-6)}` });
    }
  }, [existing]);

  // Close suggestions when clicking outside the phone area
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!phoneWrapperRef.current) return;
      if (!phoneWrapperRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounce phone typing -> only query after 250ms of no typing
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(phoneQuery), 250);
    return () => clearTimeout(id);
  }, [phoneQuery]);

  const { data: products = [] } = useQuery({
    queryKey: ["products", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true);
      return data ?? [];
    },
  });

  // Customer phone suggestions
  const { data: suggestions = [] } = useQuery<CustomerMatch[]>({
    queryKey: ["customer-phone-lookup", business?.id, debouncedQuery],
    enabled: !!business?.id && debouncedQuery.replace(/\D/g, "").length >= 3,
    queryFn: async () => {
      const raw = debouncedQuery.trim();
      const normalized = normalizePhone(raw);

      const filters = [
        `phone.ilike.%${raw}%`,
        `phone.ilike.%${normalized}%`,
        `name.ilike.%${raw}%`,
      ].join(",");

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, address, city")
        .or(filters)
        .limit(6);

      if (error) return [];
      const seen = new Set<string>();
      const unique: CustomerMatch[] = [];
      for (const c of data ?? []) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        unique.push(c as CustomerMatch);
      }
      return unique.slice(0, 5);
    },
    staleTime: 30_000,
  });

  const showSuggestions =
    suggestionsOpen && suggestions.length > 0 && !order.customer_id;

  const selectCustomer = (c: CustomerMatch) => {
    setOrder((o) => ({
      ...o,
      customer_id: c.id,
      customer_name: c.name || o.customer_name,
      customer_phone: c.phone || o.customer_phone,
      customer_address: c.address || o.customer_address,
      customer_city: c.city || o.customer_city,
    }));
    setPhoneQuery(c.phone || "");
    setSuggestionsOpen(false);
  };

  const clearLinkedCustomer = () => {
    setOrder((o) => ({ ...o, customer_id: null }));
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectCustomer(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false);
    }
  };

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    [items],
  );
  const total = subtotal + Number(order.shipping_fee || 0);

  const addItem = () => {
    setItems([...items, { product_id: null, product_name: "", quantity: 1, unit_price: 0 }]);
  };

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems((it) => it.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  };

  const removeItem = (idx: number) => setItems((it) => it.filter((_, i) => i !== idx));

  const whatsappLink = (() => {
    if (!existing || !business || !order.customer_phone || items.length === 0) return null;
    const message = buildOrderMessage({
      order: {
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        customer_city: order.customer_city,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        subtotal,
        shipping_fee: order.shipping_fee,
        total,
        courier: order.courier || null,
        waybill_number: order.waybill_number || null,
      },
      business: {
        business_name: business.business_name,
        phone: business.phone,
      },
      items: items.map((i) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      lang: business.language,
    });
    return buildWhatsAppLink(order.customer_phone, message);
  })();

  const whatsappLabel = existing
    ? whatsappButtonLabel(
        {
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
          customer_city: order.customer_city,
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          subtotal,
          shipping_fee: order.shipping_fee,
          total,
          courier: order.courier || null,
          waybill_number: order.waybill_number || null,
        },
        business?.language ?? "en",
      )
    : "";

  const save = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error("No business");
      if (!order.customer_name) throw new Error("Customer name required");
      if (items.length === 0) throw new Error("Add at least one item");

      // ── Plan limit check (new orders only, not edits) ──────────────────
      // We check server-side via can_create_order() so the limit can't be
      // bypassed by a user who had the form open before hitting the limit.
      if (!existing) {
        const { data: limitData, error: limitErr } = await supabase.rpc(
          "can_create_order",
          { business_uuid: business.id },
        );
        if (limitErr) throw limitErr;
        const limitCheck = limitData as unknown as { allowed: boolean; used: number; limit: number };
        if (!limitCheck.allowed) {
          throw new Error(
            `Monthly order limit reached (${limitCheck.used}/${limitCheck.limit}). Please upgrade your plan to continue creating orders.`,
          );
        }
      }
      // ──────────────────────────────────────────────────────────────────

      // Resolve / upsert the customer
      let resolvedCustomerId: string | null = order.customer_id;
      const phoneDigits = normalizePhone(order.customer_phone);

      if (!resolvedCustomerId && phoneDigits.length >= 7) {
        const { data: existingMatches } = await supabase
          .from("customers")
          .select("id, phone")
          .eq("business_id", business.id);

        const matched = (existingMatches ?? []).find(
          (c) => c.phone && normalizePhone(c.phone) === phoneDigits,
        );

        if (matched) {
          resolvedCustomerId = matched.id;
          await supabase
            .from("customers")
            .update({
              name: order.customer_name,
              address: order.customer_address || null,
              city: order.customer_city || null,
            })
            .eq("id", matched.id);
        } else {
          const { data: created, error: cErr } = await supabase
            .from("customers")
            .insert({
              business_id: business.id,
              name: order.customer_name,
              phone: order.customer_phone || null,
              address: order.customer_address || null,
              city: order.customer_city || null,
            })
            .select("id")
            .single();
          if (cErr) throw cErr;
          resolvedCustomerId = created.id;
        }
      }

      const payload = {
        business_id: business.id,
        customer_id: resolvedCustomerId,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone || null,
        customer_address: order.customer_address || null,
        customer_city: order.customer_city || null,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        courier: order.courier || null,
        waybill_number: order.waybill_number || null,
        shipping_fee: order.shipping_fee,
        subtotal,
        total,
        notes: order.notes || null,
      };

      let orderId: string;
      if (existing) {
        orderId = existing.order.id;
        const { error } = await supabase.from("orders").update(payload).eq("id", orderId);
        if (error) throw error;
        await supabase.from("order_items").delete().eq("order_id", orderId);
      } else {
        const { data, error } = await supabase
          .from("orders")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        orderId = data.id;
      }

      const itemsPayload = items.map((i) => ({
        order_id: orderId,
        business_id: business.id,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.quantity * i.unit_price,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(itemsPayload);
      if (iErr) throw iErr;
    },
    onSuccess: () => {
      toast.success(t("saved"));
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["plan-limit-check"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-5xl">
      <PageHeader title={existing ? `${t("edit")} — ${order.order_number}` : t("newOrder")} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">{t("customer")}</h2>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("orderNumber")}</Label>
                  <Input
                    value={order.order_number}
                    onChange={(e) => setOrder({ ...order, order_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("name")}</Label>
                  <Input
                    value={order.customer_name}
                    onChange={(e) => setOrder({ ...order, customer_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {t("phone")}
                    {order.customer_id && (
                      <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Existing customer
                      </span>
                    )}
                  </Label>
                  <div ref={phoneWrapperRef} className="relative">
                    <Input
                      value={order.customer_phone}
                      placeholder="077..."
                      onChange={(e) => {
                        const v = e.target.value;
                        setOrder({ ...order, customer_phone: v });
                        setPhoneQuery(v);
                        setSuggestionsOpen(true);
                        setActiveSuggestion(0);
                        if (order.customer_id) clearLinkedCustomer();
                      }}
                      onFocus={() => {
                        if (order.customer_phone && !order.customer_id) {
                          setPhoneQuery(order.customer_phone);
                          setSuggestionsOpen(true);
                        }
                      }}
                      onKeyDown={handlePhoneKeyDown}
                      autoComplete="off"
                    />
                    {showSuggestions && (
                      <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/40">
                          Existing customers
                        </div>
                        {suggestions.map((c, idx) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectCustomer(c);
                            }}
                            onMouseEnter={() => setActiveSuggestion(idx)}
                            className={`w-full text-left px-3 py-2 flex items-start gap-2 border-b border-border last:border-0 transition-colors ${
                              idx === activeSuggestion ? "bg-accent" : "hover:bg-accent/50"
                            }`}
                          >
                            <Phone className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{c.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {c.phone}
                                {c.city ? ` · ${c.city}` : ""}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("city")}</Label>
                  <Input
                    value={order.customer_city}
                    onChange={(e) => setOrder({ ...order, customer_city: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("address")}</Label>
                <Textarea
                  rows={2}
                  value={order.customer_address}
                  onChange={(e) => setOrder({ ...order, customer_address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Items</h2>
              <Button size="sm" variant="outline" onClick={addItem} className="gap-2">
                <Plus className="h-3.5 w-3.5" /> {t("addItem")}
              </Button>
            </div>
            <div className="space-y-3">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No items added</p>
              )}
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-5">
                    {idx === 0 && <Label className="text-xs">{t("name")}</Label>}
                    <Select
                      value={it.product_id ?? "custom"}
                      onValueChange={(v) => {
                        if (v === "custom") {
                          updateItem(idx, { product_id: null });
                        } else {
                          const p = products.find((pp) => pp.id === v);
                          if (p)
                            updateItem(idx, {
                              product_id: p.id,
                              product_name: p.name,
                              unit_price: Number(p.price),
                            });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectProduct")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">— Custom —</SelectItem>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({formatLKR(p.price)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {it.product_id === null && (
                      <Input
                        className="mt-1"
                        placeholder="Item name"
                        value={it.product_name}
                        onChange={(e) => updateItem(idx, { product_name: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    {idx === 0 && <Label className="text-xs">{t("quantity")}</Label>}
                    <Input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) =>
                        updateItem(idx, { quantity: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    {idx === 0 && <Label className="text-xs">{t("unitPrice")}</Label>}
                    <Input
                      type="number"
                      step="0.01"
                      value={it.unit_price}
                      onChange={(e) =>
                        updateItem(idx, { unit_price: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1 text-right text-sm font-medium pb-2">
                    {formatLKR(it.quantity * it.unit_price)}
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <Label>{t("notes")}</Label>
            <Textarea
              className="mt-2"
              rows={3}
              value={order.notes}
              onChange={(e) => setOrder({ ...order, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold">
              {t("status")} & {t("payment")}
            </h2>
            <div className="space-y-2">
              <Label>{t("status")}</Label>
              <Select
                value={order.status}
                onValueChange={(v) => setOrder({ ...order, status: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(s as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("payment")}</Label>
              <Select
                value={order.payment_method}
                onValueChange={(v) => setOrder({ ...order, payment_method: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(s as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment status</Label>
              <Select
                value={order.payment_status}
                onValueChange={(v) => setOrder({ ...order, payment_status: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(s as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {existing && order.payment_method === "bank_transfer" && business && (
            <SlipUploadPanel
              orderId={existing.order.id}
              businessId={business.id}
              orderTotal={Number(total)}
            />
          )}

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Delivery</h2>
            <div className="space-y-2">
              <Label>{t("courier")}</Label>
              <Select
                value={order.courier || "none"}
                onValueChange={(v) =>
                  setOrder({ ...order, courier: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {COURIERS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("waybill")}</Label>
              <Input
                value={order.waybill_number}
                onChange={(e) => setOrder({ ...order, waybill_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("shipping")} (LKR)</Label>
              <Input
                type="number"
                step="0.01"
                value={order.shipping_fee}
                onChange={(e) =>
                  setOrder({ ...order, shipping_fee: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div
            className="rounded-xl p-6 text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <div className="flex justify-between text-sm opacity-90">
              <span>{t("subtotal")}</span>
              <span>{formatLKR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm opacity-90 mt-1">
              <span>{t("shipping")}</span>
              <span>{formatLKR(order.shipping_fee)}</span>
            </div>
            <div className="border-t border-white/20 my-3" />
            <div className="flex justify-between text-xl font-bold">
              <span>{t("total")}</span>
              <span>{formatLKR(total)}</span>
            </div>
          </div>

          {existing && whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
              >
                <MessageCircle className="h-4 w-4" /> {whatsappLabel}
              </Button>
            </a>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onDone}>
              {t("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={() => save.mutate()}
              disabled={save.isPending}
            >
              {t("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}