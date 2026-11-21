import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Scale, TriangleAlert } from "lucide-react";
import { useLedger } from "@/store/LedgerProvider";
import { computeKpis } from "@/lib/ledger";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { KpiSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

type Tone = "brand" | "success" | "danger" | "warning";

const TONES: Record<Tone, { iconWrap: string; accent: string; value: string }> = {
  brand: {
    iconWrap: "bg-brand-50 text-brand dark:bg-brand/15 dark:text-brand-100",
    accent: "from-brand/10",
    value: "text-ink",
  },
  success: {
    iconWrap: "bg-receivable-soft text-receivable dark:bg-receivable-softdark dark:text-receivable",
    accent: "from-receivable/10",
    value: "text-ink",
  },
  danger: {
    iconWrap: "bg-payable-soft text-payable dark:bg-payable-softdark dark:text-payable",
    accent: "from-payable/10",
    value: "text-ink",
  },
  warning: {
    iconWrap: "bg-amber-soft text-amber dark:bg-amber-softdark dark:text-amber",
    accent: "from-amber/10",
    value: "text-ink",
  },
};

function KpiCard({
  label,
  value,
  tone,
  icon,
  footer,
  highlight,
}: {
  label: string;
  value: string;
  tone: Tone;
  icon: ReactNode;
  footer: ReactNode;
  highlight?: boolean;
}) {
  const t = TONES[tone];
  return (
    <div className="card group relative min-w-[262px] snap-start overflow-hidden p-5 sm:min-w-0">
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br to-transparent blur-xl transition-opacity duration-300 group-hover:opacity-100",
          t.accent,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", t.iconWrap)}>{icon}</div>
        {highlight ? (
          <Badge tone="danger" icon={<TriangleAlert className="h-3 w-3" />}>
            Acil
          </Badge>
        ) : null}
      </div>
      <p className="relative mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("tnum relative mt-1 text-[22px] font-extrabold leading-tight", t.value)}>{value}</p>
      <div className="relative mt-1.5 text-xs text-muted">{footer}</div>
    </div>
  );
}

export function KpiCards({ onShowOverdue }: { onShowOverdue: () => void }) {
  const { rows, displayCurrency, loading } = useLedger();
  const kpis = computeKpis(rows);

  if (loading) {
    return (
      <div className="flex snap-x gap-4 overflow-x-auto pb-1 no-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[262px] snap-start sm:min-w-0">
            <KpiSkeleton />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 no-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
      <KpiCard
        label="Net Bakiye"
        value={formatCurrency(kpis.net, displayCurrency)}
        tone="brand"
        icon={<Scale className="h-5 w-5" />}
        footer={
          <span className={cn("font-semibold", kpis.net >= 0 ? "text-receivable" : "text-payable")}>
            {kpis.net >= 0 ? "Alacaklar borçları karşılıyor" : "Borçlar alacakları aşıyor"}
          </span>
        }
      />
      <KpiCard
        label="Toplam Alacak"
        value={formatCurrency(kpis.receivable, displayCurrency)}
        tone="success"
        icon={<ArrowDownRight className="h-5 w-5" />}
        footer={<span>{kpis.receivableCount} açık işlem</span>}
      />
      <KpiCard
        label="Toplam Borç"
        value={formatCurrency(kpis.payable, displayCurrency)}
        tone="danger"
        icon={<ArrowUpRight className="h-5 w-5" />}
        footer={<span>{kpis.payableCount} açık işlem</span>}
      />
      <button type="button" onClick={onShowOverdue} className="min-w-[262px] snap-start text-left sm:min-w-0">
        <KpiCard
          label="Gecikmiş Ödemeler"
          value={formatCurrency(kpis.overdue, displayCurrency)}
          tone="warning"
          icon={<TriangleAlert className="h-5 w-5" />}
          highlight={kpis.overdueCount > 0}
          footer={
            <span className="font-semibold text-amber">
              {kpis.overdueCount} gecikmiş işlem — görüntüle
            </span>
          }
        />
      </button>
    </div>
  );
}
