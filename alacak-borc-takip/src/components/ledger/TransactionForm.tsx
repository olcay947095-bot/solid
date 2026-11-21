import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, Layers } from "lucide-react";
import type { Currency, Transaction, TransactionDraft, TxType } from "@/types";
import { CATEGORIES } from "@/lib/constants";
import { useLedger } from "@/store/LedgerProvider";
import { useToast } from "@/store/ToastProvider";
import { makeInstallments } from "@/lib/sampleData";
import { totalPaid } from "@/lib/ledger";
import { addMonths, formatCurrency, formatDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "TRY", label: "₺ TRY" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
];

const INSTALLMENT_OPTIONS = [
  { value: 1, label: "Tek Çekim" },
  ...Array.from({ length: 11 }, (_, i) => ({ value: i + 2, label: `${i + 2} Taksit` })),
];

interface FormState {
  type: TxType;
  contactName: string;
  contactPhone: string;
  amount: string;
  currency: Currency;
  issueDate: string;
  dueDate: string;
  installmentsCount: number;
  category: string;
  description: string;
}

function emptyForm(): FormState {
  return {
    type: "receivable",
    contactName: "",
    contactPhone: "",
    amount: "",
    currency: "TRY",
    issueDate: todayISO(),
    dueDate: addMonths(todayISO(), 1),
    installmentsCount: 1,
    category: CATEGORIES[0],
    description: "",
  };
}

function fromTransaction(tx: Transaction): FormState {
  return {
    type: tx.type,
    contactName: tx.contactName,
    contactPhone: tx.contactPhone ?? "",
    amount: String(tx.amount).replace(".", ","),
    currency: tx.currency,
    issueDate: tx.issueDate,
    dueDate: tx.dueDate,
    installmentsCount: tx.installments.length || 1,
    category: tx.category,
    description: tx.description ?? "",
  };
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

export function TransactionForm({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: Transaction | null;
  onClose: () => void;
}) {
  const { addTransaction, updateTransaction } = useLedger();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromTransaction(editing) : emptyForm());
    setErrors({});
  }, [open, editing]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const amountValue = parseAmount(form.amount);
  const preview = useMemo(
    () => makeInstallments(amountValue, form.installmentsCount, form.dueDate),
    [amountValue, form.installmentsCount, form.dueDate],
  );

  const isReceivable = form.type === "receivable";
  const editingPaid = editing ? totalPaid(editing) : 0;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.contactName.trim()) next.contactName = "Kişi veya firma adı zorunludur.";
    if (amountValue <= 0) next.amount = "Geçerli bir tutar giriniz.";
    // Kayıtlı ödemelerin altına düşen tutar, ödeme dengesini bozar.
    if (editing && form.currency === editing.currency) {
      const paid = totalPaid(editing);
      if (amountValue > 0 && paid > 0 && amountValue + 0.01 < paid) {
        next.amount = `Girilen tutar, kayıtlı ödemelerden (${formatCurrency(paid, editing.currency)}) düşük olamaz.`;
      }
    }
    if (!form.issueDate) next.issueDate = "İşlem tarihi zorunludur.";
    if (!form.dueDate) next.dueDate = "Vade tarihi zorunludur.";
    if (form.dueDate && form.issueDate && form.dueDate < form.issueDate)
      next.dueDate = "Vade tarihi işlem tarihinden önce olamaz.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!validate()) {
      toast.error("Formu kontrol edin", "Eksik veya hatalı alanlar var.");
      return;
    }
    const draft: TransactionDraft = {
      type: form.type,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      amount: amountValue,
      currency: form.currency,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      category: form.category,
      description: form.description,
      installmentsCount: form.installmentsCount,
    };

    if (editing) {
      updateTransaction(editing.id, draft);
      toast.success("İşlem güncellendi", `${form.contactName} kaydı başarıyla güncellendi.`);
    } else {
      addTransaction(draft);
      toast.success(
        isReceivable ? "Alacak eklendi" : "Borç eklendi",
        `${formatCurrency(amountValue, form.currency)} — ${form.contactName}`,
      );
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "İşlemi Düzenle" : "Yeni İşlem"}
      description="Alacak veya borç kaydınızı oluşturun."
      footer={
        <div className="flex gap-2.5">
          <Button variant="secondary" block onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            block
            leftIcon={<Check className="h-4 w-4" />}
            onClick={submit}
          >
            {editing ? "Değişiklikleri Kaydet" : "İşlemi Kaydet"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tür seçimi */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => patch({ type: "receivable" })}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98]",
              isReceivable ? "bg-receivable text-white shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            <ArrowDownLeft className="h-4 w-4" />
            Alacak (+)
          </button>
          <button
            type="button"
            onClick={() => patch({ type: "payable" })}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98]",
              !isReceivable ? "bg-payable text-white shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
            Borç (-)
          </button>
        </div>

        <Field label="Kişi / Firma Adı" required error={errors.contactName}>
          <Input
            value={form.contactName}
            onChange={(e) => patch({ contactName: e.target.value })}
            placeholder="Örn. Ahmet Yılmaz veya ABC Tedarik Ltd."
            autoFocus
          />
        </Field>

        <Field label="Telefon" hint="WhatsApp hatırlatma mesajı için kullanılır.">
          <Input
            value={form.contactPhone}
            onChange={(e) => patch({ contactPhone: e.target.value })}
            placeholder="0532 000 00 00"
            inputMode="tel"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Tutar"
            required
            error={errors.amount}
            hint={
              editingPaid > 0 && editing
                ? `Bu kayıtta ${formatCurrency(editingPaid, editing.currency)} ödeme var; tutar bunun altına inemez.`
                : undefined
            }
          >
            <Input
              value={form.amount}
              onChange={(e) => patch({ amount: e.target.value })}
              placeholder="0,00"
              inputMode="decimal"
            />
          </Field>
          <Field label="Para Birimi">
            <Select
              value={form.currency}
              onChange={(e) => patch({ currency: e.target.value as Currency })}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="İşlem Tarihi" required error={errors.issueDate}>
            <Input
              type="date"
              value={form.issueDate}
              onChange={(e) => patch({ issueDate: e.target.value })}
            />
          </Field>
          <Field label="Vade Tarihi" required error={errors.dueDate}>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => patch({ dueDate: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Taksit Seçeneği">
            <Select
              value={String(form.installmentsCount)}
              onChange={(e) => patch({ installmentsCount: Number(e.target.value) })}
            >
              {INSTALLMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kategori">
            <Select value={form.category} onChange={(e) => patch({ category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Taksit önizleme */}
        {form.installmentsCount > 1 && amountValue > 0 ? (
          <div className="rounded-2xl border border-line bg-surface-2 p-3.5">
            <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-ink">
              <Layers className="h-4 w-4 text-brand" />
              {form.installmentsCount} Taksit Planı
              <span className="tnum ml-auto text-muted">
                Aylık ≈ {formatCurrency(amountValue / form.installmentsCount, form.currency)}
              </span>
            </div>
            <div className="no-scrollbar max-h-44 space-y-1.5 overflow-y-auto">
              {preview.map((ins) => (
                <div
                  key={ins.id}
                  className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs"
                >
                  <span className="flex items-center gap-2 font-semibold text-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {ins.no}. Taksit · {formatDate(ins.dueDate)}
                  </span>
                  <span className="tnum font-bold text-ink">
                    {formatCurrency(ins.amount, form.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Field label="Açıklama">
          <Textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="İşlemle ilgili not (örn. Web tasarım hizmeti)"
          />
        </Field>
      </div>
    </Sheet>
  );
}
