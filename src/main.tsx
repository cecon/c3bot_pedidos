import React from "react";
import ReactDOM from "react-dom/client";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import App from "./App";
import { ThemeSettingsProvider } from "./components/ThemeSettingsProvider";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeSettingsProvider>
      <App />
    </ThemeSettingsProvider>
  </React.StrictMode>,
);
