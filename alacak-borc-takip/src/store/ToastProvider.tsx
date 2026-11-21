import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn, uid } from "@/lib/utils";

type Tone = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  tone: Tone;
  title: string;
  description?: string;
}

interface ToastApi {
  show: (tone: Tone, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONE_STYLES: Record<Tone, { icon: typeof Info; ring: string; iconClass: string }> = {
  success: { icon: CheckCircle2, ring: "border-receivable/30", iconClass: "text-receivable" },
  error: { icon: XCircle, ring: "border-payable/30", iconClass: "text-payable" },
  warning: { icon: AlertTriangle, ring: "border-amber/30", iconClass: "text-amber" },
  info: { icon: Info, ring: "border-brand/30", iconClass: "text-brand" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (tone: Tone, title: string, description?: string) => {
      const id = uid("toast");
      setItems((prev) => [...prev.slice(-3), { id, tone, title, description }]);
      const timer = setTimeout(() => dismiss(id), 3600);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (t, d) => show("success", t, d),
      error: (t, d) => show("error", t, d),
      info: (t, d) => show("info", t, d),
      warning: (t, d) => show("warning", t, d),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:top-5 sm:items-end"
        aria-live="polite"
        role="status"
      >
        {items.map((t) => {
          const { icon: Icon, ring, iconClass } = TONE_STYLES[t.tone];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border bg-surface p-3.5 shadow-pop",
                ring,
              )}
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-m-1 rounded-lg p-1 text-faint transition hover:bg-surface-2 hover:text-ink"
                aria-label="Bildirimi kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast, ToastProvider içinde kullanılmalıdır.");
  return ctx;
}
