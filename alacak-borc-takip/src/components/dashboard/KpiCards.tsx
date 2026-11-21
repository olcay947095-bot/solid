import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Scale, TriangleAlert } from "lucide-react";
import { useLedger } from "@/store/LedgerProvider";
import { computeKpis } from "@/lib/ledger";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { KpiSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

type Tone = "brand" | "success" | "danger" | "warning";

const TONES: Record<Tone, { iconWrap: string; ring: string; bar: string; accent: string; value: string }> = {
  brand: {
    iconWrap: "bg-brand-50 text-brand dark:bg-brand/15 dark:text-brand-100",
    ring: "ring-brand/15",
    bar: "from-brand/80 via-brand/30 to-transparent",
    accent: "from-brand/10",
    value: "text-ink",
  },
  success: {
    iconWrap: "bg-receivable-soft text-receivable dark:bg-receivable-softdark dark:text-receivable",
    ring: "ring-receivable/15",
    bar: "from-receivable/80 via-receivable/30 to-transparent",
    accent: "from-receivable/10",
    value: "text-ink",
  },
  danger: {
    iconWrap: "bg-payable-soft text-payable dark:bg-payable-softdark dark:text-payable",
    ring: "ring-payable/15",
    bar: "from-payable/80 via-payable/30 to-transparent",
    accent: "from-payable/10",
    value: "text-ink",
  },
  warning: {
    iconWrap: "bg-amber-soft text-amber dark:bg-amber-softdark dark:text-amber",
    ring: "ring-amber/15",
    bar: "from-amber/80 via-amber/30 to-transparent",
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
    <div className="card group relative h-full overflow-hidden p-5 transition-shadow duration-300 hover:shadow-card-hover">
      <span className={cn("pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r", t.bar)} />
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl",
          t.accent,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset",
            t.iconWrap,
            t.ring,
          )}
        >
          {icon}
        </div>
        {highlight ? (
          <Badge tone="danger" icon={<TriangleAlert className="h-3 w-3" />}>
            Acil
          </Badge>
        ) : null}
      </div>
      <p className="relative mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("tnum relative mt-1 truncate text-[19px] font-extrabold leading-tight sm:text-[22px]", t.value)}>
        {value}
      </p>
      <div className="relative mt-1.5 text-xs text-muted">{footer}</div>
    </div>
  );
}

export function KpiCards({ onShowOverdue }: { onShowOverdue: () => void }) {
  const { rows, displayCurrency, loading } = useLedger();
  const kpis = computeKpis(rows);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
      <button type="button" onClick={onShowOverdue} className="h-full w-full text-left">
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
