import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Package, Truck, CreditCard, BarChart3, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { user, t, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" />;

  const features = [
    { icon: Package, title: t("landingFeat1Title"), desc: t("landingFeat1Desc") },
    { icon: CreditCard, title: t("landingFeat2Title"), desc: t("landingFeat2Desc") },
    { icon: Truck, title: t("landingFeat3Title"), desc: t("landingFeat3Desc") },
    { icon: BarChart3, title: t("landingFeat4Title"), desc: t("landingFeat4Desc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-30 bg-background/80">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            />
            <span className="text-xl font-bold tracking-tight">Ordera</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">{t("signIn")}</Button>
            </Link>
            <Link to="/signup">
              <Button>{t("getStarted")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {t("pricing")}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            {t("tagline")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("heroDesc")}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                {t("getStarted")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                {t("signIn")}
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-20 mx-auto max-w-5xl"
        >
          <div
            className="rounded-2xl p-1"
            style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
          >
            <div className="rounded-xl bg-card overflow-hidden border border-border">
              <div className="grid md:grid-cols-3 gap-px bg-border">
                {[
                  { label: t("revenue"), value: "Rs. 2,84,500", sub: "+12% " + t("monthRevenue") },
                  { label: t("totalOrders"), value: "184", sub: "23 " + t("pending") },
                  { label: t("delivered"), value: "142", sub: "77% rate" },
                ].map((s) => (
                  <div key={s.label} className="bg-card p-6 text-left">
                    <div className="text-xs uppercase text-muted-foreground tracking-wider">
                      {s.label}
                    </div>
                    <div className="text-3xl font-bold mt-2">{s.value}</div>
                    <div className="text-xs text-success mt-1">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-8 hover:shadow-md transition-shadow"
            >
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "var(--gradient-primary)" }}
              >
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Sri Lanka</h2>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 max-w-2xl mx-auto">
          {["LKR pricing", "Sinhala UI", "COD tracking", "Pronto", "Domex", "Koombiyo", "Bank slip"].map(
            (chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
              >
                <Check className="h-3.5 w-3.5 text-success" /> {chip}
              </span>
            ),
          )}
        </div>
        <div className="mt-12">
          <Link to="/signup">
            <Button size="lg" className="gap-2">
              {t("getStarted")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded" style={{ background: "var(--gradient-primary)" }} />
            <span className="font-semibold text-foreground">Ordera</span>
          </div>
          <p>{t("footerLine")}</p>
        </div>
      </footer>
    </div>
  );
}
