import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import {
  buildTheme,
  fontFamilyFor,
  loadThemeSettings,
  saveThemeSettings,
  type FontKey,
  type ThemeSettings,
} from "../theme";

// Tabler-style theme settings: the selected primary color rebuilds the Mantine theme, while radius
// and font are applied as CSS variables. Color mode (light/dark/auto) is handled by Mantine itself.
// Settings persist to localStorage. This is the only place that owns the live theme.

interface ThemeSettingsContextValue {
  settings: ThemeSettings;
  setPrimary: (primary: string) => void;
  setRadius: (radius: number) => void;
  setFont: (font: FontKey) => void;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | null>(null);

export function useThemeSettings(): ThemeSettingsContextValue {
  const value = useContext(ThemeSettingsContext);
  if (!value) throw new Error("useThemeSettings must be used within ThemeSettingsProvider");
  return value;
}

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(() => loadThemeSettings());
  const theme = useMemo(() => buildTheme(settings.primary), [settings.primary]);

  useEffect(() => {
    saveThemeSettings(settings);
    const root = document.documentElement.style;
    const radius = `${settings.radius}px`;
    root.setProperty("--mantine-radius-sm", radius);
    root.setProperty("--mantine-radius-default", radius);
    root.setProperty("--app-radius", radius);
    const family = fontFamilyFor(settings.font);
    root.setProperty("--mantine-font-family", family);
    root.setProperty("--mantine-font-family-headings", family);
  }, [settings]);

  const value = useMemo<ThemeSettingsContextValue>(
    () => ({
      settings,
      setPrimary: (primary) => setSettings((s) => ({ ...s, primary })),
      setRadius: (radius) => setSettings((s) => ({ ...s, radius })),
      setFont: (font) => setSettings((s) => ({ ...s, font })),
    }),
    [settings],
  );

  return (
    <ThemeSettingsContext.Provider value={value}>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications position="top-right" />
        {children}
      </MantineProvider>
    </ThemeSettingsContext.Provider>
  );
}
