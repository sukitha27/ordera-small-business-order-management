import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  Inbox,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BusinessLogo } from "@/components/app/BusinessLogo";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { cn } from "@/lib/utils";
import { DeletionBanner } from "@/components/app/DeletionBanner";

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

  // Pending-inquiries count for the sidebar badge.
  // Lightweight HEAD query — only counts rows, doesn't pull data.
  const { data: pendingInquiriesCount = 0 } = useQuery({
    queryKey: ["sidebar-inquiries-count", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      // Only count NEEDS-REVIEW inquiries: is_inquiry=true AND not already cancelled.
      // Rejected inquiries (status='cancelled') stay as is_inquiry=true so they
      // appear in the Rejected tab, but they shouldn't bump the sidebar badge.
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("is_inquiry", true)
        .neq("status", "cancelled");
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const nav = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard"), badge: 0 },
    {
      to: "/inquiries",
      icon: Inbox,
      label: t("inquiries"),
      badge: pendingInquiriesCount,
    },
    { to: "/orders", icon: ShoppingBag, label: t("orders"), badge: 0 },
    { to: "/products", icon: Package, label: t("products"), badge: 0 },
    { to: "/customers", icon: Users, label: t("customers"), badge: 0 },
    { to: "/reports", icon: BarChart3, label: t("reports"), badge: 0 },
    { to: "/settings", icon: Settings, label: t("settings"), badge: 0 },
    ...(isAdmin ? [{ to: "/admin", icon: Shield, label: "Admin", badge: 0 }] : []),
  ] as const;

  const hasLogo = !!business?.logo_url;

  const Sidebar = (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header — show business logo if uploaded, else fall back to Ordera mark */}
      <Link to="/dashboard" className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border">
        {hasLogo ? (
          <BusinessLogo
            path={business?.logo_url}
            alt={business?.business_name}
            size="sm"
            className="max-w-45"
          />
        ) : (
          <>
            <div className="h-8 w-8 rounded-lg" style={{ background: "var(--gradient-primary)" }} />
            <span className="text-xl font-bold tracking-tight">Ordera</span>
          </>
        )}
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
          const showBadge = item.badge > 0;
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
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span
                  className={cn(
                    "min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                    // Use destructive (red) styling so unattended inquiries
                    // are visually impossible to ignore. Active nav uses
                    // a contrasting badge against the colored background.
                    active
                      ? "bg-sidebar text-sidebar-foreground"
                      : "bg-destructive text-destructive-foreground",
                  )}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* Theme toggle (light/dark/system) */}
        <ThemeToggle />

        {/* Language toggle */}
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
            {hasLogo ? (
              <BusinessLogo
                path={business?.logo_url}
                alt={business?.business_name}
                size="sm"
                className="max-w-35"
              />
            ) : (
              <>
                <div className="h-6 w-6 rounded" style={{ background: "var(--gradient-primary)" }} />
                <span className="font-bold">Ordera</span>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <DeletionBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}