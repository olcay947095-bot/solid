import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

/**
 * Duyarlı panel: masaüstünde sağdan açılan çekmece (drawer),
 * mobilde alttan yükselen sayfa (bottom sheet).
 */
export function Sheet({ open, onClose, title, description, children, footer, size = "md" }: SheetProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 animate-fade-in bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute flex flex-col border-line bg-surface shadow-pop",
          isMobile
            ? "inset-x-0 bottom-0 max-h-[92vh] max-h-[92dvh] animate-sheet-up rounded-t-3xl border-t"
            : cn(
                "right-0 top-0 h-full animate-slide-in-right border-l",
                size === "lg" ? "w-[560px]" : "w-[480px]",
              ),
        )}
      >
        {isMobile ? (
          <div className="mx-auto mt-2.5 h-1.5 w-11 shrink-0 rounded-full bg-surface-3" />
        ) : null}

        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-m-1.5 rounded-xl p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* min-h-0: flex sütununda kaydırılabilir alanın küçülebilmesi için şart,
            aksi hâlde uzun içerik paneli ekranın dışına taşırır. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>

        {footer ? (
          <footer className="safe-bottom shrink-0 border-t border-line bg-surface px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
