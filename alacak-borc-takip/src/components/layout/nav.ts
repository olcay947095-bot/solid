import { BarChart3, LayoutDashboard, TrendingDown, TrendingUp, Users } from "lucide-react";
import type { TxType } from "@/types";

export type View = "dashboard" | "ledger" | "contacts" | "reports";

export interface NavItem {
  key: string;
  label: string;
  /** Alt navigasyon için kısa etiket. */
  shortLabel: string;
  icon: typeof LayoutDashboard;
  view: View;
  type?: "all" | TxType;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Genel Bakış", shortLabel: "Özet", icon: LayoutDashboard, view: "dashboard" },
  {
    key: "ledger-receivable",
    label: "Alacaklar",
    shortLabel: "Alacaklar",
    icon: TrendingUp,
    view: "ledger",
    type: "receivable",
  },
  {
    key: "ledger-payable",
    label: "Borçlar",
    shortLabel: "Borçlar",
    icon: TrendingDown,
    view: "ledger",
    type: "payable",
  },
  { key: "contacts", label: "Kişiler / Cariler", shortLabel: "Cariler", icon: Users, view: "contacts" },
  { key: "reports", label: "Raporlar", shortLabel: "Raporlar", icon: BarChart3, view: "reports" },
];

/** Mobil alt navigasyon (4 öğe + ortada hızlı ekle). */
export const BOTTOM_NAV: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
];

export const VIEW_TITLES: Record<View, string> = {
  dashboard: "Genel Bakış",
  ledger: "İşlemler",
  contacts: "Kişiler / Cariler",
  reports: "Raporlar",
};

/** Aktif menü öğesini bulur. */
export function isNavActive(item: NavItem, view: View, type: "all" | TxType): boolean {
  if (item.view !== view) return false;
  if (item.view === "ledger") return (item.type ?? "all") === type;
  return true;
}
