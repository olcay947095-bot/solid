import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Pencil, Phone, StickyNote, Trash2, UserPlus, UserRound, Users } from "lucide-react";
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
import { Field, Input, Textarea } from "@/components/ui/Field";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { Sheet } from "@/components/ui/Sheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";

/** Bakiye özeti + kayıtlı cari bilgisi (telefon/not/id). */
type ContactRow = ContactSummary & { id?: string; note?: string };

const PAGE_SIZE = 9;

export function ContactsView({
  search,
  onOpenTransaction,
  onNew,
}: {
  search: string;
  onOpenTransaction: (tx: Transaction) => void;
  onNew: () => void;
}) {
  const {
    rows,
    contacts: savedContacts,
    displayCurrency,
    loading,
    saveContact,
    removeContact,
  } = useLedger();
  const toast = useToast();

  const [selected, setSelected] = useState<ContactRow | null>(null);
  const [pendingRemove, setPendingRemove] = useState<ContactRow | null>(null);
  const [page, setPage] = useState(1);

  // Cari formu
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState<ContactRow | null>(null);
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fNote, setFNote] = useState("");

  /* İşlemlerden türetilen özetler, kayıtlı cari kayıtlarıyla birleştirilir. */
  const all = useMemo<ContactRow[]>(() => {
    const savedByName = new Map(savedContacts.map((c) => [c.name.toLocaleLowerCase("tr"), c]));
    const seen = new Set<string>();

    const merged: ContactRow[] = contactSummaries(rows).map((s) => {
      const key = s.name.toLocaleLowerCase("tr");
      seen.add(key);
      const saved = savedByName.get(key);
      return { ...s, phone: saved?.phone ?? s.phone, note: saved?.note, id: saved?.id };
    });

    for (const c of savedContacts) {
      if (seen.has(c.name.toLocaleLowerCase("tr"))) continue;
      merged.push({
        name: c.name,
        phone: c.phone,
        receivable: 0,
        payable: 0,
        net: 0,
        count: 0,
        overdueCount: 0,
        note: c.note,
        id: c.id,
      });
    }

    return merged.sort(
      (a, b) => Math.abs(b.net) - Math.abs(a.net) || a.name.localeCompare(b.name, "tr"),
    );
  }, [rows, savedContacts]);

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    if (!q) return all;
    return all.filter(
      (c) => c.name.toLocaleLowerCase("tr").includes(q) || (c.phone ?? "").includes(q),
    );
  }, [all, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Detay her zaman güncel veriyi gösterir (kayıt eklendiğinde id/telefon tazelenir).
  const active = useMemo(
    () => (selected ? all.find((c) => c.name === selected.name) ?? selected : null),
    [selected, all],
  );

  const selectedTransactions = useMemo(() => {
    if (!active) return [];
    return rows
      .filter((r) => r.tx.contactName === active.name)
      .sort((a, b) => (a.tx.issueDate < b.tx.issueDate ? 1 : -1));
  }, [rows, active]);

  const openCreate = () => {
    setEditorTarget(null);
    setFName("");
    setFPhone("");
    setFNote("");
    setEditorOpen(true);
  };

  const openEdit = (row: ContactRow) => {
    setEditorTarget(row);
    setFName(row.name);
    setFPhone(row.phone ?? "");
    setFNote(row.note ?? "");
    setEditorOpen(true);
  };

  // İşlemi olan caride ad, işlemlerle eşleştiği için kilitlenir.
  const nameLocked = !!editorTarget && editorTarget.count > 0;

  const submitContact = () => {
    const name = fName.trim();
    if (!name) {
      toast.error("Cari adı gerekli", "Lütfen bir ad veya firma adı girin.");
      return;
    }
    const renamed =
      editorTarget?.id && editorTarget.name.toLocaleLowerCase("tr") !== name.toLocaleLowerCase("tr");
    if (renamed && editorTarget?.id) removeContact(editorTarget.id);
    saveContact({ name, phone: fPhone, note: fNote });
    setSelected((prev) =>
      prev && editorTarget && prev.name === editorTarget.name
        ? { ...prev, name, phone: fPhone.trim() || undefined, note: fNote.trim() || undefined }
        : prev,
    );
    toast.success(editorTarget ? "Cari güncellendi" : "Cari eklendi", name);
    setEditorOpen(false);
  };

  const confirmRemove = () => {
    if (!pendingRemove?.id) return;
    removeContact(pendingRemove.id);
    toast.success("Cari kaydı silindi", `${pendingRemove.name} için kayıtlı bilgiler kaldırıldı.`);
    setPendingRemove(null);
    setSelected(null);
  };

  const handleReminder = (c: ContactRow, tx?: Transaction) => {
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
      {/* Başlık */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-ink">Cariler</h2>
          <p className="text-xs text-muted">Kişi ve firmaların hesap özeti</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="h-4 w-4" />}
          onClick={openCreate}
        >
          Yeni Cari
        </Button>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Kayıtlı Cari" value={String(all.length)} icon={<Users className="h-4 w-4" />} />
        <MiniStat
          label="Toplam Alacak"
          value={formatCurrency(all.reduce((s, c) => s + c.receivable, 0), displayCurrency)}
          tone="success"
        />
        <MiniStat
          label="Toplam Borç"
          value={formatCurrency(all.reduce((s, c) => s + c.payable, 0), displayCurrency)}
          tone="danger"
        />
        <MiniStat
          label="Gecikmiş Cari"
          value={String(all.filter((c) => c.overdueCount > 0).length)}
          tone="warning"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            icon={<UserRound className="h-6 w-6" />}
            title={search.trim() ? "Cari bulunamadı" : "Henüz cari yok"}
            description={
              search.trim()
                ? "Aramanızla eşleşen kişi veya firma bulunmuyor."
                : "Yeni cari ekleyin ya da işlem oluşturun; cariler burada listelenir."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2.5">
                <Button variant="primary" onClick={openCreate}>Yeni Cari Ekle</Button>
                <Button variant="secondary" onClick={onNew}>Yeni İşlem Ekle</Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((c) => {
              const net = c.net;
              return (
                <Card key={c.name} interactive onClick={() => setSelected(c)} className="relative">
                  {c.overdueCount > 0 ? (
                    <span className="absolute right-4 top-4">
                      <Badge tone="danger" dot>
                        {c.overdueCount} gecikmiş
                      </Badge>
                    </span>
                  ) : c.id ? (
                    <span className="absolute right-4 top-4">
                      <Badge tone="brand">Kayıtlı</Badge>
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

          <Pagination
            page={safePage}
            pageCount={pageCount}
            total={visible.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            className="card px-4 py-3"
          />
        </>
      )}

      {/* Cari detay sayfası */}
      <Sheet
        open={!!active}
        onClose={() => setSelected(null)}
        title={active?.name ?? ""}
        description={active?.phone ? `Telefon: ${active.phone}` : "Cari hareketleri"}
        footer={
          active ? (
            <Button
              variant="success"
              block
              leftIcon={<MessageCircle className="h-4 w-4" />}
              onClick={() => handleReminder(active)}
            >
              WhatsApp Hatırlatma Gönder
            </Button>
          ) : null
        }
      >
        {active ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Pencil className="h-3.5 w-3.5" />}
                onClick={() => openEdit(active)}
              >
                Bilgileri Düzenle
              </Button>
              {active.id ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-payable"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => setPendingRemove(active)}
                >
                  Kaydı Sil
                </Button>
              ) : null}
            </div>

            {active.note ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-3">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                <p className="text-[12.5px] leading-relaxed text-muted">{active.note}</p>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2.5">
              <Tile label="Alacak" value={formatCurrency(active.receivable, displayCurrency)} tone="success" />
              <Tile label="Borç" value={formatCurrency(active.payable, displayCurrency)} tone="danger" />
              <Tile
                label="Net"
                value={formatCurrency(active.net, displayCurrency)}
                tone={active.net >= 0 ? "success" : "danger"}
              />
            </div>

            <p className="text-[13px] font-bold text-ink">
              İşlem Geçmişi ({selectedTransactions.length})
            </p>
            {selectedTransactions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-xs text-faint">
                Bu cariye ait işlem kaydı yok.
              </p>
            ) : (
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
            )}
          </div>
        ) : null}
      </Sheet>

      {/* Cari formu */}
      <Sheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editorTarget ? "Cari Bilgilerini Düzenle" : "Yeni Cari"}
        description="Kişi veya firma bilgilerini kaydedin; işlemlerde otomatik eşleşir."
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" block onClick={() => setEditorOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" block onClick={submitContact}>
              {editorTarget ? "Kaydet" : "Cari Ekle"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field
            label="Cari Adı"
            required
            hint={nameLocked ? "İşlemlerle eşleştiği için ad değiştirilemez." : undefined}
          >
            <Input
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              placeholder="Örn. Ahmet Yılmaz veya ABC Tedarik Ltd."
              disabled={nameLocked}
              autoFocus={!nameLocked}
            />
          </Field>
          <Field label="Telefon" hint="WhatsApp hatırlatma mesajı için kullanılır.">
            <Input
              value={fPhone}
              onChange={(e) => setFPhone(e.target.value)}
              placeholder="0532 000 00 00"
              inputMode="tel"
            />
          </Field>
          <Field label="Not">
            <Textarea
              value={fNote}
              onChange={(e) => setFNote(e.target.value)}
              placeholder="Cariyle ilgili kısa not (örn. tedarikçi, ödeme günü)"
            />
          </Field>
        </div>
      </Sheet>

      <ConfirmDialog
        open={!!pendingRemove}
        title="Cari kaydını sil"
        message={
          pendingRemove
            ? pendingRemove.count > 0
              ? `${pendingRemove.name} için kayıtlı telefon/not bilgileri silinecek. İşlem kayıtları korunur ve cari, işlemlerden yeniden türetilir. Devam edilsin mi?`
              : `${pendingRemove.name} cari kaydı silinecek. Devam edilsin mi?`
            : ""
        }
        confirmLabel="Sil"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
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
