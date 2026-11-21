import type { Transaction } from "@/types";
import { BrandBanner } from "@/components/brand/BrandBanner";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { UpcomingDues } from "@/components/dashboard/UpcomingDues";

export function DashboardView({
  onSelect,
  onSeeAllDues,
  onShowOverdue,
}: {
  onSelect: (tx: Transaction) => void;
  onSeeAllDues: () => void;
  onShowOverdue: () => void;
}) {
  return (
    <div className="space-y-5">
      <BrandBanner />
      <KpiCards onShowOverdue={onShowOverdue} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CashFlowChart />
        </div>
        <UpcomingDues onSelect={onSelect} onSeeAll={onSeeAllDues} />
      </div>
    </div>
  );
}
