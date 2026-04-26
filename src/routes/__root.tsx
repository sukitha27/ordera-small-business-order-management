import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Last-resort error UI shown when an unhandled error bubbles up through the
 * router/component tree. Without this, an uncaught error renders a blank
 * white page — terrible UX. This page gives the user something to do
 * (retry / go home / refresh) and exposes the error message in collapsed
 * form so they can paste it to support if it keeps happening.
 */
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  // Best-effort log so we can see errors in browser devtools / future
  // analytics integrations. Production users won't see this in the console
  // unless they open devtools, which is fine.
  if (typeof console !== "undefined") {
    console.error("[Ordera] Unhandled error:", error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              We hit an unexpected error. This isn't your fault — try refreshing,
              or contact support if it keeps happening.
            </p>
          </div>

          {error?.message && (
            <details className="text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Error details
              </summary>
              <pre className="mt-2 rounded-md bg-muted p-3 text-xs text-destructive whitespace-pre-wrap wrap-break-word max-h-32 overflow-auto">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                reset();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RotateCw className="h-4 w-4" />
              Try again
            </button>
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Or refresh the page
          </button>
        </div>
      </div>
    </div>
  );
}

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ordera — Order management for Sri Lankan businesses" },
      { name: "description", content: "Track orders, products, COD payments and courier dispatch in one clean dashboard built for Sri Lankan online businesses." },
      { name: "author", content: "Ordera" },
      { property: "og:title", content: "Ordera — Order management for Sri Lankan businesses" },
      { property: "og:description", content: "Track orders, products, COD payments and courier dispatch in one clean dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+Sinhala:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      // Inline theme init — runs before React, prevents flash of light theme
      // for users who prefer dark mode. Reads localStorage + system preference
      // and adds .dark class to <html> synchronously.
      {
        children: THEME_INIT_SCRIPT,
      },
      // Cloudflare Web Analytics — privacy-friendly, cookie-less page view tracking.
      // Free unlimited usage as long as the site is on Cloudflare. Loads with `defer`
      // so it never blocks page render.
      {
        src: "https://static.cloudflareinsights.com/beacon.min.js",
        defer: true,
        "data-cf-beacon": '{"token": "3675dded811c4c52bdb629896971c7d5"}',
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}