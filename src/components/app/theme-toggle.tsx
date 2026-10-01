import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  return (
    <div className="flex rounded-full border border-border p-0.5" role="group" aria-label="Theme">
      {(["light", "dark"] as const).map((t: Theme) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          aria-pressed={theme === t}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium ${
            theme === t ? "bg-accent text-accent-fg" : "text-muted"
          }`}
        >
          {t === "light" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          {/* <span className="hidden sm:inline">{t === "light" ? "Light" : "Dark"}</span> */}
        </button>
      ))}
    </div>
  );
}
