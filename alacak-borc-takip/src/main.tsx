import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LedgerProvider } from "@/store/LedgerProvider";
import { ToastProvider } from "@/store/ToastProvider";
import { App } from "@/App";
import "@/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Kök eleman (#root) bulunamadı.");

createRoot(container).render(
  <StrictMode>
    <LedgerProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LedgerProvider>
  </StrictMode>,
);
