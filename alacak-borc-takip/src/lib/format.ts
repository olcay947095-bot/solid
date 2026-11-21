import type { Currency } from "@/types";
import { currencySymbol } from "@/lib/utils";

/** "YYYY-MM-DD" dizgesini yerel saat diliminde Date'e çevirir. */
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const currencyFormatters = new Map<Currency, Intl.NumberFormat>();

function currencyFormatter(currency: Currency): Intl.NumberFormat {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter;
}

/** Tutarı para birimi simgesiyle biçimlendirir (örn. ₺1.234,56). */
export function formatCurrency(amount: number, currency: Currency): string {
  return currencyFormatter(currency).format(Number.isFinite(amount) ? amount : 0);
}

/** Tutarı kısa/kompakt biçimde gösterir (örn. ₺1,2 B). */
export function formatCompact(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat("tr-TR", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return `${currencySymbol(currency)}${formatter.format(Number.isFinite(amount) ? amount : 0)}`;
}

/** GG.AA.YYYY biçiminde tarih. */
export function formatDate(date: string): string {
  const d = parseISODate(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Uzun tarih (örn. 21 Kasım 2026). */
export function formatDateLong(date: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISODate(date));
}

/** İki tarih arasındaki tam gün farkı (to - from). */
export function diffDays(from: string, to: string): number {
  const a = parseISODate(from).getTime();
  const b = parseISODate(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Bugünün tarihi (YYYY-MM-DD). */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Tarihe gün ekler (YYYY-MM-DD). */
export function addDays(date: string, days: number): string {
  const d = parseISODate(date);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Tarihe ay ekler; gün taşmasını ayın son gününe sabitler (YYYY-MM-DD). */
export function addMonths(date: string, months: number): string {
  const d = parseISODate(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return toISODate(d);
}

/** Vade için insan okunur etiket (Bugün, Yarın, 3 gün kaldı, 2 gün gecikti...). */
export function dueLabel(date: string): string {
  const days = diffDays(todayISO(), date);
  if (days === 0) return "Bugün";
  if (days === 1) return "Yarın";
  if (days === -1) return "Dün";
  if (days > 1) return `${days} gün kaldı`;
  return `${Math.abs(days)} gün gecikti`;
}
