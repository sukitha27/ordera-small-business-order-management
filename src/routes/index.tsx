import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  CreditCard,
  BarChart3,
  ArrowRight,
  Check,
  Star,
  Users,
  Phone,
  TrendingUp,
  Play,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { PainPointCard } from "@/components/landing/PainPointCard";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { TestimonialCard } from "@/components/landing/TestimonialCard";
import { PricingCard } from "@/components/landing/PricingCard";
import { LandingThemeToggle } from "@/components/landing/LandingThemeToggle";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { user, t, loading, lang, setLang } = useAuth();
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect authenticated users to dashboard
  if (!loading && user) return <Navigate to="/dashboard" />;

  const painPoints = [
    {
      icon: CreditCard,
      title: t("pain1Title"),
      description: t("pain1Desc"),
      stat: "82%",
      statLabel: "Avg collection rate without system",
    },
    {
      icon: Truck,
      title: t("pain2Title"),
      description: t("pain2Desc"),
      stat: "3-4",
      statLabel: "Courier sites opened per dispatch",
    },
    {
      icon: MessageCircle,
      title: t("pain3Title"),
      description: t("pain3Desc"),
      stat: "2+ hrs",
      statLabel: "Daily time lost on status updates",
    },
  ];

  const features = [
    {
      icon: Package,
      title: t("feature1Title"),
      description: t("feature1Desc"),
      bullets: [t("feature1Bullet1"), t("feature1Bullet2"), t("feature1Bullet3")],
      visual: "pipeline",
    },
    {
      icon: CreditCard,
      title: t("feature2Title"),
      description: t("feature2Desc"),
      bullets: [t("feature2Bullet1"), t("feature2Bullet2"), t("feature2Bullet3")],
      visual: "payment",
    },
    {
      icon: Truck,
      title: t("feature3Title"),
      description: t("feature3Desc"),
      bullets: [t("feature3Bullet1"), t("feature3Bullet2"), t("feature3Bullet3")],
      visual: "courier",
    },
    {
      icon: BarChart3,
      title: t("feature4Title"),
      description: t("feature4Desc"),
      bullets: [t("feature4Bullet1"), t("feature4Bullet2"), t("feature4Bullet3")],
      visual: "dashboard",
    },
  ];

  const plans = [
    {
      name: t("starterPlan"),
      price: "1,490",
      period: "/month",
      ordersIncluded: t("ordersUpTo").replace("{count}", "200"),
      features: [
        "All core features",
        "1 courier integration",
        "Email support",
        "Sinhala & English UI",
        "Mobile responsive",
      ],
      cta: t("startTrial"),
      popular: false,
    },
    {
      name: t("growthPlan"),
      price: "3,490",
      period: "/month",
      ordersIncluded: t("ordersUpTo").replace("{count}", "1,000"),
      features: [
        "Everything in Starter",
        "3 courier integrations",
        "Priority chat support",
        "CSV import/export",
        "Multi-user access",
        "Custom status labels",
      ],
      cta: t("startTrial"),
      popular: true,
    },
    {
      name: t("businessPlan"),
      price: "7,490",
      period: "/month",
      ordersIncluded: "Unlimited orders",
      features: [
        "Everything in Growth",
        "All courier integrations",
        "API access",
        "Dedicated account manager",
        "Custom reports",
        "Priority onboarding",
      ],
      cta: t("contactSales"),
      popular: false,
    },
  ];

  const testimonials = [
    {
      quote: t("testimonial1Quote"),
      name: t("testimonial1Name"),
      role: t("testimonial1Role"),
    },
    {
      quote: t("testimonial2Quote"),
      name: t("testimonial2Name"),
      role: t("testimonial2Role"),
    },
    {
      quote: t("testimonial3Quote"),
      name: t("testimonial3Name"),
      role: t("testimonial3Role"),
    },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ==================== NAVIGATION ==================== */}
<header className="border-b border-border/60 backdrop-blur sticky top-0 z-30 bg-background/80">
  <div className="container mx-auto flex items-center justify-between px-4 md:px-6 py-3">
    {/* Logo */}
    <Link to="/" className="flex-shrink-0">
      <img
        src="/ordera-logo.svg"
        alt="Ordera"
        className="h-7 md:h-8 w-auto light-only"
      />
      <img
        src="/logo-lockup-inverse.svg"
        alt="Ordera"
        className="h-7 md:h-8 w-auto dark-only"
      />
    </Link>

    {/* Desktop Navigation */}
    <nav className="hidden lg:flex items-center gap-8">
      <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        {t("features")}
      </a>
      <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        {t("pricing")}
      </a>
      <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        Stories
      </a>
    </nav>

    {/* Desktop Controls */}
    <div className="hidden lg:flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
        <button
          onClick={() => setLang("en")}
          className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
            lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLang("si")}
          className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
            lang === "si" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          සිං
        </button>
      </div>
      <LandingThemeToggle />
      <Link to="/login">
        <Button variant="ghost" size="sm">{t("signIn")}</Button>
      </Link>
      <Link to="/signup">
        <Button size="sm">{t("getStarted")}</Button>
      </Link>
    </div>

    {/* Mobile Controls */}
    <div className="flex lg:hidden items-center gap-2">
      <LandingThemeToggle />
      <Link to="/signup">
        <Button size="sm" className="text-xs h-8 px-3">{t("getStarted")}</Button>
      </Link>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
    </div>
  </div>

  {/* Mobile Menu */}
  {isMobileMenuOpen && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="lg:hidden border-t border-border bg-card"
    >
      <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Nav Links */}
        <nav className="flex flex-col gap-1">
          <a
            href="#features"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            {t("features")}
          </a>
          <a
            href="#pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            {t("pricing")}
          </a>
          <a
            href="#testimonials"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Stories
          </a>
        </nav>

        <div className="h-px bg-border" />

        {/* Language + Auth */}
        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("si")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                lang === "si" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              සිං
            </button>
          </div>
          <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
            <Button variant="ghost" size="sm">{t("signIn")}</Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )}
</header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="container mx-auto px-6 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Column - Copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              {t("heroEyebrow")}
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              {t("heroHeadline")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              {t("heroSubheadline")}
            </p>

            {/* Trust Indicators */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-background bg-muted"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                  <span className="text-sm font-medium ml-1">4.9</span>
                </div>
                <p className="text-xs text-muted-foreground">from 50+ reviews</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  {t("startTrial")} — {t("noCardNeeded")}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <button
                onClick={() => setIsVideoOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Play className="h-4 w-4" /> {t("watchDemo")}
              </button>
            </div>
          </motion.div>

          {/* Right Column - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div
              className="rounded-2xl p-1"
              style={{
                background: "var(--gradient-hero)",
                boxShadow: "var(--shadow-elegant)",
              }}
            >
              <div className="rounded-xl bg-card overflow-hidden border border-border">
                {/* Mock Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-5 rounded bg-muted w-2/3 mx-auto" />
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-px bg-border">
                  {[
                    {
                      label: t("revenue"),
                      value: "Rs. 2,84,500",
                      sub: "+12% " + t("monthRevenue"),
                      color: "text-success",
                    },
                    {
                      label: t("totalOrders"),
                      value: "184",
                      sub: "23 " + t("pending"),
                      color: "text-warning",
                    },
                    {
                      label: t("delivered"),
                      value: "142",
                      sub: "77% rate",
                      color: "text-primary",
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card p-4">
                      <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">
                        {stat.label}
                      </div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className={`text-xs mt-1 ${stat.color}`}>{stat.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Pipeline Visualization */}
                <div className="p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                    Order Pipeline
                  </div>
                  <div className="flex items-center gap-1">
                    {["Pending", "Confirmed", "Packed", "Shipped", "Delivered"].map(
                      (stage, i) => (
                        <div key={stage} className="flex-1 flex items-center">
                          <div
                            className={`flex-1 text-center py-2 rounded text-xs font-medium ${
                              i === 0
                                ? "bg-primary/10 text-primary"
                                : i === 4
                                  ? "bg-success/10 text-success"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {stage}
                          </div>
                          {i < 4 && (
                            <ChevronRight className="h-4 w-4 text-border flex-shrink-0" />
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Recent Order Notification */}
                <div className="mx-4 mb-4 p-3 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="font-medium">New COD order from Kandy</span>
                    <span className="text-muted-foreground">— Rs. 4,500</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-4 -right-4 bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <div>
                  <div className="text-sm font-bold">+97%</div>
                  <div className="text-xs text-muted-foreground">COD collection rate</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== TRUST BAR ==================== */}
      <section className="border-y border-border bg-card/30">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{t("trustedBy")}</span>
            {["Pronto", "Domex", "Koombiyo", "Fardar"].map((courier) => (
              <span key={courier} className="font-semibold text-foreground/70">
                {courier}
              </span>
            ))}
            <div className="w-px h-4 bg-border hidden md:block" />
            <span>
              <strong className="text-foreground">{t("lkrProcessed")}</strong>
            </span>
            <span>
              <strong className="text-foreground">{t("packagesDispatched")}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* ==================== PAIN POINTS (AGITATION) ==================== */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("painHeadline")}
          </h2>
          <p className="text-lg text-muted-foreground">{t("painSubheadline")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {painPoints.map((point, i) => (
            <PainPointCard key={point.title} {...point} index={i} />
          ))}
        </div>
      </section>

      {/* ==================== FEATURES WITH DETAILED SECTIONS ==================== */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("featuresHeadline")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("featuresSubheadline")}
          </p>
        </div>

        <div className="space-y-20 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <FeatureSection key={feature.title} {...feature} index={i} />
          ))}
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="container mx-auto px-6 py-20 bg-card/30 rounded-3xl my-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("howItWorksHeadline")}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              step: "1",
              icon: Users,
              title: t("step1Title"),
              description: t("step1Desc"),
            },
            {
              step: "2",
              icon: Package,
              title: t("step2Title"),
              description: t("step2Desc"),
            },
            {
              step: "3",
              icon: TrendingUp,
              title: t("step3Title"),
              description: t("step3Desc"),
            },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm font-bold text-primary mb-2">
                Step {step.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section id="pricing" className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("pricingHeadline")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("pricingSubheadline")}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">{t("allPlansInclude")}</p>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section id="testimonials" className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("testimonialsHeadline")}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, i) => (
            <TestimonialCard key={testimonial.name} {...testimonial} index={i} />
          ))}
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="container mx-auto px-6 py-20 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("faqHeadline")}
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
<section className="container mx-auto px-6 py-20">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto bg-primary cta-card"
  >
    {/* Dark bg in light mode → show inverse logo */}
    <img
      src="/logo-lockup-inverse.svg"
      alt="Ordera"
      className="h-10 w-auto mx-auto mb-6 light-only"
    />
    {/* Light bg in dark mode → show regular logo */}
    <img
      src="/ordera-logo.svg"
      alt="Ordera"
      className="h-10 w-auto mx-auto mb-6 dark-only"
    />
    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
      {t("finalHeadline")}
    </h2>
    <p className="text-lg text-primary-foreground/90 mb-8 max-w-xl mx-auto">
      {t("finalSubheadline")}
    </p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link to="/signup">
        <Button size="lg" variant="secondary" className="gap-2">
          {t("startTrial")} <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <button className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground transition-colors text-sm font-medium">
        <Phone className="h-4 w-4" /> {t("bookDemo")}
      </button>
    </div>
    <p className="text-sm text-primary-foreground/70 mt-6">
      {t("joinBusinesses")}
    </p>
  </motion.div>
</section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-border mt-20 bg-card/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-5xl mx-auto">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/ordera-logo.svg"
                  alt="Ordera"
                  className="h-8 w-auto light-only"
                />
                <img
                  src="/logo-lockup-inverse.svg"
                  alt="Ordera"
                  className="h-8 w-auto dark-only"
                />
              </div>
              <p className="text-sm text-muted-foreground">{t("footerLine")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground max-w-5xl mx-auto">
            <p>&copy; 2026 VeloraTech Lanka. Made in Sri Lanka 🇱🇰</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLang("en")}
                className="hover:text-foreground transition-colors"
              >
                English
              </button>
              <span className="text-border">|</span>
              <button
                onClick={() => setLang("si")}
                className="hover:text-foreground transition-colors"
              >
                සිංහල
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}