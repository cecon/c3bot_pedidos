// Platform guard for the native-shell smoke (US3 / FR-014, FR-015).
// tauri-driver only supports Windows (msedgedriver/WebView2) and Linux (WebKitWebDriver);
// macOS exposes no WebDriver for WKWebView. The native run is scoped to Windows here.

export const isWindows = process.platform === "win32";

// Called by the native npm script before WDIO starts. On a non-Windows host it prints a
// clear skip message and exits 0 so the run is a clean no-op rather than a hang or red build.
export function skipUnlessWindows(): void {
  if (isWindows) return;
  // eslint-disable-next-line no-console
  console.log(
    `native smoke skipped — Windows only (current platform: ${process.platform}). ` +
      "Run `pnpm test:e2e` for the cross-platform render-layer smoke.",
  );
  process.exit(0);
}
