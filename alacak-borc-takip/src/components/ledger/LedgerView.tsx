import { useEffect, useMemo, useState } from "react";
import { Inbox, SearchX } from "lucide-react";
import type { Filters, LedgerRow, TxStatus, TxType } from "@/types";
import type { SortOption } from "@/lib/constants";
import { useLedger } from "@/store/LedgerProvider";
import { formatCurrency } from "@/lib/format";
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
      />

      {/* Özet şeritleri */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile label="Listelenen Alacak" value={formatCurrency(summary.receivable, displayCurrency)} tone="success" />
        <SummaryTile label="Listelenen Borç" value={formatCurrency(summary.payable, displayCurrency)} tone="danger" />
        <SummaryTile
          label="Net (Liste)"
          value={formatCurrency(summary.receivable - summary.payable, displayCurrency)}
          tone="brand"
        />
        <SummaryTile label="Kayıt Sayısı" value={String(filtered.length)} tone="neutral" />
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
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "brand" | "neutral";
}) {
  const color =
    tone === "success"
      ? "text-receivable"
      : tone === "danger"
        ? "text-payable"
        : tone === "brand"
          ? "text-brand"
          : "text-ink";
  return (
    <div className="card px-4 py-3">
      <p className="truncate text-[11px] font-semibold text-muted">{label}</p>
      <p className={`tnum mt-1 truncate text-base font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
