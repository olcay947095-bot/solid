import { cn } from "@/lib/utils";

const TONES = {
  success: "bg-receivable",
  danger: "bg-payable",
  warning: "bg-amber",
  brand: "bg-brand",
};

export function ProgressBar({
  value,
  tone = "brand",
  className,
  height = "h-2",
}: {
  /** 0..1 arası oran. */
  value: number;
  tone?: keyof typeof TONES;
  className?: string;
  height?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-surface-3", height, className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", TONES[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
