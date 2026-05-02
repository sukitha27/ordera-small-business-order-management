import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  X as XIcon,
  AlertTriangle,
  Package,
  ExternalLink,
  ChevronRight,
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
import { PageHeader } from "@/components/app/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/products/")({
  component: ProductsPage,
});

const LOW_STOCK_THRESHOLD = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProductForm {
  id?: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string | null;
}

const empty: ProductForm = { name: "", sku: "", description: "", price: 0, stock: 0, image_url: null };

function ProductsPage() {
  const { t, business } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Slide-out panel state
  const [panelProduct, setPanelProduct] = useState<any | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const lowStockProducts = products.filter((p) => p.stock !== null && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
  const outOfStockProducts = products.filter((p) => p.stock !== null && p.stock <= 0);

  const handleImageFile = (file: File | null) => {
    if (!file) { setImageFile(null); setImagePreview(null); return; }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast.error("Only JPG, PNG, or WEBP allowed"); return; }
    if (file.size > MAX_IMAGE_BYTES) { toast.error("Image too large (max 2MB)"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((f) => ({ ...f, image_url: null }));
  };

  const uploadImage = async (productId: string): Promise<string | null> => {
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

  const deleteOldImage = async (imageUrl: string | null | undefined) => {
    if (!imageUrl) return;
    const marker = "business-assets/";
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return;
    await supabase.storage.from("business-assets").remove([imageUrl.slice(idx + marker.length)]);
  };

  const upsert = useMutation({
    mutationFn: async (p: ProductForm) => {
      if (!business) throw new Error("No business");
      setImageUploading(true);
      let finalImageUrl = p.image_url ?? null;

      if (p.id) {
        if (imageFile) {
          const existing = products.find((x) => x.id === p.id);
          if (existing?.image_url) await deleteOldImage(existing.image_url);
          finalImageUrl = await uploadImage(p.id);
        } else if (p.image_url === null) {
          const existing = products.find((x) => x.id === p.id);
          if (existing?.image_url) await deleteOldImage(existing.image_url);
        }
        const { error } = await supabase.from("products").update({
          name: p.name, sku: p.sku || null, description: p.description || null,
          price: p.price, stock: p.stock, image_url: finalImageUrl,
        }).eq("id", p.id);
        if (error) throw error;
      } else {
        const { data: newProd, error: insertErr } = await supabase.from("products").insert({
          business_id: business.id, name: p.name, sku: p.sku || null,
          description: p.description || null, price: p.price, stock: p.stock, image_url: null,
        }).select("id").single();
        if (insertErr) throw insertErr;
        if (imageFile) {
          finalImageUrl = await uploadImage(newProd.id);
          if (finalImageUrl) {
            await supabase.from("products").update({ image_url: finalImageUrl }).eq("id", newProd.id);
          }
        }
      }
      setImageUploading(false);
    },
    onSuccess: () => {
      toast.success(t("saved"));
      setOpen(false);
      setForm(empty);
      setImageFile(null);
      setImagePreview(null);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => { setImageUploading(false); toast.error(e.message); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const product = products.find((p) => p.id === id);
      if (product?.image_url) await deleteOldImage(product.image_url);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("deleted"));
      setDeleteId(null);
      setPanelProduct(null);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (p: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setForm({ id: p.id, name: p.name, sku: p.sku ?? "", description: p.description ?? "",
      price: Number(p.price), stock: p.stock, image_url: p.image_url ?? null });
    setImageFile(null);
    setImagePreview(p.image_url ?? null);
    setOpen(true);
  };

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-7xl">
      <PageHeader
        title={t("products")}
        action={
          <Button onClick={() => { setForm(empty); setImageFile(null); setImagePreview(null); setOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> {t("newProduct")}
          </Button>
        }
      />

      {/* Stock alerts */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="mb-6 space-y-3">
          {outOfStockProducts.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3">
              <Package className="h-5 w-5 text-destructive shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-destructive">
                  {outOfStockProducts.length} product{outOfStockProducts.length > 1 ? "s" : ""} out of stock:{" "}
                </span>
                <span className="text-muted-foreground">
                  {outOfStockProducts.slice(0, 3).map((p) => p.name).join(", ")}
                  {outOfStockProducts.length > 3 && ` +${outOfStockProducts.length - 3} more`}
                </span>
              </div>
            </div>
          )}
          {lowStockProducts.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {lowStockProducts.length} product{lowStockProducts.length > 1 ? "s" : ""} running low:{" "}
                </span>
                <span className="text-muted-foreground">
                  {lowStockProducts.slice(0, 3).map((p) => `${p.name} (${p.stock})`).join(", ")}
                  {lowStockProducts.length > 3 && ` +${lowStockProducts.length - 3} more`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        {/* Products table */}
        <div className={`rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 ${panelProduct ? "flex-1" : "w-full"}`}>
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">{t("noProducts")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 w-14">Image</th>
                    <th className="px-4 py-3">{t("name")}</th>
                    {!panelProduct && <th className="px-4 py-3">{t("sku")}</th>}
                    <th className="px-4 py-3 text-right">{t("price")}</th>
                    <th className="px-4 py-3 text-right">{t("stock")}</th>
                    <th className="px-4 py-3 text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isOut = p.stock !== null && p.stock <= 0;
                    const isLow = p.stock !== null && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD;
                    const isSelected = panelProduct?.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={`border-t border-border cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"
                        } ${isOut ? "opacity-60" : ""}`}
                        onClick={() => setPanelProduct(isSelected ? null : p)}
                      >
                        <td className="px-4 py-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name}
                              className="h-10 w-10 rounded-lg object-contain bg-muted p-0.5" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            {p.name}
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                          </div>
                        </td>
                        {!panelProduct && (
                          <td className="px-4 py-3 text-muted-foreground">{p.sku || "—"}</td>
                        )}
                        <td className="px-4 py-3 text-right font-medium">{formatLKR(p.price)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={isOut ? "text-destructive font-semibold" : isLow ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                            {isOut && "⚠ "}{p.stock}{isLow && " ⚠"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={(e) => openEdit(p, e)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick view slide-out panel */}
        {panelProduct && (
          <div className="w-72 shrink-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium">Quick view</span>
              <button onClick={() => setPanelProduct(null)} className="text-muted-foreground hover:text-foreground">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Product image */}
            <div className="aspect-square bg-muted/30 flex items-center justify-center p-4">
              {panelProduct.image_url ? (
                <img src={panelProduct.image_url} alt={panelProduct.name}
                  className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-10 w-10 opacity-25" />
                  <span className="text-xs">No image</span>
                </div>
              )}
            </div>

            {/* Product details */}
            <div className="p-4 flex-1 space-y-3">
              <div>
                <h3 className="font-semibold">{panelProduct.name}</h3>
                {panelProduct.sku && (
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {panelProduct.sku}</div>
                )}
              </div>

              {panelProduct.description && (
                <p className="text-xs text-muted-foreground line-clamp-3">{panelProduct.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/40 p-2 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Price</div>
                  <div className="font-bold text-sm">{formatLKR(panelProduct.price)}</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Stock</div>
                  <div className={`font-bold text-sm ${
                    panelProduct.stock <= 0 ? "text-destructive" :
                    panelProduct.stock <= LOW_STOCK_THRESHOLD ? "text-amber-600 dark:text-amber-400" : ""
                  }`}>
                    {panelProduct.stock}
                  </div>
                </div>
              </div>

              {panelProduct.stock <= LOW_STOCK_THRESHOLD && (
                <div className={`text-xs text-center rounded-lg px-2 py-1.5 font-medium ${
                  panelProduct.stock <= 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}>
                  {panelProduct.stock <= 0 ? "⚠ Out of stock" : `⚠ Only ${panelProduct.stock} left`}
                </div>
              )}
            </div>

            {/* Panel actions */}
            <div className="p-4 border-t border-border space-y-2">
              <Link to="/products/$productId" params={{ productId: panelProduct.id }} className="block">
                <Button variant="outline" className="w-full gap-2 text-sm">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View full details
                </Button>
              </Link>
              <Button className="w-full gap-2 text-sm" onClick={() => openEdit(panelProduct)}>
                <Pencil className="h-3.5 w-3.5" /> Edit product
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setImageFile(null); setImagePreview(null); } setOpen(o); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? t("edit") : t("newProduct")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product image (optional)</Label>
              {imagePreview ? (
                <div className="relative rounded-lg border border-border overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-contain bg-muted" />
                  <button type="button" onClick={removeImage}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-border bg-muted/20 p-5 flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-muted/30 transition-colors">
                  <ImageIcon className="h-7 w-7 text-muted-foreground/50" />
                  <div className="text-sm font-medium text-muted-foreground">Click to upload image</div>
                  <div className="text-xs text-muted-foreground/60">JPG, PNG, WEBP · Max 2MB</div>
                </button>
              )}
              <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageFile(e.target.files?.[0] || null)} className="hidden" />
            </div>
            <div className="space-y-2">
              <Label>{t("name")} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
            </div>
            <div className="space-y-2">
              <Label>{t("sku")}</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" />
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
              <Textarea value={form.description} rows={3} placeholder="Optional description"
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={() => upsert.mutate(form)} disabled={!form.name || upsert.isPending || imageUploading}>
              {upsert.isPending || imageUploading ? "Saving..." : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the product and its image.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && del.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}