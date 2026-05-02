import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  ShoppingBag,
  TrendingUp,
  ImageIcon,
  X as XIcon,
} from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatLKR } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/products/$productId")({
  component: ProductDetailPage,
});

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const LOW_STOCK_THRESHOLD = 5;

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const { t, business } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Product query ──────────────────────────────────────────────────────────
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // ── Order history for this product ─────────────────────────────────────────
  const { data: orderItems = [] } = useQuery({
    queryKey: ["product-orders", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select(`
          id,
          quantity,
          unit_price,
          line_total,
          order_id,
          orders (
            id,
            order_number,
            customer_name,
            status,
            created_at
          )
        `)
        .eq("product_id", productId)
        .order("created_at", { referencedTable: "orders", ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const totalUnitsSold = orderItems.reduce((s, i) => s + (i.quantity || 0), 0);
  const totalRevenue = orderItems.reduce((s, i) => s + Number(i.line_total || 0), 0);

  // ── Edit form state ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: 0,
    stock: 0,
    image_url: null as string | null,
  });

  const openEdit = () => {
    if (!product) return;
    setForm({
      name: product.name,
      sku: product.sku ?? "",
      description: product.description ?? "",
      price: Number(product.price),
      stock: product.stock,
      image_url: product.image_url ?? null,
    });
    setImageFile(null);
    setImagePreview(product.image_url ?? null);
    setEditOpen(true);
  };

  // ── Image helpers ──────────────────────────────────────────────────────────
  const handleImageFile = (file: File | null) => {
    if (!file) { setImageFile(null); setImagePreview(null); return; }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast.error("JPG, PNG or WEBP only"); return; }
    if (file.size > MAX_IMAGE_BYTES) { toast.error("Max 2MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((f) => ({ ...f, image_url: null }));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !business) return null;
    const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${business.id}/product-${productId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("business-assets")
      .upload(path, imageFile, { contentType: imageFile.type, upsert: true });
    if (error) { toast.error("Image upload failed"); return null; }
    const { data } = supabase.storage.from("business-assets").getPublicUrl(path);
    return data?.publicUrl ?? null;
  };

  const deleteOldImage = async (url: string | null | undefined) => {
    if (!url) return;
    const marker = "business-assets/";
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    await supabase.storage.from("business-assets").remove([url.slice(idx + marker.length)]);
  };

  // ── Save edit ──────────────────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: async () => {
      setImageUploading(true);
      let finalImageUrl = form.image_url;
      if (imageFile) {
        if (product?.image_url) await deleteOldImage(product.image_url);
        finalImageUrl = await uploadImage();
      } else if (form.image_url === null && product?.image_url) {
        await deleteOldImage(product.image_url);
      }
      const { error } = await supabase
        .from("products")
        .update({
          name: form.name,
          sku: form.sku || null,
          description: form.description || null,
          price: form.price,
          stock: form.stock,
          image_url: finalImageUrl,
        })
        .eq("id", productId);
      setImageUploading(false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("saved"));
      setEditOpen(false);
      setImageFile(null);
      setImagePreview(null);
      qc.invalidateQueries({ queryKey: ["product", productId] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => { setImageUploading(false); toast.error(e.message); },
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  const del = useMutation({
    mutationFn: async () => {
      if (product?.image_url) await deleteOldImage(product.image_url);
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("deleted"));
      navigate({ to: "/products" });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6 lg:p-10 max-w-4xl">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/products"><Button variant="outline" className="mt-4">← Back to products</Button></Link>
      </div>
    );
  }

  const isOutOfStock = product.stock !== null && product.stock <= 0;
  const isLowStock = product.stock !== null && product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-4xl">
      {/* Back */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="grid md:grid-cols-5 gap-6">
        {/* ── Left: image + actions ── */}
        <div className="md:col-span-2 space-y-4">
          {/* Product image */}
          <div className="rounded-xl border border-border bg-card overflow-hidden aspect-square max-h-72 sm:max-h-none flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-12 w-12 opacity-30" />
                <span className="text-sm">No image</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={openEdit}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Stock status */}
          {(isOutOfStock || isLowStock) && (
            <div className={`rounded-lg px-3 py-2 text-sm font-medium text-center ${
              isOutOfStock
                ? "bg-destructive/10 text-destructive border border-destructive/30"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
            }`}>
              {isOutOfStock ? "⚠ Out of stock" : `⚠ Low stock — only ${product.stock} left`}
            </div>
          )}
        </div>

        {/* ── Right: details + stats ── */}
        <div className="md:col-span-3 space-y-6">
          {/* Product info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
            {product.sku && (
              <div className="text-xs font-mono text-muted-foreground mb-3">
                SKU: {product.sku}
              </div>
            )}
            {product.description && (
              <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Price</div>
                <div className="text-2xl font-bold">{formatLKR(product.price)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Stock</div>
                <div className={`text-2xl font-bold ${
                  isOutOfStock ? "text-destructive" : isLowStock ? "text-amber-600 dark:text-amber-400" : ""
                }`}>
                  {product.stock} units
                </div>
              </div>
            </div>
          </div>

          {/* Sales stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: ShoppingBag, label: "Orders", value: orderItems.length },
              { icon: Package, label: "Units sold", value: totalUnitsSold },
              { icon: TrendingUp, label: "Revenue", value: formatLKR(totalRevenue) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
                <s.icon className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
                <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                <div className="font-bold text-sm">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Order history */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-sm font-medium">
              Order history
            </div>
            {orderItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No orders for this product yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2">Order</th>
                      <th className="text-left px-4 py-2">Customer</th>
                      <th className="text-right px-4 py-2">Qty</th>
                      <th className="text-right px-4 py-2">Total</th>
                      <th className="text-left px-4 py-2 hidden sm:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item: any) => (
                      <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-2">
                          <Link
                            to="/orders/$orderId"
                            params={{ orderId: item.order_id }}
                            className="font-medium text-primary hover:underline"
                          >
                            {item.orders?.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {item.orders?.customer_name}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-medium">
                          {formatLKR(item.line_total)}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground text-xs hidden sm:table-cell">
                          {item.orders?.created_at
                            ? format(new Date(item.orders.created_at), "MMM d, yyyy")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit dialog ── */}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) { setImageFile(null); setImagePreview(null); } setEditOpen(o); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image */}
            <div className="space-y-2">
              <Label>Product image</Label>
              {imagePreview ? (
                <div className="relative rounded-lg border border-border overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-contain bg-muted" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-border bg-muted/20 p-5 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors"
                >
                  <ImageIcon className="h-7 w-7 text-muted-foreground/50" />
                  <div className="text-sm text-muted-foreground">Click to upload</div>
                  <div className="text-xs text-muted-foreground/60">JPG, PNG, WEBP · Max 2MB</div>
                </button>
              )}
              <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageFile(e.target.files?.[0] || null)} className="hidden" />
            </div>
            <div className="space-y-2">
              <Label>{t("name")} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("sku")}</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("price")} (LKR)</Label>
                <Input type="number" step="0.01" min="0" value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>{t("stock")}</Label>
                <Input type="number" min="0" value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("description")}</Label>
              <Textarea value={form.description} rows={3}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("cancel")}</Button>
            <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending || imageUploading}>
              {save.isPending || imageUploading ? "Saving..." : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product, its image, and remove it from all future order forms. Existing orders are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => del.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}