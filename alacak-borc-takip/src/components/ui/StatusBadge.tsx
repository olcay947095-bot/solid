import { ArrowDownLeft, ArrowUpRight, Clock, AlertTriangle, CheckCircle2, CircleDot } from "lucide-react";
import type { TxStatus, TxType } from "@/types";
import { STATUS_META } from "@/lib/constants";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

const STATUS_ICONS: Record<TxStatus, typeof Clock> = {
  paid: CheckCircle2,
  pending: Clock,
  overdue: AlertTriangle,
  partial: CircleDot,
};

export function StatusBadge({ status, className }: { status: TxStatus; className?: string }) {
  const meta = STATUS_META[status];
  const Icon = STATUS_ICONS[status];
  return (
    <Badge tone={meta.tone as BadgeTone} icon={<Icon className="h-3 w-3" />} className={className}>
      {meta.label}
    </Badge>
  );
}

export function TypeBadge({ type, className }: { type: TxType; className?: string }) {
  const isReceivable = type === "receivable";
  return (
    <Badge
      tone={isReceivable ? "success" : "danger"}
      icon={
        isReceivable ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />
      }
      className={className}
    >
      {isReceivable ? "Alacak" : "Borç"}
    </Badge>
  );
}
