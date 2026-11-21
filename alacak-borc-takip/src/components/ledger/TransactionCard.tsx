import { CircleDollarSign, MessageCircle } from "lucide-react";
import type { Currency, LedgerRow } from "@/types";
import { diffDays, dueLabel, formatCurrency, todayISO } from "@/lib/format";
import { progressRatio } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { RowActions } from "@/components/ledger/RowActions";
import type { RowActionsProps } from "@/components/ledger/TransactionTable";

const ACCENT: Record<LedgerRow["status"], string> = {
  paid: "bg-receivable",
  overdue: "bg-payable",
  partial: "bg-amber",
  pending: "bg-brand",
};

export function TransactionCard({
  row,
  displayCurrency,
  actions,
}: {
  row: LedgerRow;
  displayCurrency: Currency;
  actions: RowActionsProps;
}) {
  const { tx } = row;
  const ratio = progressRatio(tx);
  const daysLeft = diffDays(todayISO(), row.nextDueDate);
  const showReminder = tx.type === "receivable" && row.remaining > 0 && daysLeft <= 10;

  return (
    <div
      onClick={() => actions.onDetail(tx)}
      className="card relative cursor-pointer overflow-hidden p-4 transition-transform active:scale-[0.99]"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", ACCENT[row.status])} />

      <div className="flex items-start gap-3 pl-1.5">
        <Avatar name={tx.contactName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{tx.contactName}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{tx.description || tx.category}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <TypeBadge type={tx.type} />
            <span className="text-[11px] text-faint">{tx.category}</span>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="-mr-1 -mt-1">
          <RowActions
            tx={tx}
            onDetail={() => actions.onDetail(tx)}
            onPartial={() => actions.onPartial(tx)}
            onEdit={() => actions.onEdit(tx)}
            onWhatsApp={() => actions.onWhatsApp(tx)}
            onDelete={() => actions.onDelete(tx)}
          />
        </div>
      </div>

      <div className="mt-3.5 flex items-end justify-between pl-1.5">
        <div>
          <p className="text-[11px] font-medium text-muted">Kalan Bakiye</p>
          <p
            className={cn(
              "tnum text-xl font-extrabold leading-tight",
              tx.type === "receivable" ? "text-receivable" : "text-payable",
            )}
          >
            {formatCurrency(row.remaining, displayCurrency)}
          </p>
          <p className="tnum mt-0.5 text-[11px] text-faint">
            Toplam {formatCurrency(row.total, displayCurrency)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={row.status} />
          <span
            className={cn(
              "text-[11px] font-medium",
              row.status === "overdue" ? "font-semibold text-payable" : "text-muted",
            )}
          >
            {row.status === "paid" ? "Tamamlandı" : dueLabel(row.nextDueDate)}
          </span>
        </div>
      </div>

      <div className="mt-3 pl-1.5">
        <ProgressBar
          value={ratio}
          tone={row.status === "overdue" ? "danger" : row.status === "partial" ? "warning" : "success"}
          height="h-1.5"
        />
        <div className="mt-1.5 flex items-center justify-between text-[11px]">
          <span className="tnum font-semibold text-muted">
            {formatCurrency(row.paid, displayCurrency)} ödendi
          </span>
          <span className="tnum font-semibold text-faint">{Math.round(ratio * 100)}%</span>
        </div>
      </div>

      {showReminder || row.remaining > 0 ? (
        <div className="mt-3.5 flex gap-2 pl-1.5" onClick={(e) => e.stopPropagation()}>
          {row.remaining > 0 ? (
            <button
              type="button"
              onClick={() => actions.onPartial(tx)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-2 py-2 text-[12px] font-semibold text-ink transition active:scale-[0.97]"
            >
              <CircleDollarSign className="h-3.5 w-3.5" />
              Kısmi Ödeme
            </button>
          ) : null}
          {showReminder ? (
            <button
              type="button"
              onClick={() => actions.onWhatsApp(tx)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-receivable-soft py-2 text-[12px] font-semibold text-receivable-dark transition active:scale-[0.97] dark:bg-receivable-softdark dark:text-receivable"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp Hatırlat
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
