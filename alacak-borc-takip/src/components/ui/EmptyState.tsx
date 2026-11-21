import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className ?? ""}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-faint">
        {icon}
      </div>
      <h3 className="mt-4 text-[15px] font-bold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-xs text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
