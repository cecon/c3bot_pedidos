import { spawn, type ChildProcess } from "node:child_process";

// Launches `tauri-driver` (the official Tauri WebDriver proxy) for the native smoke (US3).
// On Windows it fronts msedgedriver (WebView2). Install once: `cargo install tauri-driver --locked`.
// Provide msedgedriver via PATH or set EDGEDRIVER_PATH to an explicit binary.

let driver: ChildProcess | undefined;

export async function startTauriDriver(): Promise<void> {
  const nativeDriver = process.env.EDGEDRIVER_PATH;
  const args = nativeDriver ? ["--native-driver", nativeDriver] : [];
  driver = spawn("tauri-driver", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  driver.on("error", (err) => {
    console.error("Failed to start tauri-driver — is it installed? (cargo install tauri-driver)", err);
  });
  // Give the proxy a moment to bind its port before WDIO opens a session.
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

export function stopTauriDriver(): void {
  driver?.kill();
  driver = undefined;
}
