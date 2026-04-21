import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
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

interface Item {
  id?: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface OrderState {
  order_number: string;
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

  useEffect(() => {
    if (existing) {
      setOrder({
        order_number: existing.order.order_number,
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

  const { data: products = [] } = useQuery({
    queryKey: ["products", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true);
      return data ?? [];
    },
  });

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = subtotal + Number(order.shipping_fee || 0);

  const addItem = () => {
    setItems([...items, { product_id: null, product_name: "", quantity: 1, unit_price: 0 }]);
  };

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems((it) => it.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  };

  const removeItem = (idx: number) => setItems((it) => it.filter((_, i) => i !== idx));

  const save = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error("No business");
      if (!order.customer_name) throw new Error("Customer name required");
      if (items.length === 0) throw new Error("Add at least one item");

      const payload = {
        business_id: business.id,
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
        const { data, error } = await supabase.from("orders").insert(payload).select("id").single();
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
                  <Label>{t("phone")}</Label>
                  <Input
                    value={order.customer_phone}
                    onChange={(e) => setOrder({ ...order, customer_phone: e.target.value })}
                  />
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
                      onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
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
            <h2 className="font-semibold">{t("status")} & {t("payment")}</h2>
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

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Delivery</h2>
            <div className="space-y-2">
              <Label>{t("courier")}</Label>
              <Select value={order.courier || "none"} onValueChange={(v) => setOrder({ ...order, courier: v === "none" ? "" : v })}>
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

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onDone}>
              {t("cancel")}
            </Button>
            <Button className="flex-1" onClick={() => save.mutate()} disabled={save.isPending}>
              {t("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}