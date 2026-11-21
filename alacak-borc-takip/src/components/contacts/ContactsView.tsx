import { useMemo, useState } from "react";
import { MessageCircle, Phone, UserRound, Users } from "lucide-react";
import type { Transaction } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { useToast } from "@/store/ToastProvider";
import { contactSummaries, remainingAmount, type ContactSummary } from "@/lib/ledger";
import { buildReminderMessage, openWhatsApp } from "@/lib/whatsapp";
import { addDays, dueLabel, formatCurrency, formatDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { Sheet } from "@/components/ui/Sheet";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";

export function ContactsView({
  search,
  onOpenTransaction,
  onNew,
}: {
  search: string;
  onOpenTransaction: (tx: Transaction) => void;
  onNew: () => void;
}) {
  const { rows, displayCurrency, loading } = useLedger();
  const toast = useToast();
  const [selected, setSelected] = useState<ContactSummary | null>(null);

  const contacts = useMemo(() => {
    const list = contactSummaries(rows);
    const q = search.trim().toLocaleLowerCase("tr");
    if (!q) return list;
    return list.filter(
      (c) => c.name.toLocaleLowerCase("tr").includes(q) || (c.phone ?? "").includes(q),
    );
  }, [rows, search]);

  const selectedTransactions = useMemo(() => {
    if (!selected) return [];
    return rows
      .filter((r) => r.tx.contactName === selected.name)
      .sort((a, b) => (a.tx.issueDate < b.tx.issueDate ? 1 : -1));
  }, [rows, selected]);

  const handleReminder = (c: ContactSummary, tx?: Transaction) => {
    const message = buildReminderMessage({
      contactName: c.name,
      amount: tx ? remainingAmount(tx) : c.receivable,
      currency: tx?.currency ?? displayCurrency,
      dueDate: tx?.dueDate ?? addDays(todayISO(), 7),
      description: tx?.description,
    });
    openWhatsApp(tx?.contactPhone ?? c.phone, message);
    if (c.phone || tx?.contactPhone) {
      toast.success("WhatsApp açılıyor", `${c.name} için hatırlatma mesajı hazırlandı.`);
    } else {
      toast.warning("Telefon numarası yok", "Mesaj hazırlandı ancak kayıtlı numara bulunamadı.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Özet */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Kayıtlı Cari" value={String(contacts.length)} icon={<Users className="h-4 w-4" />} />
        <MiniStat
          label="Toplam Alacak"
          value={formatCurrency(contacts.reduce((s, c) => s + c.receivable, 0), displayCurrency)}
          tone="success"
        />
        <MiniStat
          label="Toplam Borç"
          value={formatCurrency(contacts.reduce((s, c) => s + c.payable, 0), displayCurrency)}
          tone="danger"
        />
        <MiniStat
          label="Gecikmiş Cari"
          value={String(contacts.filter((c) => c.overdueCount > 0).length)}
          tone="warning"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            icon={<UserRound className="h-6 w-6" />}
            title="Cari bulunamadı"
            description="İşlem ekledikçe kişi ve firmalar burada listelenir."
            action={<Button variant="primary" onClick={onNew}>Yeni İşlem Ekle</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((c) => {
            const net = c.net;
            return (
              <Card key={c.name} interactive onClick={() => setSelected(c)} className="relative">
                {c.overdueCount > 0 ? (
                  <span className="absolute right-4 top-4">
                    <Badge tone="danger" dot>
                      {c.overdueCount} gecikmiş
                    </Badge>
                  </span>
                ) : null}
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                    {c.phone ? (
                      <p className="tnum flex items-center gap-1 text-xs text-muted">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </p>
                    ) : (
                      <p className="text-xs text-faint">Telefon kayıtlı değil</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between border-t border-line pt-3.5">
                  <div>
                    <p className="text-[11px] font-medium text-muted">Net Bakiye</p>
                    <p className={cn("tnum text-lg font-extrabold", net >= 0 ? "text-receivable" : "text-payable")}>
                      {formatCurrency(net, displayCurrency)}
                    </p>
                  </div>
                  <div className="text-right text-[11px]">
                    <p className="tnum font-semibold text-receivable">
                      +{formatCurrency(c.receivable, displayCurrency)}
                    </p>
                    <p className="tnum font-semibold text-payable">
                      −{formatCurrency(c.payable, displayCurrency)}
                    </p>
                    <p className="mt-0.5 text-faint">{c.count} işlem</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cari detay sayfası */}
      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        description={selected?.phone ? `Telefon: ${selected.phone}` : "Cari hareketleri"}
        footer={
          selected ? (
            <Button
              variant="success"
              block
              leftIcon={<MessageCircle className="h-4 w-4" />}
              onClick={() => handleReminder(selected)}
            >
              WhatsApp Hatırlatma Gönder
            </Button>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              <Tile label="Alacak" value={formatCurrency(selected.receivable, displayCurrency)} tone="success" />
              <Tile label="Borç" value={formatCurrency(selected.payable, displayCurrency)} tone="danger" />
              <Tile
                label="Net"
                value={formatCurrency(selected.net, displayCurrency)}
                tone={selected.net >= 0 ? "success" : "danger"}
              />
            </div>

            <p className="text-[13px] font-bold text-ink">İşlem Geçmişi ({selectedTransactions.length})</p>
            <div className="space-y-2">
              {selectedTransactions.map((r) => (
                <button
                  key={r.tx.id}
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    onOpenTransaction(r.tx);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition hover:border-brand/30 hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {r.tx.description || r.tx.category}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <TypeBadge type={r.tx.type} />
                      <span className="text-[11px] text-muted">{formatDate(r.tx.dueDate)}</span>
                      <span className={cn("text-[11px]", r.status === "overdue" ? "font-semibold text-payable" : "text-faint")}>
                        {r.status === "paid" ? "Tamamlandı" : dueLabel(r.nextDueDate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("tnum text-[13px] font-bold", r.tx.type === "receivable" ? "text-receivable" : "text-payable")}>
                      {formatCurrency(r.remaining, displayCurrency)}
                    </p>
                    <div className="mt-1 flex justify-end">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger" | "warning";
  icon?: React.ReactNode;
}) {
  const color =
    tone === "success" ? "text-receivable" : tone === "danger" ? "text-payable" : tone === "warning" ? "text-amber" : "text-ink";
  return (
    <div className="card px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
        {icon}
        {label}
      </div>
      <p className={cn("tnum mt-1 truncate text-base font-extrabold", color)}>{value}</p>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className={cn("tnum mt-0.5 text-[13px] font-extrabold", tone === "success" ? "text-receivable" : "text-payable")}>
        {value}
      </p>
    </div>
  );
}
