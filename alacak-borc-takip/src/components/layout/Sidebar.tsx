import { ChevronLeft, RotateCcw, TrendingDown, TrendingUp } from "lucide-react";
import type { TxType } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { useToast } from "@/store/ToastProvider";
import { computeKpis } from "@/lib/ledger";
import { formatCurrency } from "@/lib/format";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { NAV_ITEMS, isNavActive, type View } from "@/components/layout/nav";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  view: View;
  ledgerType: "all" | TxType;
  onNavigate: (view: View, type?: "all" | TxType) => void;
}

export function Sidebar({ collapsed, onToggle, view, ledgerType, onNavigate }: SidebarProps) {
  const { rows, displayCurrency, resetDemoData } = useLedger();
  const toast = useToast();
  const kpis = computeKpis(rows);

  const counts: Record<string, number> = {
    "ledger-receivable": kpis.receivableCount,
    "ledger-payable": kpis.payableCount,
  };

  return (
    <aside
      className={cn(
        "no-print fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-300 lg:flex",
        collapsed ? "w-[76px]" : "w-[264px]",
      )}
    >
      {/* Marka letterhead */}
      <div className={cn("flex flex-col items-center gap-2 border-b border-line px-4 py-3.5", collapsed && "gap-0 px-0 py-3")}>
        <Logo size={collapsed ? 34 : 40} />
        {!collapsed ? (
          <div className="text-center">
            <p className="text-[13px] font-extrabold leading-tight tracking-[0.01em] text-ink">
              {BRAND.name}
            </p>
            <p className="text-[12px] font-semibold leading-tight text-brand">{BRAND.suffix}</p>
            <span className="mx-auto mt-1.5 block h-[3px] w-8 rounded-full bg-gradient-to-r from-brand to-gold" />
          </div>
        ) : null}
      </div>

      {/* Menü */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(item, view, ledgerType);
          const Icon = item.icon;
          const count = counts[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.view, item.type)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98]",
                active ? "bg-brand-50 text-brand dark:bg-brand/15 dark:text-brand-100" : "text-muted hover:bg-surface-2 hover:text-ink",
                collapsed && "justify-center px-0",
              )}
            >
              {active ? (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
              ) : null}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed ? (
                <>
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  {count ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                        active ? "bg-brand text-white" : "bg-surface-3 text-muted",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Alt blok */}
      <div className="space-y-2 border-t border-line p-3">
        {!collapsed ? (
          <>
            <div className="rounded-xl bg-gradient-to-br from-brand-50 to-surface-2 p-3 dark:from-brand/15 dark:to-surface-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Net Bakiye</p>
              <p
                className={cn(
                  "tnum mt-1 text-lg font-extrabold",
                  kpis.net >= 0 ? "text-receivable" : "text-payable",
                )}
              >
                {formatCurrency(kpis.net, displayCurrency)}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-receivable">
                  <TrendingUp className="h-3 w-3" />
                  {kpis.receivableCount}
                </span>
                <span className="flex items-center gap-1 text-payable">
                  <TrendingDown className="h-3 w-3" />
                  {kpis.payableCount}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                toast.success("Örnek veriler yeniden yüklendi");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Örnek Verileri Sıfırla
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              resetDemoData();
              toast.success("Örnek veriler yeniden yüklendi");
            }}
            title="Örnek Verileri Sıfırla"
            className="flex w-full items-center justify-center rounded-xl py-2 text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Daraltma düğmesi */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
        className="absolute -right-3 top-[96px] flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-sm transition hover:text-ink"
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")} />
      </button>
    </aside>
  );
}
