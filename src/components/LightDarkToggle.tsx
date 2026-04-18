import { Switch } from "./ui/switch";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-context";

export default function LightDarkToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5">
      <Sun
        className={`size-4 transition-colors ${
          isDark ? "text-muted-foreground/60" : "text-amber-500"
        }`}
      />
      <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        className="h-6 w-11 data-[state=checked]:bg-primary"
      />
      <Moon
        className={`size-4 transition-colors ${
          isDark ? "text-sky-400" : "text-muted-foreground/60"
        }`}
      />
    </div>
  );
}
