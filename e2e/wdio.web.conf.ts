import { sharedConfig } from "./wdio.shared.conf";
import { startDevServer, type DevServerHandle } from "./support/devServer";

// Render-layer smoke (US1/US2): drives the served app in headless Chrome. Cross-platform.
// Set E2E_NO_SERVER=1 (with the app already running) to attach instead of spawning one.

process.env.E2E_LAYER = "web";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3920";
const manageServer = process.env.E2E_NO_SERVER !== "1";

let server: DevServerHandle | undefined;

export const config: WebdriverIO.Config = {
  ...sharedConfig,
  baseUrl,
  capabilities: [
    {
      browserName: "chrome",
      // Classic protocol returns "no such element" immediately; BiDi's locateNodes hangs ~90s on
      // missing elements, which would blow the bounded timeouts on the failure-path verification.
      "wdio:enforceWebDriverClassic": true,
      "goog:chromeOptions": {
        args: [
          "--headless=new",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--window-size=1360,860",
        ],
      },
    },
  ],

  async onPrepare() {
    if (manageServer) {
      server = await startDevServer(baseUrl);
    }
  },

  async onComplete() {
    if (server) {
      await server.stop();
      server = undefined;
    }
  },
};
