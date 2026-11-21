import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "brand";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full animate-slide-up rounded-t-3xl border border-line bg-surface p-6 shadow-pop outline-none sm:max-w-sm sm:animate-scale-in sm:rounded-2xl"
      >
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            tone === "danger" ? "bg-payable-soft text-payable" : "bg-brand-50 text-brand",
          )}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{message}</p>
        <div className="mt-6 flex gap-2.5">
          <Button variant="secondary" block onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} block onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
