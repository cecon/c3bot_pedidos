import { Menu, Moon, Sun } from "./icons";
import { Button } from "./ui/button";
import { ThemeSettingsDrawer } from "./ThemeSettingsDrawer";
import { useAppearance } from "./ThemeSettingsProvider";
import type { NavigationDestination } from "../domain/navigation";

interface AppHeaderProps {
  activeDestination: NavigationDestination;
  onToggleSidebar: () => void;
}

export function AppHeader({ activeDestination, onToggleSidebar }: AppHeaderProps) {
  const { settings, update } = useAppearance();
  const isDark = settings.colorMode !== "light";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Alternar menu lateral" onClick={onToggleSidebar}>
          <Menu size={18} />
        </Button>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold">{activeDestination.label}</h1>
          <p className="text-xs text-muted-foreground">{activeDestination.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
          onClick={() => update("colorMode", isDark ? "light" : "dark")}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <ThemeSettingsDrawer />
      </div>
    </header>
  );
}
