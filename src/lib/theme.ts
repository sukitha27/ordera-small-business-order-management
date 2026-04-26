/**
 * Theme management utilities.
 *
 * Three modes:
 *   - "light"  — explicit light mode
 *   - "dark"   — explicit dark mode
 *   - "system" — follows the OS prefers-color-scheme setting (default)
 *
 * The chosen theme is persisted in localStorage. The actual `.dark` class on
 * <html> is set synchronously by an inline <head> script (see __root.tsx)
 * before React hydrates, which prevents the flash of light theme on dark
 * users. This module is for runtime updates (toggle button) and SSR-safe
 * hooks; the FOUC-prevention itself is just inline script.
 */

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "ordera-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, theme);
}

/** Returns the actual mode that should currently be applied (light or dark). */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Apply the resolved theme to the <html> element by toggling .dark class. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Inline script source as a string — used in <head> to prevent FOUC.
 * Must be self-contained (no imports, no closures) since it runs before
 * the rest of the bundle is loaded. Reads from localStorage and the system
 * preference, applies the `.dark` class synchronously.
 */
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem("${STORAGE_KEY}");
    if (t !== "light" && t !== "dark") t = "system";
    var dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`.trim();