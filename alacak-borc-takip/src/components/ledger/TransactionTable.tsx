import type { Currency, LedgerRow, Transaction } from "@/types";
import { dueLabel, formatCurrency, formatDate } from "@/lib/format";
import { progressRatio, dueSeverity } from "@/lib/ledger";
import { currencySymbol, cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { RowActions } from "@/components/ledger/RowActions";

export interface RowActionsProps {
  onDetail: (tx: Transaction) => void;
  onPartial: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onWhatsApp: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

function progressTone(status: LedgerRow["status"]) {
  return status === "paid"
    ? "success"
    : status === "overdue"
      ? "danger"
      : status === "partial"
        ? "warning"
        : "brand";
}

export function TransactionTable({
  rows,
  displayCurrency,
  runningBalance,
  actions,
}: {
  rows: LedgerRow[];
  displayCurrency: Currency;
  runningBalance: Map<string, number>;
  actions: RowActionsProps;
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[1000px] border-collapse">
        <thead>
          <tr className="text-left">
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-faint">Kişi / Firma</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-faint">Tür</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-faint">Vade</th>
            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-faint">Tutar</th>
            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-faint">Bakiye</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-faint">Tahsil / Ödeme</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-faint">Durum</th>
            <th className="w-14 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const severity = dueSeverity(r.nextDueDate, r.status);
            const ratio = progressRatio(r.tx);
            const balance = runningBalance.get(r.tx.id) ?? 0;
            return (
              <tr
                key={r.tx.id}
                onClick={() => actions.onDetail(r.tx)}
                className={cn(
                  "cursor-pointer border-t border-line transition-colors hover:bg-surface-2",
                  severity === "overdue" && "bg-payable-soft/50 dark:bg-payable-softdark/40",
                  severity === "soon" && "bg-amber-soft/50 dark:bg-amber-softdark/40",
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.tx.contactName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{r.tx.contactName}</p>
                      <p className="truncate text-[11px] text-muted">{r.tx.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={r.tx.type} />
                </td>
                <td className="px-4 py-3">
                  <p className="tnum text-[13px] font-semibold text-ink">{formatDate(r.nextDueDate)}</p>
                  <p
                    className={cn(
                      "text-[11px]",
                      severity === "overdue"
                        ? "font-semibold text-payable"
                        : severity === "soon"
                          ? "font-semibold text-amber"
                          : "text-muted",
                    )}
                  >
                    {r.status === "paid" ? "Tamamlandı" : dueLabel(r.nextDueDate)}
                  </p>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="tnum text-[13px] font-bold text-ink">
                    {formatCurrency(r.total, displayCurrency)}
                  </p>
                  {r.tx.currency !== displayCurrency ? (
                    <p className="tnum text-[11px] text-faint">
                      {currencySymbol(r.tx.currency)}
                      {r.tx.amount.toLocaleString("tr-TR")}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  <p
                    className={cn(
                      "tnum text-[13px] font-bold",
                      balance >= 0 ? "text-receivable" : "text-payable",
                    )}
                  >
                    {formatCurrency(balance, displayCurrency)}
                  </p>
                  <p className="text-[11px] text-faint">{balance >= 0 ? "net alacak" : "net borç"}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="w-[140px]">
                    <ProgressBar value={ratio} tone={progressTone(r.status)} height="h-1.5" />
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="tnum font-semibold text-muted">
                        {formatCurrency(r.paid, displayCurrency)}
                      </span>
                      <span className={cn("tnum font-semibold", severity === "overdue" ? "text-payable" : "text-faint")}>
                        {Math.round(ratio * 100)}%
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActions
                    tx={r.tx}
                    onDetail={() => actions.onDetail(r.tx)}
                    onPartial={() => actions.onPartial(r.tx)}
                    onEdit={() => actions.onEdit(r.tx)}
                    onWhatsApp={() => actions.onWhatsApp(r.tx)}
                    onDelete={() => actions.onDelete(r.tx)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
