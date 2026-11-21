import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BUTTON =
  "flex h-9 items-center justify-center gap-1 rounded-xl border border-line bg-surface px-2.5 text-xs font-semibold text-muted transition-all hover:text-ink active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";

/** Kayıt listeleri için kompakt sayfalayıcı — tek sayfada gizlenir. */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="tnum text-xs text-faint">
        <span className="font-semibold text-ink">
          {start}–{end}
        </span>{" "}
        / {total} kayıt
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={BUTTON}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="h-4 w-4" />
          Önceki
        </button>
        <span className="tnum px-1.5 text-xs font-bold text-ink">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          className={BUTTON}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Sonraki sayfa"
        >
          Sonraki
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
