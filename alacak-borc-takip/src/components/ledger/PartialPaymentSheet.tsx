import { useEffect, useMemo, useState } from "react";
import { Banknote, Check, Trash2 } from "lucide-react";
import type { Transaction } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { useToast } from "@/store/ToastProvider";
import { progressRatio, remainingAmount, totalPaid } from "@/lib/ledger";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";

function toNumber(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function PartialPaymentSheet({
  tx,
  onClose,
}: {
  tx: Transaction | null;
  onClose: () => void;
}) {
  const { addPayment, removePayment } = useLedger();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");

  const remaining = tx ? remainingAmount(tx) : 0;

  useEffect(() => {
    if (!tx) return;
    setAmount("");
    setDate(todayISO());
    setNote("");
  }, [tx]);

  const quick = useMemo(
    () => [
      { label: "%25", value: remaining * 0.25 },
      { label: "%50", value: remaining * 0.5 },
      { label: "%100", value: remaining },
    ],
    [remaining],
  );

  if (!tx) return null;

  const parsed = toNumber(amount);
  const ratio = progressRatio(tx);

  const submit = () => {
    if (parsed <= 0) {
      toast.error("Geçersiz tutar", "Sıfırdan büyük bir tutar giriniz.");
      return;
    }
    if (parsed > remaining + 0.01) {
      toast.error("Tutar çok yüksek", `En fazla ${formatCurrency(remaining, tx.currency)} girilebilir.`);
      return;
    }
    addPayment(tx.id, parsed, date, note);
    toast.success(
      "Ödeme kaydedildi",
      `${formatCurrency(parsed, tx.currency)} — ${tx.contactName}`,
    );
    onClose();
  };

  return (
    <Sheet
      open={!!tx}
      onClose={onClose}
      title="Kısmi Ödeme Ekle"
      description={tx.type === "receivable" ? "Tahsilat kaydı oluşturun." : "Ödeme kaydı oluşturun."}
      footer={
        <div className="flex gap-2.5">
          <Button variant="secondary" block onClick={onClose}>
            Kapat
          </Button>
          <Button variant="success" block leftIcon={<Check className="h-4 w-4" />} onClick={submit}>
            Ödemeyi Kaydet
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3.5">
          <Avatar name={tx.contactName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{tx.contactName}</p>
            <p className="truncate text-xs text-muted">{tx.description || tx.category}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted">Kalan</p>
            <p className="tnum text-sm font-extrabold text-payable">
              {formatCurrency(remaining, tx.currency)}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted">
              Ödenen: <span className="tnum font-bold text-ink">{formatCurrency(totalPaid(tx), tx.currency)}</span>
            </span>
            <span className="tnum font-bold text-muted">{Math.round(ratio * 100)}%</span>
          </div>
          <ProgressBar value={ratio} tone="success" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ödeme Tutarı" required>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              autoFocus
            />
          </Field>
          <Field label="Ödeme Tarihi">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setAmount(String(q.value.toFixed(2)).replace(".", ","))}
              className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-brand/40 hover:text-brand active:scale-95"
            >
              {q.label}
            </button>
          ))}
          <span className="self-center text-[11px] text-faint">
            Tutar: {formatCurrency(parsed, tx.currency)}
          </span>
        </div>

        <Field label="Not">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Örn. Havale ile ödendi"
          />
        </Field>

        {/* Mevcut ödemeler */}
        {tx.payments.length > 0 ? (
          <div>
            <p className="mb-2 text-[13px] font-bold text-ink">Ödeme Geçmişi</p>
            <div className="space-y-1.5">
              {[...tx.payments]
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-receivable-soft text-receivable dark:bg-receivable-softdark">
                        <Banknote className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="tnum text-[13px] font-bold text-ink">
                          {formatCurrency(p.amount, tx.currency)}
                        </p>
                        <p className="text-[11px] text-muted">
                          {formatDate(p.date)}
                          {p.note ? ` · ${p.note}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removePayment(tx.id, p.id);
                        toast.info("Ödeme kaydı silindi");
                      }}
                      className={cn(
                        "rounded-lg p-2 text-faint transition hover:bg-payable-soft hover:text-payable",
                      )}
                      aria-label="Ödemeyi sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
