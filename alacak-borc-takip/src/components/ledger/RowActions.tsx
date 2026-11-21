import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, MessageCircle, MoreVertical, Pencil, Trash2, Wallet } from "lucide-react";
import type { Transaction } from "@/types";
import { remainingAmount } from "@/lib/ledger";
import { cn } from "@/lib/utils";

interface RowActionsProps {
  tx: Transaction;
  onDetail: () => void;
  onPartial: () => void;
  onEdit: () => void;
  onWhatsApp: () => void;
  onDelete: () => void;
}

interface MenuItem {
  label: string;
  icon: typeof Eye;
  onClick: () => void;
  tone?: "default" | "brand" | "danger" | "success";
  show: boolean;
}

export function RowActions({ tx, onDetail, onPartial, onEdit, onWhatsApp, onDelete }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const hasRemaining = remainingAmount(tx) > 0.01;

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const menuWidth = 224;
    const estimatedHeight = 260;
    const left = Math.max(8, Math.min(r.right - menuWidth, window.innerWidth - menuWidth - 8));
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < estimatedHeight ? Math.max(8, r.top - estimatedHeight - 6) : r.bottom + 6;
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const items: MenuItem[] = [
    { label: "Detayı Gör", icon: Eye, onClick: onDetail, show: true },
    { label: "Kısmi Ödeme Ekle", icon: Wallet, onClick: onPartial, tone: "brand", show: hasRemaining },
    {
      label: "WhatsApp Hatırlatma",
      icon: MessageCircle,
      onClick: onWhatsApp,
      tone: "success",
      show: tx.type === "receivable" && hasRemaining,
    },
    { label: "Düzenle", icon: Pencil, onClick: onEdit, show: true },
    { label: "Sil", icon: Trash2, onClick: onDelete, tone: "danger", show: true },
  ];

  const TONE: Record<string, string> = {
    default: "text-ink",
    brand: "text-brand",
    success: "text-receivable",
    danger: "text-payable",
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="İşlem menüsü"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-3 hover:text-ink",
          open && "bg-surface-3 text-ink",
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: pos.top, left: pos.left, width: 224 }}
              className="fixed z-[80] animate-scale-in overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-pop"
            >
              {items
                .filter((i) => i.show)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(false);
                        item.onClick();
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition hover:bg-surface-2",
                        TONE[item.tone ?? "default"],
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
