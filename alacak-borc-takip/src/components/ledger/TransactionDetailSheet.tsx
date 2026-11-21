import {
  BadgeCheck,
  CalendarClock,
  CalendarPlus,
  Layers,
  MessageCircle,
  Pencil,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import type { Transaction } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { deriveStatus, progressRatio, remainingAmount, totalPaid } from "@/lib/ledger";
import { dueLabel, formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";

export function TransactionDetailSheet({
  tx,
  onClose,
  onEdit,
  onPartial,
  onWhatsApp,
  onDelete,
}: {
  tx: Transaction | null;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onPartial: (tx: Transaction) => void;
  onWhatsApp: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  const { transactions } = useLedger();
  if (!tx) return null;

  // Kayıt güncellenmiş olabilir; güncel sürümü kullan.
  const current = transactions.find((t) => t.id === tx.id) ?? tx;
  const paid = totalPaid(current);
  const remaining = remainingAmount(current);
  const ratio = progressRatio(current);
  const isReceivable = current.type === "receivable";

  return (
    <Sheet
      open={!!tx}
      onClose={onClose}
      title="İşlem Detayı"
      description={current.description || current.category}
      footer={
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2.5">
            <Button
              variant="secondary"
              block
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => onEdit(current)}
            >
              Düzenle
            </Button>
            {remaining > 0 ? (
              <Button
                variant="primary"
                block
                leftIcon={<Wallet className="h-4 w-4" />}
                onClick={() => onPartial(current)}
              >
                Kısmi Ödeme
              </Button>
            ) : (
              <Button variant="secondary" block disabled leftIcon={<BadgeCheck className="h-4 w-4" />}>
                Tamamlandı
              </Button>
            )}
          </div>
          <div className="flex gap-2.5">
            {isReceivable && remaining > 0 ? (
              <Button
                variant="success"
                block
                leftIcon={<MessageCircle className="h-4 w-4" />}
                onClick={() => onWhatsApp(current)}
              >
                WhatsApp Hatırlatma
              </Button>
            ) : null}
            <Button
              variant="ghost"
              block
              leftIcon={<Trash2 className="h-4 w-4" />}
              className="text-payable hover:bg-payable-soft"
              onClick={() => onDelete(current)}
            >
              Sil
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Kimlik */}
        <div className="flex items-center gap-3.5">
          <Avatar name={current.contactName} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-extrabold text-ink">{current.contactName}</p>
            {current.contactPhone ? (
              <p className="tnum text-xs text-muted">{current.contactPhone}</p>
            ) : null}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <TypeBadge type={current.type} />
              <StatusBadge status={deriveStatus(current)} />
            </div>
          </div>
        </div>

        {/* Tutarlar */}
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Toplam" value={formatCurrency(current.amount, current.currency)} tone="ink" />
          <Stat label="Ödenen" value={formatCurrency(paid, current.currency)} tone="success" />
          <Stat
            label="Kalan"
            value={formatCurrency(remaining, current.currency)}
            tone={remaining > 0 ? "danger" : "success"}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-muted">Ödeme durumu</span>
            <span className="tnum font-bold text-ink">{Math.round(ratio * 100)}%</span>
          </div>
          <ProgressBar
            value={ratio}
            tone={remaining <= 0 ? "success" : deriveStatus(current) === "overdue" ? "danger" : "brand"}
          />
        </div>

        {/* Bilgiler */}
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface-2">
          <InfoRow icon={<CalendarPlus className="h-4 w-4" />} label="İşlem Tarihi" value={formatDate(current.issueDate)} />
          <InfoRow
            icon={<CalendarClock className="h-4 w-4" />}
            label="Vade Tarihi"
            value={`${formatDate(current.dueDate)} · ${dueLabel(current.dueDate)}`}
          />
          <InfoRow icon={<Tag className="h-4 w-4" />} label="Kategori" value={current.category} />
        </div>

        {/* Taksit planı */}
        {current.installments.length > 1 ? (
          <div>
            <p className="mb-2 flex items-center gap-2 text-[13px] font-bold text-ink">
              <Layers className="h-4 w-4 text-brand" />
              Taksit Planı ({current.installments.length})
            </p>
            <div className="space-y-1.5">
              {current.installments.map((ins) => (
                <div
                  key={ins.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2.5 text-xs"
                >
                  <span className="font-semibold text-muted">
                    {ins.no}. Taksit · {formatDate(ins.dueDate)}
                  </span>
                  <span className="tnum font-bold text-ink">
                    {formatCurrency(ins.amount, current.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Ödeme geçmişi */}
        {current.payments.length > 0 ? (
          <div>
            <p className="mb-2 text-[13px] font-bold text-ink">Ödeme Geçmişi ({current.payments.length})</p>
            <div className="space-y-1.5">
              {[...current.payments]
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2.5"
                  >
                    <span className="text-xs font-semibold text-muted">
                      {formatDate(p.date)}
                      {p.note ? ` · ${p.note}` : ""}
                    </span>
                    <span className="tnum text-[13px] font-bold text-receivable">
                      {formatCurrency(p.amount, current.currency)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "ink" | "success" | "danger" }) {
  const color = tone === "success" ? "text-receivable" : tone === "danger" ? "text-payable" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className={cn("tnum mt-0.5 text-[13px] font-extrabold leading-tight", color)}>{value}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3">
      <span className="flex items-center gap-2.5 text-xs font-medium text-muted">
        <span className="text-faint">{icon}</span>
        {label}
      </span>
      <span className="text-[13px] font-semibold text-ink">{value}</span>
    </div>
  );
}
