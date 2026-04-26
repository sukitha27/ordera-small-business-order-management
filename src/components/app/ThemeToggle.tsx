import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyTheme,
  getStoredTheme,
  setStoredTheme,
  type Theme,
} from "@/lib/theme";

/**
 * Theme toggle for the sidebar — 3 segmented buttons (light / dark / system).
 *
 * On mount, reads the persisted theme. When the user changes it, applies the
 * new theme to the DOM and persists it. Also listens to system preference
 * changes when in "system" mode so the app live-updates if the user toggles
 * their OS theme.
 */
export function ThemeToggle() {
  // Default to "system" until we read from localStorage post-mount. Until
  // then, we don't render the active state (all buttons look idle), which
  // avoids hydration mismatches in case TanStack Start ever re-enables SSR.
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
    setMounted(true);
  }, []);

  // Re-apply theme + listen to OS theme changes when in "system" mode
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);

    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, mounted]);

  const choose = (next: Theme) => {
    setTheme(next);
    setStoredTheme(next);
    applyTheme(next);
  };

  const options: { value: Theme; Icon: typeof Sun; label: string }[] = [
    { value: "light", Icon: Sun, label: "Light" },
    { value: "dark", Icon: Moon, label: "Dark" },
    { value: "system", Icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex items-center rounded-lg bg-sidebar-accent p-1">
      {options.map(({ value, Icon, label }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            onClick={() => choose(value)}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "flex-1 inline-flex items-center justify-center py-1.5 rounded-md transition-colors",
              active
                ? "bg-sidebar text-sidebar-foreground shadow-sm"
                : "text-muted-foreground hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}