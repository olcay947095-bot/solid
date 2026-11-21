import { Moon, Plus, Search, Settings, Sun } from "lucide-react";
import type { Currency } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { CloudStatusChip } from "@/components/backup/CloudStatusChip";
import { Logo } from "@/components/brand/Logo";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { VIEW_TITLES, type View } from "@/components/layout/nav";

interface TopHeaderProps {
  view: View;
  search: string;
  onSearchChange: (value: string) => void;
  onNewTransaction: () => void;
  onOpenSettings: () => void;
}

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "TRY", label: "₺" },
  { value: "USD", label: "$" },
  { value: "EUR", label: "€" },
];

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted transition-all duration-200 hover:text-ink active:scale-95"
    >
      {children}
    </button>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useLedger();
  return (
    <IconButton
      label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      onClick={toggleTheme}
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </IconButton>
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

export function TopHeader({
  view,
  search,
  onSearchChange,
  onNewTransaction,
  onOpenSettings,
}: TopHeaderProps) {
  const { displayCurrency, setDisplayCurrency } = useLedger();

  return (
    <header className="no-print safe-top glass sticky top-0 z-30 border-b border-line">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/25 to-transparent dark:via-gold/35"
      />
      {/* Mobil marka letterhead */}
      <div className="flex flex-col items-center gap-1.5 px-4 pb-2.5 pt-3 lg:hidden">
        <Logo size={34} />
        <div className="text-center">
          <p className="text-[13.5px] font-extrabold leading-none tracking-[0.01em] text-ink">
            {BRAND.name} <span className="font-semibold text-brand">{BRAND.suffix}</span>
          </p>
          <span className="mx-auto mt-1.5 block h-[3px] w-9 rounded-full bg-gradient-to-r from-brand to-gold" />
        </div>
      </div>
      {/* Mobil bölüm başlığı + kontrol satırı */}
      <div className="flex items-center gap-3 px-4 pb-1.5 lg:hidden">
        <p className="min-w-0 flex-1 truncate text-[15px] font-extrabold leading-tight text-ink">
          {VIEW_TITLES[view]}
        </p>
        <Segmented
          size="sm"
          options={CURRENCY_OPTIONS}
          value={displayCurrency}
          onChange={(c) => setDisplayCurrency(c)}
        />
        <ThemeToggle />
      </div>
      {/* Mobil arama satırı */}
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-2 lg:hidden">
        <SearchInput value={search} onChange={onSearchChange} className="flex-1" />
        <CloudStatusChip iconOnly onClick={onOpenSettings} />
        <IconButton label="Ayarlar" onClick={onOpenSettings}>
          <Settings className="h-[18px] w-[18px]" />
        </IconButton>
      </div>

      {/* Masaüstü satır */}
      <div className="hidden h-[68px] items-center gap-3 px-6 lg:flex">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold text-ink">{VIEW_TITLES[view]}</h1>
          <p className="truncate text-xs text-muted">Alacak ve borç hareketlerinizin genel görünümü</p>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <SearchInput value={search} onChange={onSearchChange} className="w-[240px] xl:w-[300px]" />
          <Segmented
            options={CURRENCY_OPTIONS}
            value={displayCurrency}
            onChange={(c) => setDisplayCurrency(c)}
          />
          <CloudStatusChip className="hidden xl:inline-flex" onClick={onOpenSettings} />
          <CloudStatusChip iconOnly className="xl:hidden" onClick={onOpenSettings} />
          <ThemeToggle />
          <IconButton label="Ayarlar" onClick={onOpenSettings}>
            <Settings className="h-[18px] w-[18px]" />
          </IconButton>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={onNewTransaction}>
            Yeni İşlem
          </Button>
        </div>
      </div>
    </header>
  );
}
