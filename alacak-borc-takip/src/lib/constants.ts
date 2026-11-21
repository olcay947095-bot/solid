import type { AccentId, TxStatus, WallpaperId } from "@/types";

/** Kurumsal marka kimliği — Eczane. */
export const BRAND = {
  name: "SERHAT",
  suffix: "Eczanesi",
  full: "Serhat Eczanesi",
  tagline: "Alacak & Borç Takip",
} as const;

/** Durum etiketleri ve rozet tonları. */
export const STATUS_META: Record<
  TxStatus,
  { label: string; tone: "success" | "danger" | "warning" | "neutral" | "brand" }
> = {
  paid: { label: "Ödendi", tone: "success" },
  pending: { label: "Bekliyor", tone: "neutral" },
  overdue: { label: "Gecikmiş", tone: "danger" },
  partial: { label: "Kısmi Ödeme", tone: "warning" },
};

/** İşlem kategorileri. */
export const CATEGORIES: string[] = [
  "Genel",
  "Satış",
  "Hizmet",
  "Tedarik",
  "Fatura",
  "Kira",
  "Kredi",
  "Maaş",
  "Vergi",
  "Diğer",
];

/** Durum filtresi seçenekleri. */
export const STATUS_FILTERS: { value: TxStatus | "all"; label: string }[] = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "pending", label: "Bekliyor" },
  { value: "partial", label: "Kısmi Ödeme" },
  { value: "overdue", label: "Gecikmiş" },
  { value: "paid", label: "Ödendi" },
];

export type SortOption = "due-asc" | "due-desc" | "amount-desc" | "amount-asc" | "recent";

/** Sıralama seçenekleri. */
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "due-asc", label: "Vade (En Yakın)" },
  { value: "due-desc", label: "Vade (En Uzak)" },
  { value: "amount-desc", label: "Tutar (Yüksek → Düşük)" },
  { value: "amount-asc", label: "Tutar (Düşük → Yüksek)" },
  { value: "recent", label: "En Yeni Kayıt" },
];

/** Marka aksan paletleri. `swatch` duvar kağıdı ve aksan seçicide kullanılır. */
export const ACCENT_OPTIONS: { value: AccentId; label: string; swatch: string }[] = [
  { value: "green", label: "Eczane Yeşili", swatch: "#059669" },
  { value: "indigo", label: "İndigo", swatch: "#4F46E5" },
  { value: "emerald", label: "Zümrüt", swatch: "#10B981" },
  { value: "gold", label: "Altın", swatch: "#C9A227" },
  { value: "cyan", label: "Camgöbeği", swatch: "#0EA5E9" },
];

/** Hareketli duvar kağıdı seçenekleri. */
export const WALLPAPER_OPTIONS: { value: WallpaperId; label: string; hint: string }[] = [
  { value: "aurora", label: "Aurora", hint: "Akışkan ışık dalgaları" },
  { value: "mesh", label: "Mesh", hint: "Renkli gradyan geçişleri" },
  { value: "starfield", label: "Yıldız Alanı", hint: "Parıldayan yıldızlar" },
  { value: "grid", label: "Grid", hint: "Perspektif ızgara" },
  { value: "solid", label: "Sade", hint: "Sabit degrade zemin" },
];

/** Otomatik yedekleme aralıkları (dakika). */
export const BACKUP_INTERVALS: number[] = [5, 15, 30, 60, 180];

/** Yedek dosyasının Google Drive'daki adı (appDataFolder). */
export const BACKUP_FILE_NAME = "alacak-borc-yedek.json";

/** Sadece uygulamanın gizli appDataFolder'ına erişim izni. */
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
