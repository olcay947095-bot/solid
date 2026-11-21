import { Plus } from "lucide-react";
import type { TxType } from "@/types";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV, isNavActive, type View } from "@/components/layout/nav";

interface BottomNavProps {
  view: View;
  ledgerType: "all" | TxType;
  onNavigate: (view: View, type?: "all" | TxType) => void;
  onQuickAdd: () => void;
}

export function BottomNav({ view, ledgerType, onNavigate, onQuickAdd }: BottomNavProps) {
  const [first, second, third, fourth] = BOTTOM_NAV;

  return (
    <>
      {/* Hızlı ekle — ortada yüzen düğme */}
      <button
        type="button"
        onClick={onQuickAdd}
        aria-label="Hızlı işlem ekle"
        className="no-print fixed bottom-[calc(env(safe-area-inset-bottom,0px)+26px)] left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand text-white shadow-pop ring-4 ring-bg transition-transform duration-150 active:scale-90 lg:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.6} />
      </button>

      <nav className="no-print safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5">
          {[first, second].map((item) => (
            <NavButton
              key={item.key}
              item={item}
              active={isNavActive(item, view, ledgerType)}
              onClick={() => onNavigate(item.view, item.type)}
            />
          ))}
          <div aria-hidden />
          {[third, fourth].map((item) => (
            <NavButton
              key={item.key}
              item={item}
              active={isNavActive(item, view, ledgerType)}
              onClick={() => onNavigate(item.view, item.type)}
            />
          ))}
        </div>
      </nav>
    </>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: (typeof BOTTOM_NAV)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition-colors active:scale-95",
        active ? "text-brand" : "text-faint hover:text-ink",
      )}
    >
      <Icon className={cn("h-[21px] w-[21px] transition-transform", active && "scale-105")} />
      <span className="leading-none">{item.shortLabel}</span>
    </button>
  );
}
