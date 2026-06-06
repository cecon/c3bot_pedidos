import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  loadAppearance,
  serializeAppearance,
  type AppearanceSettings,
} from "../theme/appearance";
import { FONT_STACKS, PRIMARY_HSL, RADIUS_REM } from "../theme/themeTokens";

// Owns the live appearance: applies the `dark` class + CSS-variable overrides (primary, radius,
// font, density) to <html> and persists to localStorage. No UI framework provider — shadcn/Tailwind
// read these CSS variables directly.

interface AppearanceContextValue {
  settings: AppearanceSettings;
  update: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

const DENSITY_FONT_PX: Record<AppearanceSettings["density"], string> = {
  compact: "14px",
  normal: "15px",
  comfortable: "16px",
};

function prefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyAppearance(s: AppearanceSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = s.colorMode === "dark" || (s.colorMode === "auto" && prefersDark());
  root.classList.toggle("dark", dark);
  root.style.setProperty("--primary", PRIMARY_HSL[s.primaryColor]);
  root.style.setProperty("--ring", PRIMARY_HSL[s.primaryColor]);
  root.style.setProperty("--radius", RADIUS_REM[s.radiusPreset]);
  root.style.setProperty("--font-sans", FONT_STACKS[s.fontFamily]);
  root.style.fontSize = DENSITY_FONT_PX[s.density];
}

function readInitial(): AppearanceSettings {
  if (typeof localStorage === "undefined") return { ...DEFAULT_APPEARANCE };
  return loadAppearance(localStorage.getItem(APPEARANCE_STORAGE_KEY));
}

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(readInitial);

  useEffect(() => {
    applyAppearance(settings);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, serializeAppearance(settings));
    }
  }, [settings]);

  const update = useCallback(<K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  const value = useMemo<AppearanceContextValue>(() => ({ settings, update }), [settings, update]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within ThemeSettingsProvider");
  return ctx;
}
