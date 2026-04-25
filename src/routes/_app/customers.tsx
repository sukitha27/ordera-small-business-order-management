import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { PageHeader } from "@/components/app/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/customers")({
  component: CustomersPage,
});

interface CForm {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
}

const empty: CForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
};

function CustomersPage() {
  const { t, business } = useAuth();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CForm>(empty);

  const matchRoute = useMatchRoute();

  const isDetailPage = matchRoute({
    to: "/customers/$customerId",
    fuzzy: true,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (c: CForm) => {
      if (!business) throw new Error("No business found");

      const payload = {
        name: c.name,
        phone: c.phone || null,
        email: c.email || null,
        address: c.address || null,
        city: c.city || null,
        notes: c.notes || null,
      };

      if (c.id) {
        const { error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", c.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customers")
          .insert({
            ...payload,
            business_id: business.id,
          });

        if (error) throw error;
      }
    },

    onSuccess: () => {
      toast.success(t("saved"));
      setOpen(false);
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["customers"] });
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success(t("deleted"));
      qc.invalidateQueries({ queryKey: ["customers"] });
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  if (isDetailPage) {
    return <Outlet />;
  }

  return (
    <div className="container mx-auto p-6 lg:p-10 max-w-7xl">
      <PageHeader
        title={t("customers")}
        action={
          <Button
            onClick={() => {
              setForm(empty);
              setOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("newCustomer")}
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {t("noCustomers")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("name")}</th>
                  <th className="px-4 py-3">{t("phone")}</th>
                  <th className="px-4 py-3">{t("city")}</th>
                  <th className="px-4 py-3">{t("address")}</th>
                  <th className="px-4 py-3 text-right">{t("actions")}</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-border hover:bg-muted/30 group"
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: c.id }}
                        className="hover:text-primary inline-flex items-center gap-1.5"
                      >
                        {c.name}
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>

                    <td className="px-4 py-3">{c.phone || "—"}</td>
                    <td className="px-4 py-3">{c.city || "—"}</td>

                    <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">
                      {c.address || "—"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("edit")}
                          onClick={() => {
                            setForm({
                              id: c.id,
                              name: c.name,
                              phone: c.phone ?? "",
                              email: c.email ?? "",
                              address: c.address ?? "",
                              city: c.city ?? "",
                              notes: c.notes ?? "",
                            });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("delete")}
                          onClick={() => {
                            if (window.confirm(t("confirmDeleteCustomer"))) {
                              del.mutate(c.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? t("editCustomer") : t("newCustomer")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("name")}</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("phone")}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <Input
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("address")}</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("city")}</Label>
              <Input
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>

            <Button
              onClick={() => upsert.mutate(form)}
              disabled={!form.name || upsert.isPending}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}