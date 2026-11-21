import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LedgerProvider } from "@/store/LedgerProvider";
import { ToastProvider } from "@/store/ToastProvider";
import { BackupProvider } from "@/store/BackupProvider";
import { App } from "@/App";
import "@/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Kök eleman (#root) bulunamadı.");

createRoot(container).render(
  <StrictMode>
    <LedgerProvider>
      <ToastProvider>
        <BackupProvider>
          <App />
        </BackupProvider>
      </ToastProvider>
    </LedgerProvider>
  </StrictMode>,
);

/* Çevrimdışı destek — yalnızca üretim derlemesinde service worker kaydı. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* kayıt başarısız olsa da uygulama çevrimiçi çalışmaya devam eder */
    });
  });
}
