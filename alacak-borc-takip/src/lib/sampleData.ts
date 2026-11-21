import type { Currency, Installment, Payment, Transaction, TxType } from "@/types";
import { uid } from "@/lib/utils";
import { addDays, addMonths, todayISO } from "@/lib/format";

function round2(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

/** Tutarı eşit (son taksit farkı toplayan) bir taksit planına böler. */
export function makeInstallments(amount: number, count: number, dueDate: string): Installment[] {
  const total = Math.max(0, Number.isFinite(amount) ? amount : 0);
  const parts = Math.max(1, Math.floor(count || 1));

  if (parts === 1) {
    return [{ id: uid("ins"), no: 1, dueDate, amount: round2(total) }];
  }

  const base = Math.floor((total / parts) * 100) / 100;
  const installments: Installment[] = [];
  let assigned = 0;

  for (let index = 0; index < parts; index += 1) {
    const isLast = index === parts - 1;
    const value = round2(isLast ? total - assigned : base);
    assigned = round2(assigned + value);
    installments.push({
      id: uid("ins"),
      no: index + 1,
      dueDate: addMonths(dueDate, index),
      amount: value,
    });
  }

  return installments;
}

interface SampleInput {
  type: TxType;
  name: string;
  phone?: string;
  amount: number;
  currency?: Currency;
  issue: string;
  due: string;
  category: string;
  description?: string;
  installmentsCount?: number;
  payments?: { amount: number; date: string; note?: string }[];
}

function sample(input: SampleInput): Transaction {
  const currency = input.currency ?? "TRY";
  const count = input.installmentsCount ?? 1;
  const payments: Payment[] = (input.payments ?? []).map((payment) => ({
    id: uid("pay"),
    amount: payment.amount,
    date: payment.date,
    note: payment.note,
  }));
  const created = input.issue <= todayISO() ? input.issue : todayISO();
  return {
    id: uid("tx"),
    type: input.type,
    contactName: input.name,
    contactPhone: input.phone,
    amount: input.amount,
    currency,
    issueDate: input.issue,
    dueDate: input.due,
    category: input.category,
    description: input.description,
    payments,
    installments: makeInstallments(input.amount, count, input.due),
    createdAt: `${created}T09:00:00.000Z`,
    updatedAt: `${created}T09:00:00.000Z`,
  };
}

/** İlk kullanım ve demo için gerçekçi örnek kayıtlar üretir. */
export function createSampleTransactions(): Transaction[] {
  const today = todayISO();

  return [
    sample({
      type: "payable",
      name: "ABC Lojistik Ltd.",
      phone: "0212 555 44 33",
      amount: 22000,
      issue: addDays(today, -60),
      due: addDays(today, -15),
      category: "Fatura",
      description: "Nakliye faturası (4 taksit)",
      installmentsCount: 4,
      payments: [
        { amount: 5500, date: addDays(today, -50), note: "Havale" },
        { amount: 5500, date: addDays(today, -22), note: "Havale" },
      ],
    }),
    sample({
      type: "receivable",
      name: "Ayşe Demir",
      phone: "0532 111 22 33",
      amount: 8400,
      issue: addDays(today, -40),
      due: addDays(today, -5),
      category: "Hizmet",
      description: "Web sitesi tasarımı",
      installmentsCount: 3,
      payments: [{ amount: 2800, date: addDays(today, -30), note: "İlk ödeme" }],
    }),
    sample({
      type: "payable",
      name: "Deniz Teknoloji A.Ş.",
      phone: "0216 444 55 66",
      amount: 2500,
      currency: "EUR",
      issue: addDays(today, -35),
      due: addDays(today, -8),
      category: "Tedarik",
      description: "Yazılım lisansı yenileme",
      installmentsCount: 2,
      payments: [{ amount: 1250, date: addDays(today, -18), note: "Kısmi ödeme" }],
    }),
    sample({
      type: "receivable",
      name: "Fatma Öztürk",
      phone: "0542 333 44 55",
      amount: 9000,
      issue: addDays(today, -55),
      due: addDays(today, -30),
      category: "Satış",
      description: "Toptan ürün satışı",
      installmentsCount: 2,
      payments: [
        { amount: 4500, date: addDays(today, -50), note: "Nakit" },
        { amount: 4500, date: addDays(today, -32), note: "Nakit" },
      ],
    }),
    sample({
      type: "receivable",
      name: "Mehmet Kaya",
      phone: "0533 222 33 44",
      amount: 4500,
      issue: addDays(today, -20),
      due: addDays(today, 3),
      category: "Satış",
      description: "Perakende sipariş",
    }),
    sample({
      type: "receivable",
      name: "Selin Arslan",
      phone: "0555 666 77 88",
      amount: 3200,
      issue: addDays(today, -6),
      due: addDays(today, 7),
      category: "Satış",
      description: "Aylık abonelik tahsilatı",
    }),
    sample({
      type: "payable",
      name: "Emre Aydın",
      amount: 15000,
      issue: addDays(today, -12),
      due: addDays(today, 12),
      category: "Tedarik",
      description: "Ofis mobilyası alımı",
      installmentsCount: 2,
    }),
    sample({
      type: "receivable",
      name: "Zeynep Şahin",
      phone: "0537 888 99 00",
      amount: 1200,
      currency: "USD",
      issue: addDays(today, -8),
      due: addDays(today, 20),
      category: "Hizmet",
      description: "Danışmanlık ücreti",
    }),
    sample({
      type: "payable",
      name: "Burak Yıldız",
      amount: 6750,
      issue: addDays(today, -4),
      due: addDays(today, 45),
      category: "Kira",
      description: "Depo kirası (3 taksit)",
      installmentsCount: 3,
    }),
    sample({
      type: "receivable",
      name: "Hasan Çelik",
      phone: "0530 123 45 67",
      amount: 5600,
      issue: today,
      due: addDays(today, 90),
      category: "Hizmet",
      description: "Bakım anlaşması (4 taksit)",
      installmentsCount: 4,
    }),
  ];
}
