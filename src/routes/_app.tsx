import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, business, loading, t, signOut, lang, setLang, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const nav = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/orders", icon: ShoppingBag, label: t("orders") },
    { to: "/products", icon: Package, label: t("products") },
    { to: "/customers", icon: Users, label: t("customers") },
    { to: "/reports", icon: BarChart3, label: t("reports") },
    { to: "/settings", icon: Settings, label: t("settings") },
    ...(isAdmin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
  ] as const;

  const Sidebar = (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <Link to="/dashboard" className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg" style={{ background: "var(--gradient-primary)" }} />
        <span className="text-xl font-bold tracking-tight">Ordera</span>
      </Link>
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="text-xs uppercase text-muted-foreground tracking-wider">
          {business?.business_name || "—"}
        </div>
        <div className="text-sm font-medium truncate">{business?.owner_name || user?.email}</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center rounded-lg bg-sidebar-accent p-1">
          {(["en", "si"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors",
                lang === l ? "bg-sidebar text-sidebar-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {l === "en" ? "English" : "සිංහල"}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" /> {t("signOut")}
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:block">{Sidebar}</div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative">{Sidebar}</div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 border-b border-border flex items-center px-4 gap-3 bg-card">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded" style={{ background: "var(--gradient-primary)" }} />
            <span className="font-bold">Ordera</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}