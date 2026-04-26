import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "cf-turnstile-script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface Props {
  /** Public site key from Cloudflare Turnstile dashboard */
  siteKey: string;
  /** Called whenever a fresh verification token is produced */
  onVerify: (token: string) => void;
  /** Called when the token expires (typically 5 min) */
  onExpire?: () => void;
  /** Called when verification fails entirely */
  onError?: () => void;
  /** Visual theme — defaults to "auto" which picks based on OS preference */
  theme?: "light" | "dark" | "auto";
}

/**
 * Cloudflare Turnstile widget wrapper.
 *
 * Lazy-loads the Turnstile script once per page (subsequent mounts reuse it),
 * renders the widget into a container div, and surfaces tokens via onVerify.
 *
 * Tokens are short-lived (~5 min). The parent form should pass the latest
 * token to the captcha-protected request — if it expires before the form
 * is submitted, the widget calls onExpire() and the parent should treat
 * the token as invalid (just clear it and the user re-verifies).
 */
export function Captcha({ siteKey, onVerify, onExpire, onError, theme = "auto" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Load the Turnstile script once. Subsequent mounts find it already there.
    const ensureScriptLoaded = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.turnstile) {
          resolve();
          return;
        }
        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject(new Error("Turnstile script load failed")));
          return;
        }
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Turnstile script load failed"));
        document.head.appendChild(script);
      });
    };

    ensureScriptLoaded()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;

        // Clear any previous widget rendered in this container
        containerRef.current.innerHTML = "";

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onVerify(token),
          "expired-callback": () => onExpire?.(),
          "error-callback": () => onError?.(),
          theme,
        });
      })
      .catch(() => {
        onError?.();
      });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore — widget might already be gone
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return <div ref={containerRef} className="cf-turnstile" />;
}