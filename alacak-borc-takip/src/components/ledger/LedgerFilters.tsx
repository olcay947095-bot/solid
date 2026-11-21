import { useMemo } from "react";
import type { Filters } from "@/types";
import { CATEGORIES, STATUS_FILTERS, SORT_OPTIONS } from "@/lib/constants";
import { Field, Input, Select } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { Printer, SlidersHorizontal, X } from "lucide-react";
import type { SortOption } from "@/lib/constants";

const TYPE_OPTIONS = [
  { value: "all" as const, label: "Tümü" },
  { value: "receivable" as const, label: "Alacaklar" },
  { value: "payable" as const, label: "Borçlar" },
];

export function LedgerFilters({
  filters,
  onChange,
  onReset,
  sort,
  onSortChange,
  resultCount,
  onExportPdf,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  resultCount: number;
  /** Listelenen kayıtları PDF rapor olarak dışa aktarır. */
  onExportPdf?: () => void;
}) {
  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.status !== "all") n++;
    if (filters.category !== "all") n++;
    if (filters.from) n++;
    if (filters.to) n++;
    return n;
  }, [filters]);

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented options={TYPE_OPTIONS} value={filters.type} onChange={(v) => onChange({ type: v })} />
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {resultCount} kayıt
          {activeCount > 0 ? <span className="text-brand">• {activeCount} filtre aktif</span> : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onExportPdf ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="h-3.5 w-3.5" />}
              onClick={onExportPdf}
            >
              PDF Rapor
            </Button>
          ) : null}
          {activeCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X className="h-3.5 w-3.5" />}
              onClick={onReset}
            >
              Temizle
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Field label="Durum">
          <Select value={filters.status} onChange={(e) => onChange({ status: e.target.value as Filters["status"] })}>
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Kategori">
          <Select value={filters.category} onChange={(e) => onChange({ category: e.target.value })}>
            <option value="all">Tüm Kategoriler</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Başlangıç (Vade)">
          <Input type="date" value={filters.from} onChange={(e) => onChange({ from: e.target.value })} />
        </Field>

        <Field label="Bitiş (Vade)">
          <Input type="date" value={filters.to} onChange={(e) => onChange({ to: e.target.value })} />
        </Field>

        <Field label="Sıralama">
          <Select value={sort} onChange={(e) => onSortChange(e.target.value as SortOption)}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}
