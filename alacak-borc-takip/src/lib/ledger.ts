import type { Currency, LedgerRow, Rates, Transaction, TxStatus, TxType } from "@/types";
import { diffDays, todayISO } from "@/lib/format";

/** İşlem türü insan okunur etiketleri. */
export const TX_TYPE_LABEL: Record<TxType, string> = {
  receivable: "Alacak",
  payable: "Borç",
};

/** Varsayılan döviz kurları (1 birim = kaç TRY) — ayarlardan güncellenir. */
export const DEFAULT_RATES: Rates = { TRY: 1, USD: 34, EUR: 37 };

/** Tutarı bir para biriminden diğerine verilen kurla çevirir. */
export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  rates: Rates = DEFAULT_RATES,
): number {
  if (from === to) return amount;
  return (amount * rates[from]) / rates[to];
}

/** Kayıt için toplam tahsil/ödeme tutarı (kendi para biriminde). */
export function totalPaid(tx: Transaction): number {
  return tx.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

/** Kayıt için kalan tutar (kendi para biriminde). */
export function remainingAmount(tx: Transaction): number {
  return Math.max(0, tx.amount - totalPaid(tx));
}

/** Ödeme ilerleme oranı (0–1). */
export function progressRatio(tx: Transaction): number {
  if (tx.amount <= 0) return 0;
  return Math.min(1, Math.max(0, totalPaid(tx) / tx.amount));
}

/** Kaydın kalanına göre çıkarılan durum. */
export function deriveStatus(tx: Transaction): TxStatus {
  if (remainingAmount(tx) <= 0.01) return "paid";
  if (nextDueDate(tx) < todayISO()) return "overdue";
  if (totalPaid(tx) > 0.01) return "partial";
  return "pending";
}

/** Vade yakınlık kademesi — gecikmiş / vade yakın / normal. */
export type DueSeverity = "overdue" | "soon" | "normal";

/** Ödenmemiş kaydın vadesini kademelendirir (<=7 gün "vade yakın"). */
export function dueSeverity(nextDue: string, status: TxStatus): DueSeverity {
  if (status === "paid") return "normal";
  const days = diffDays(todayISO(), nextDue);
  if (days < 0) return "overdue";
  return days <= 7 ? "soon" : "normal";
}

/** Ödenmemiş ilk taksitin vadesi; yoksa kaydın vadesi. */
export function nextDueDate(tx: Transaction): string {
  const installments = [...tx.installments].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  if (installments.length === 0) return tx.dueDate;
  const paid = totalPaid(tx);
  let cumulative = 0;
  for (const installment of installments) {
    cumulative += installment.amount;
    if (paid < cumulative - 0.01) return installment.dueDate;
  }
  return installments[installments.length - 1].dueDate;
}

/** Kaydı gösterim para birimine çevirip türetilmiş satıra dönüştürür. */
export function buildRow(tx: Transaction, displayCurrency: Currency, rates?: Rates): LedgerRow {
  const total = convert(tx.amount, tx.currency, displayCurrency, rates);
  const paid = convert(totalPaid(tx), tx.currency, displayCurrency, rates);
  const remaining = Math.max(0, total - paid);
  return {
    tx,
    total,
    paid,
    remaining,
    status: deriveStatus(tx),
    nextDueDate: nextDueDate(tx),
  };
}

/** Kayıt listesini türetilmiş satırlara dönüştürür. */
export function buildRows(
  transactions: Transaction[],
  displayCurrency: Currency,
  rates?: Rates,
): LedgerRow[] {
  return transactions.map((tx) => buildRow(tx, displayCurrency, rates));
}

export interface Kpis {
  net: number;
  receivable: number;
  payable: number;
  overdue: number;
  receivableCount: number;
  payableCount: number;
  overdueCount: number;
}

/** Açık işlemlerden özet göstergeleri hesaplar. */
export function computeKpis(rows: LedgerRow[]): Kpis {
  let receivable = 0;
  let payable = 0;
  let overdue = 0;
  let receivableCount = 0;
  let payableCount = 0;
  let overdueCount = 0;

  for (const row of rows) {
    if (row.status === "paid") continue;
    if (row.tx.type === "receivable") {
      receivable += row.remaining;
      receivableCount += 1;
    } else {
      payable += row.remaining;
      payableCount += 1;
    }
    if (row.status === "overdue") {
      overdue += row.remaining;
      overdueCount += 1;
    }
  }

  return {
    net: receivable - payable,
    receivable,
    payable,
    overdue,
    receivableCount,
    payableCount,
    overdueCount,
  };
}

export interface CashFlowPoint {
  key: string;
  label: string;
  alacak: number;
  borc: number;
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("tr-TR") + value.slice(1);
}

/** Vade bazlı aylık nakit akışı (son `months` ay, mevcut ay dahil). */
export function monthlyCashFlow(
  transactions: Transaction[],
  displayCurrency: Currency,
  months = 6,
  rates?: Rates,
): CashFlowPoint[] {
  const now = new Date();
  const monthFormatter = new Intl.DateTimeFormat("tr-TR", { month: "short" });
  const points: CashFlowPoint[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    points.push({ key, label: capitalize(monthFormatter.format(date)), alacak: 0, borc: 0 });
  }

  const byKey = new Map(points.map((point) => [point.key, point]));

  for (const tx of transactions) {
    const point = byKey.get(tx.dueDate.slice(0, 7));
    if (!point) continue;
    const remaining = convert(remainingAmount(tx), tx.currency, displayCurrency, rates);
    if (tx.type === "receivable") point.alacak += remaining;
    else point.borc += remaining;
  }

  return points;
}

export interface ContactSummary {
  name: string;
  phone?: string;
  receivable: number;
  payable: number;
  net: number;
  count: number;
  overdueCount: number;
}

/** Satırlardan cari bazlı özet üretir. */
export function contactSummaries(rows: LedgerRow[]): ContactSummary[] {
  const map = new Map<string, ContactSummary>();

  for (const row of rows) {
    const name = row.tx.contactName;
    let summary = map.get(name);
    if (!summary) {
      summary = {
        name,
        phone: undefined,
        receivable: 0,
        payable: 0,
        net: 0,
        count: 0,
        overdueCount: 0,
      };
      map.set(name, summary);
    }
    if (!summary.phone && row.tx.contactPhone) summary.phone = row.tx.contactPhone;
    summary.count += 1;
    if (row.status === "overdue") summary.overdueCount += 1;
    if (row.tx.type === "receivable") summary.receivable += row.remaining;
    else summary.payable += row.remaining;
  }

  const summaries = [...map.values()];
  for (const summary of summaries) summary.net = summary.receivable - summary.payable;
  summaries.sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || a.name.localeCompare(b.name, "tr"));
  return summaries;
}
