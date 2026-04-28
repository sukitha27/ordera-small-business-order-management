import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyTheme,
  getStoredTheme,
  setStoredTheme,
  type Theme,
} from "@/lib/theme";

export function LandingThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
    setMounted(true);
  }, []);

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

  if (!mounted) return <div className="h-8 w-16" />;

  return (
    <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
      <button
        onClick={() => choose("light")}
        title="Light"
        aria-label="Light mode"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          theme === "light"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => choose("dark")}
        title="Dark"
        aria-label="Dark mode"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          theme === "dark"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => choose("system")}
        title="System"
        aria-label="System theme"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          theme === "system"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}