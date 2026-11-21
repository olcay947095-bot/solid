import { CalendarClock, ChevronRight } from "lucide-react";
import type { Transaction } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { buildRow, dueSeverity } from "@/lib/ledger";
import { dueLabel, formatCurrency } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function UpcomingDues({
  onSelect,
  onSeeAll,
}: {
  onSelect: (tx: Transaction) => void;
  onSeeAll: () => void;
}) {
  const { rows, displayCurrency, loading } = useLedger();

  const upcoming = rows
    .filter((r) => r.remaining > 0)
    .sort((a, b) => (a.nextDueDate < b.nextDueDate ? -1 : 1))
    .slice(0, 6);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Yaklaşan Vadeler"
        subtitle="Ödeme bekleyen en yakın işlemler"
        action={
          <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />} onClick={onSeeAll}>
            Tümü
          </Button>
        }
      />

      <div className="mt-3 flex-1 space-y-1.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="h-6 w-6" />}
            title="Yaklaşan vade yok"
            description="Şu anda ödeme bekleyen bir işleminiz bulunmuyor."
          />
        ) : (
          upcoming.map((r) => {
            const row = buildRow(r.tx, displayCurrency);
            const severity = dueSeverity(r.nextDueDate, r.status);
            return (
              <button
                key={r.tx.id}
                type="button"
                onClick={() => onSelect(r.tx)}
                className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition-all duration-150 hover:border-line hover:bg-surface-2 active:scale-[0.99]"
              >
                <Avatar name={r.tx.contactName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{r.tx.contactName}</p>
                  <p className="truncate text-[11px] text-muted">{r.tx.description || r.tx.category}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "tnum text-[13px] font-bold",
                      r.tx.type === "receivable" ? "text-receivable" : "text-payable",
                    )}
                  >
                    {formatCurrency(row.remaining, displayCurrency)}
                  </p>
                  <span
                    className={cn(
                      "mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                      severity === "overdue" && "bg-payable-soft text-payable dark:bg-payable-softdark",
                      severity === "soon" && "bg-amber-soft text-amber dark:bg-amber-softdark",
                      severity === "normal" && "bg-surface-2 text-muted",
                    )}
                  >
                    {dueLabel(r.nextDueDate)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}
