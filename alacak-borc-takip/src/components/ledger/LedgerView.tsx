import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Inbox, ListChecks, Scale, SearchX } from "lucide-react";
import type { Filters, LedgerRow, TxStatus, TxType } from "@/types";
import { STATUS_META, type SortOption } from "@/lib/constants";
import { useLedger } from "@/store/LedgerProvider";
import { useToast } from "@/store/ToastProvider";
import { exportReportPdf } from "@/lib/report";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { LedgerFilters } from "@/components/ledger/LedgerFilters";
import { TransactionTable, type RowActionsProps } from "@/components/ledger/TransactionTable";
import { TransactionCard } from "@/components/ledger/TransactionCard";

const DEFAULT_FILTERS: Filters = {
  type: "all",
  status: "all",
  from: "",
  to: "",
  search: "",
  category: "all",
};

const TYPE_LABEL: Record<"all" | TxType, string> = {
  all: "Tümü",
  receivable: "Alacaklar",
  payable: "Borçlar",
};

export function LedgerView({
  type,
  onTypeChange,
  search,
  actions,
  onNew,
  presetStatus,
}: {
  type: "all" | TxType;
  onTypeChange: (t: "all" | TxType) => void;
  search: string;
  actions: RowActionsProps;
  onNew: () => void;
  presetStatus?: TxStatus | "all";
}) {
  const { rows, transactions, displayCurrency, loading } = useLedger();
  const toast = useToast();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("due-asc");

  useEffect(() => {
    if (presetStatus && presetStatus !== "all") {
      setFilters((f) => ({ ...f, status: presetStatus }));
    }
  }, [presetStatus]);

  const reset = () => setFilters(DEFAULT_FILTERS);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr");
    const list = rows.filter((r) => {
      if (type !== "all" && r.tx.type !== type) return false;
      if (filters.status !== "all" && r.status !== filters.status) return false;
      if (filters.category !== "all" && r.tx.category !== filters.category) return false;
      if (filters.from && r.tx.dueDate < filters.from) return false;
      if (filters.to && r.tx.dueDate > filters.to) return false;
      if (query) {
        const haystack = `${r.tx.contactName} ${r.tx.description ?? ""} ${r.tx.category} ${r.tx.contactPhone ?? ""}`.toLocaleLowerCase("tr");
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "due-asc":
          return a.nextDueDate < b.nextDueDate ? -1 : 1;
        case "due-desc":
          return a.nextDueDate > b.nextDueDate ? -1 : 1;
        case "amount-desc":
          return b.total - a.total;
        case "amount-asc":
          return a.total - b.total;
        case "recent":
          return b.tx.createdAt.localeCompare(a.tx.createdAt);
        default:
          return 0;
      }
    });
    return sorted;
  }, [rows, type, filters, search, sort]);

  const summary = useMemo(() => {
    let receivable = 0;
    let payable = 0;
    for (const r of filtered) {
      if (r.tx.type === "receivable") receivable += r.remaining;
      else payable += r.remaining;
    }
    return { receivable, payable };
  }, [filtered]);

  const isFiltered =
    type !== "all" ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    !!filters.from ||
    !!filters.to ||
    !!search.trim();

  const trimmedSearch = search.trim();
  const handlePdf = () => {
    if (filtered.length === 0) {
      toast.warning("Raporlanacak kayıt yok", "Lütfen filtreleri değiştirin.");
      return;
    }
    const ok = exportReportPdf({
      rows: filtered,
      scope: "all",
      from: filters.from,
      to: filters.to,
      typeLabel: TYPE_LABEL[type],
      statusLabel: filters.status !== "all" ? STATUS_META[filters.status].label : undefined,
      categoryLabel: filters.category !== "all" ? filters.category : undefined,
      searchLabel: trimmedSearch || undefined,
      displayCurrency,
    });
    if (ok) {
      toast.success("Rapor hazırlandı", "Açılan pencereden “PDF olarak kaydet” seçebilirsiniz.");
    } else {
      toast.error("Pencere açılamadı", "Tarayıcınız açılır pencereyi engellemiş olabilir.");
    }
  };

  return (
    <div className="space-y-4">
      <LedgerFilters
        filters={{ ...filters, type }}
        onChange={(patch) => {
          if (patch.type !== undefined) onTypeChange(patch.type);
          const rest = { ...patch };
          delete rest.type;
          setFilters((f) => ({ ...f, ...rest }));
        }}
        onReset={reset}
        sort={sort}
        onSortChange={setSort}
        resultCount={filtered.length}
        onExportPdf={handlePdf}
      />

      {/* Özet şeritleri */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile
          label="Listelenen Alacak"
          value={formatCurrency(summary.receivable, displayCurrency)}
          tone="success"
          icon={<ArrowDownRight className="h-4 w-4" />}
        />
        <SummaryTile
          label="Listelenen Borç"
          value={formatCurrency(summary.payable, displayCurrency)}
          tone="danger"
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <SummaryTile
          label="Net (Liste)"
          value={formatCurrency(summary.receivable - summary.payable, displayCurrency)}
          tone="brand"
          icon={<Scale className="h-4 w-4" />}
        />
        <SummaryTile
          label="Kayıt Sayısı"
          value={String(filtered.length)}
          tone="neutral"
          icon={<ListChecks className="h-4 w-4" />}
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="Henüz işlem yok"
            description="İlk alacak veya borç kaydınızı oluşturarak takibe başlayın."
            action={<Button variant="primary" onClick={onNew}>Yeni İşlem Ekle</Button>}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="Sonuç bulunamadı"
            description="Arama veya filtre kriterlerine uyan bir kayıt yok."
            action={
              <Button variant="secondary" onClick={reset}>
                Filtreleri Temizle
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="hidden card overflow-hidden lg:block">
            <TransactionTable rows={filtered} displayCurrency={displayCurrency} actions={actions} />
          </div>
          <div className="space-y-3 lg:hidden">
            {filtered.map((row: LedgerRow) => (
              <TransactionCard
                key={row.tx.id}
                row={row}
                displayCurrency={displayCurrency}
                actions={actions}
              />
            ))}
          </div>
        </>
      )}

      {!loading && filtered.length > 0 ? (
        <p className="px-1 text-center text-xs text-faint lg:hidden">
          {isFiltered ? `${filtered.length} kayıt gösteriliyor` : `${filtered.length} kayıt`} · yukarı kaydırın
        </p>
      ) : null}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "brand" | "neutral";
  icon: ReactNode;
}) {
  const styles = {
    success: {
      color: "text-receivable",
      chip: "bg-receivable-soft text-receivable dark:bg-receivable-softdark dark:text-receivable",
    },
    danger: {
      color: "text-payable",
      chip: "bg-payable-soft text-payable dark:bg-payable-softdark dark:text-payable",
    },
    brand: {
      color: "text-brand",
      chip: "bg-brand-50 text-brand dark:bg-brand/15 dark:text-brand-100",
    },
    neutral: {
      color: "text-ink",
      chip: "bg-surface-2 text-muted",
    },
  }[tone];
  return (
    <div className="card relative overflow-hidden px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-semibold text-muted">{label}</p>
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", styles.chip)}>
          {icon}
        </span>
      </div>
      <p className={cn("tnum mt-1 truncate text-base font-extrabold", styles.color)}>{value}</p>
    </div>
  );
}
