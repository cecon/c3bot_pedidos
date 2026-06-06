import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeSettingsProvider } from "./components/ThemeSettingsProvider";
import { Toaster } from "./components/ui/sonner";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeSettingsProvider>
      <App />
      <Toaster />
    </ThemeSettingsProvider>
  </React.StrictMode>,
);
