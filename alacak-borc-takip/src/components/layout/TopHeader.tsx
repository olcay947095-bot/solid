import { Moon, Plus, Search, Sun, Wallet } from "lucide-react";
import type { Currency } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { cn } from "@/lib/utils";
import { VIEW_TITLES, type View } from "@/components/layout/nav";

interface TopHeaderProps {
  view: View;
  search: string;
  onSearchChange: (value: string) => void;
  onNewTransaction: () => void;
}

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "TRY", label: "₺" },
  { value: "USD", label: "$" },
  { value: "EUR", label: "€" },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useLedger();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted transition-all duration-200 hover:text-ink active:scale-95"
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

function SearchInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Kişi, firma veya açıklama ara..."
        className="h-10 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-faint transition-colors focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

export function TopHeader({ view, search, onSearchChange, onNewTransaction }: TopHeaderProps) {
  const { displayCurrency, setDisplayCurrency } = useLedger();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
      {/* Mobil üst satır */}
      <div className="flex items-center gap-3 px-4 pt-3 lg:hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand text-white shadow-sm">
          <Wallet className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold leading-tight text-ink">
            {VIEW_TITLES[view] === "İşlemler" ? "Alacak & Borç" : VIEW_TITLES[view]}
          </p>
          <p className="truncate text-[11px] font-medium text-muted">Takip Paneli</p>
        </div>
        <Segmented
          size="sm"
          options={CURRENCY_OPTIONS}
          value={displayCurrency}
          onChange={(c) => setDisplayCurrency(c)}
        />
        <ThemeToggle />
      </div>
      <div className="px-4 pb-3 pt-2.5 lg:hidden">
        <SearchInput value={search} onChange={onSearchChange} />
      </div>

      {/* Masaüstü satır */}
      <div className="hidden h-[68px] items-center gap-4 px-6 lg:flex">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold text-ink">{VIEW_TITLES[view]}</h1>
          <p className="truncate text-xs text-muted">Alacak ve borç hareketlerinizin genel görünümü</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <SearchInput value={search} onChange={onSearchChange} className="w-[300px]" />
          <Segmented
            options={CURRENCY_OPTIONS}
            value={displayCurrency}
            onChange={(c) => setDisplayCurrency(c)}
          />
          <ThemeToggle />
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={onNewTransaction}>
            Yeni İşlem
          </Button>
        </div>
      </div>
    </header>
  );
}
