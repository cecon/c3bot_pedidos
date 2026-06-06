import { render, screen, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeSettingsProvider, useAppearance } from "./ThemeSettingsProvider";
import { APPEARANCE_STORAGE_KEY } from "../theme/appearance";

function Probe() {
  const { settings, update } = useAppearance();
  return (
    <div>
      <span data-testid="mode">{settings.colorMode}</span>
      <button onClick={() => update("colorMode", "light")}>to-light</button>
    </div>
  );
}

describe("ThemeSettingsProvider", () => {
  beforeEach(() => localStorage.clear());

  it("applies the dark class by default on mount", () => {
    render(<ThemeSettingsProvider><Probe /></ThemeSettingsProvider>);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("mode").textContent).toBe("dark");
  });

  it("updates the dark class and persists to localStorage on change", async () => {
    render(<ThemeSettingsProvider><Probe /></ThemeSettingsProvider>);
    await act(async () => {
      screen.getByText("to-light").click();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? "{}").colorMode).toBe("light");
  });

  it("restores a persisted preference on mount", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ colorMode: "light" }));
    render(<ThemeSettingsProvider><Probe /></ThemeSettingsProvider>);
    expect(screen.getByTestId("mode").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
