import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} />;
}

/** Özet kartları için iskelet. */
export function KpiSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-7 w-2/3" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}

/** Liste satırı iskeleti. */
export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
      <Skeleton className="h-11 w-11 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="mt-2 h-3 w-1/4" />
      </div>
      <Skeleton className="h-6 w-20 rounded-lg" />
    </div>
  );
}
