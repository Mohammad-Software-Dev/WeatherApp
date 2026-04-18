import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useTheme } from "./theme-context";

export default function LightDarkToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="inline-flex items-center rounded-full border border-border/70 bg-background/70 p-1 h-11 gap-1"
      role="group"
      aria-label="Color theme"
    >
      <ThemeButton
        label="Light theme"
        isActive={theme === "light"}
        onClick={() => setTheme("light")}
      >
        <Sun
          aria-hidden="true"
          className={`size-4 transition-colors ${theme === "light" ? "text-amber-500" : "text-muted-foreground/60"}`}
        />
      </ThemeButton>
      <ThemeButton
        label="Dark theme"
        isActive={theme === "dark"}
        onClick={() => setTheme("dark")}
      >
        <Moon
          aria-hidden="true"
          className={`size-4 transition-colors ${theme === "dark" ? "text-sky-400" : "text-muted-foreground/60"}`}
        />
      </ThemeButton>
    </div>
  );
}

function ThemeButton({
  label,
  isActive,
  onClick,
  children,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
      className={`grid place-items-center size-8 rounded-full transition-colors cursor-pointer ${
        isActive
          ? "bg-foreground/10 ring-1 ring-border"
          : "hover:bg-foreground/5"
      }`}
    >
      {children}
    </button>
  );
}
