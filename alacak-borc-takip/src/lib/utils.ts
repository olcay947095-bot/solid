import type { Currency } from "@/types";

/** Koşullu sınıf adlarını birleştirir. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Kısa, çakışmasız bir kimlik üretir. */
export function uid(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

/** İsimden baş harfleri üretir (en fazla iki harf). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase("tr-TR");
}

const GRADIENTS: [string, string][] = [
  ["#4F46E5", "#7C3AED"],
  ["#10B981", "#059669"],
  ["#F59E0B", "#F97316"],
  ["#EF4444", "#DB2777"],
  ["#0EA5E9", "#6366F1"],
  ["#14B8A6", "#0D9488"],
  ["#8B5CF6", "#EC4899"],
  ["#C9A227", "#E8C766"],
];

/** İsimden deterministik bir avatar gradyanı üretir. */
export function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const [a, b] = GRADIENTS[hash % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

/** Para birimi simgesini döndürür. */
export function currencySymbol(currency: Currency): string {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    default:
      return "₺";
  }
}
