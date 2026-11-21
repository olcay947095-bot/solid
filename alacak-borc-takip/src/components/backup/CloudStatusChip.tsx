import { AlertTriangle, CheckCircle2, Cloud, CloudOff, Loader2 } from "lucide-react";
import { useBackup } from "@/store/BackupProvider";
import { cn } from "@/lib/utils";

interface CloudStatusChipProps {
  onClick?: () => void;
  /** Yalnızca ikon göster (dar alanlar için). */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Bulut yedekleme + bağlantı durumunu gösteren kompakt gösterge.
 */
export function CloudStatusChip({ onClick, iconOnly, className }: CloudStatusChipProps) {
  const { online, connected, status } = useBackup();

  let tone = "neutral" as "neutral" | "success" | "danger" | "warning" | "brand";
  let label = "Bulut kapalı";
  let Icon = Cloud;

  if (!online) {
    tone = "warning";
    label = "Çevrimdışı";
    Icon = CloudOff;
  } else if (status === "syncing") {
    tone = "brand";
    label = "Yedekleniyor";
    Icon = Loader2;
  } else if (status === "queued") {
    tone = "warning";
    label = "Sırada bekliyor";
    Icon = CloudOff;
  } else if (status === "error") {
    tone = "danger";
    label = "Yedek hatası";
    Icon = AlertTriangle;
  } else if (!connected) {
    tone = "neutral";
    label = "Bulut kapalı";
    Icon = Cloud;
  } else {
    tone = "success";
    label = "Senkron";
    Icon = CheckCircle2;
  }

  const STYLES: Record<string, string> = {
    success: "text-receivable bg-receivable-soft dark:bg-receivable-softdark",
    danger: "text-payable bg-payable-soft dark:bg-payable-softdark",
    warning: "text-amber bg-amber-soft dark:bg-amber-softdark",
    brand: "text-brand bg-brand-50 dark:bg-brand/15",
    neutral: "text-muted bg-surface-2",
  };

  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={label}
      aria-label={`Bulut durumu: ${label}`}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-xs font-bold transition-all duration-200",
        onClick && "hover:border-brand/30 active:scale-95",
        STYLES[tone],
        className,
      )}
    >
      <Icon className={cn("h-4 w-4", status === "syncing" && "animate-spin")} aria-hidden />
      {!iconOnly ? <span className="whitespace-nowrap">{label}</span> : null}
    </Comp>
  );
}
