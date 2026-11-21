import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "danger" | "warning" | "neutral" | "brand";

const TONES: Record<BadgeTone, string> = {
  success:
    "bg-receivable-soft text-receivable-dark dark:bg-receivable-softdark dark:text-receivable",
  danger: "bg-payable-soft text-payable-dark dark:bg-payable-softdark dark:text-payable",
  warning: "bg-amber-soft text-amber dark:bg-amber-softdark dark:text-amber",
  neutral: "bg-surface-2 text-muted",
  brand: "bg-brand-50 text-brand dark:bg-brand/15 dark:text-brand-100",
};

export function Badge({
  tone = "neutral",
  children,
  icon,
  className,
  dot,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : icon}
      {children}
    </span>
  );
}
