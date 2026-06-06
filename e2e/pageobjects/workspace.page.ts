import { $, browser, expect } from "@wdio/globals";

// Page object for the C3Bot admin workspace. Selectors come from the UI-handle contract
// (specs/009-e2e-smoke-test/contracts/ui-handles.md). The SAME page object drives both the
// render-layer (web) and native (Windows) smoke runs — only the launch differs (FR-013).

export type DestinationLabel = "Dashboard" | "Atendentes";

class WorkspacePage {
  /** Shell readiness marker (US1). */
  get shell() {
    return $('[data-testid="app-shell"]');
  }

  get nav() {
    return $('nav[aria-label="Navegação principal"]');
  }

  get headerTitle() {
    return $("header h1");
  }

  get content() {
    return $("main");
  }

  navButton(label: DestinationLabel) {
    return $(`button[aria-label="${label}"]`);
  }

  get dashboardPanel() {
    return $('[data-testid="panel-dashboard"]');
  }

  get attendantsPanel() {
    return $('[data-testid="panel-attendants"]');
  }

  /**
   * Wait for the workspace to open: the shell, navigation, header title and content region
   * must all be displayed within the bounded timeout (FR-002/FR-003). Throws a clear
   * "did not open" error on timeout (FR-004).
   */
  async waitForReady(timeoutMs = 30000): Promise<void> {
    try {
      await this.shell.waitForDisplayed({ timeout: timeoutMs });
      await this.nav.waitForDisplayed({ timeout: timeoutMs });
      await this.headerTitle.waitForDisplayed({ timeout: timeoutMs });
      await this.content.waitForDisplayed({ timeout: timeoutMs });
    } catch (cause) {
      throw new Error(
        `App did not open: workspace shell was not visible within ${timeoutMs}ms.`,
        { cause },
      );
    }
  }

  /** Activate a destination and assert its panel renders, failing named on the destination. */
  private async goto(label: DestinationLabel, panel: ReturnType<typeof $>): Promise<void> {
    try {
      await this.navButton(label).click();
      await panel.waitForDisplayed({ timeout: 15000 });
      await expect(this.headerTitle).toHaveText(label);
    } catch (cause) {
      throw new Error(`Destination "${label}" did not render its panel.`, { cause });
    }
  }

  async gotoDashboard(): Promise<void> {
    await this.goto("Dashboard", this.dashboardPanel);
  }

  async gotoAttendants(): Promise<void> {
    await this.goto("Atendentes", this.attendantsPanel);
  }

  /** Open the workspace at the layer-appropriate entry point, then wait for readiness. */
  async open(): Promise<void> {
    // Web layer navigates to the served app (uses the config baseUrl); the native layer's window
    // already loads the bundled app on launch, so we only wait for it to be ready.
    if (process.env.E2E_LAYER !== "native") {
      await browser.url("/");
    }
    await this.waitForReady();
  }
}

export const workspace = new WorkspacePage();
