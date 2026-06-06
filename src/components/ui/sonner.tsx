import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useAppearance } from "../ThemeSettingsProvider";

// Canonical shadcn toaster, adapted to this repo's appearance store (no next-themes). The toast
// surface colors are driven by the `.toaster` CSS-variable overrides in src/index.css (token-based).
// `toast()` is imported directly from "sonner" at call sites.
export function Toaster(props: ToasterProps) {
  const { settings } = useAppearance();
  const theme = settings.colorMode === "auto" ? "system" : settings.colorMode;

  return (
    <Sonner
      data-slot="sonner-toaster"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      {...props}
    />
  );
}
