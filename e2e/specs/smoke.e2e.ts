import { expect } from "@wdio/globals";
import { workspace } from "../pageobjects/workspace.page";

// One smoke spec, run by both the web (US1/US2) and native (US3) configs — only the launch differs.

describe("Smoke: launch & navigate", () => {
  it("opens the workspace shell [US1]", async () => {
    await workspace.open();

    // Shell present: navigation + header + content region (FR-003).
    await expect(workspace.shell).toBeDisplayed();
    await expect(workspace.nav).toBeDisplayed();
    await expect(workspace.content).toBeDisplayed();

    // Exactly the two destinations are exposed.
    await expect(workspace.navButton("Dashboard")).toBeDisplayed();
    await expect(workspace.navButton("Atendentes")).toBeDisplayed();
  });

  it("navigates to the Dashboard destination [US2]", async () => {
    await workspace.gotoDashboard();

    // Primary handle (FR-005) + defense-in-depth copy assertions (FR-010 secondary).
    await expect(workspace.dashboardPanel).toBeDisplayed();
    await expect(workspace.dashboardPanel).toHaveText(expect.stringContaining("Bem-vindo ao C3Bot"));
    await expect(workspace.dashboardPanel).toHaveText(expect.stringContaining("Atendentes ativos"));
  });

  it("navigates to the Attendants destination [US2]", async () => {
    await workspace.gotoAttendants();

    // Primary handle (FR-006) + secondary content assertions.
    await expect(workspace.attendantsPanel).toBeDisplayed();
    await expect(workspace.attendantsPanel).toHaveText(expect.stringContaining("Atendentes"));
    await expect(workspace.attendantsPanel).toHaveText(expect.stringContaining("Adicionar atendente"));
  });
});
