import type { Currency } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";

export interface ReminderInput {
  contactName: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  description?: string;
}

/** WhatsApp hatırlatma mesajı metnini üretir. */
export function buildReminderMessage({
  contactName,
  amount,
  currency,
  dueDate,
  description,
}: ReminderInput): string {
  const lines = [
    `Merhaba ${contactName},`,
    "",
    description
      ? `"${description}" kaydınız için hatırlatma:`
      : "Hesabınızda bekleyen bir bakiyeniz bulunmaktadır:",
    `Tutar: ${formatCurrency(amount, currency)}`,
    `Vade: ${formatDate(dueDate)}`,
    "",
    "Bilginize sunarım. Teşekkürler.",
  ];
  return lines.join("\n");
}

/** Telefon numarasını wa.me için uluslararası biçime (yalnız rakam) çevirir. */
export function normalizePhone(phone?: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10) digits = `90${digits}`;
  return digits.length >= 10 ? digits : null;
}

/**
 * WhatsApp'ı hazır mesajla açar. Numara varsa doğrudan kişiye,
 * yoksa WhatsApp'ın kişi seçim ekranına yönlendirir. Numara geçerliyse true döner.
 */
export function openWhatsApp(phone: string | undefined, message: string): boolean {
  const digits = normalizePhone(phone);
  const text = encodeURIComponent(message);
  const url = digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, "_blank");
  return Boolean(digits);
}
