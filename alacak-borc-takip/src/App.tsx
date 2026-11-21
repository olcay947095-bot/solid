import { useCallback, useEffect, useState } from "react";
import type { Transaction, TxStatus, TxType } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { useToast } from "@/store/ToastProvider";
import { nextDueDate, remainingAmount } from "@/lib/ledger";
import { buildReminderMessage, openWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import type { View } from "@/components/layout/nav";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { LedgerView } from "@/components/ledger/LedgerView";
import { ContactsView } from "@/components/contacts/ContactsView";
import { ReportsView } from "@/components/reports/ReportsView";
import { TransactionForm } from "@/components/ledger/TransactionForm";
import { TransactionDetailSheet } from "@/components/ledger/TransactionDetailSheet";
import { PartialPaymentSheet } from "@/components/ledger/PartialPaymentSheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { AnimatedBackground } from "@/components/effects/AnimatedBackground";
import type { RowActionsProps } from "@/components/ledger/TransactionTable";

export function App() {
  const { displayCurrency, transactions, deleteTransaction, insertTransaction, settings, theme } =
    useLedger();
  const toast = useToast();

  const [view, setView] = useState<View>("dashboard");
  const [ledgerType, setLedgerType] = useState<"all" | TxType>("all");
  const [presetStatus, setPresetStatus] = useState<TxStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Sayfa durumları
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [partial, setPartial] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const navigate = useCallback((next: View, type: "all" | TxType = "all") => {
    setView(next);
    if (next === "ledger") setLedgerType(type);
    if (next !== "ledger") setPresetStatus("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      if (value.trim() && view !== "ledger" && view !== "contacts") {
        setView("ledger");
        setLedgerType("all");
      }
    },
    [view],
  );

  const openNew = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((tx: Transaction) => {
    setDetail(null);
    setEditing(tx);
    setFormOpen(true);
  }, []);

  const openPartial = useCallback((tx: Transaction) => {
    setDetail(null);
    setPartial(tx);
  }, []);

  const handleWhatsApp = useCallback(
    (tx: Transaction) => {
      const message = buildReminderMessage({
        contactName: tx.contactName,
        amount: remainingAmount(tx),
        currency: tx.currency,
        dueDate: nextDueDate(tx),
        description: tx.description,
      });
      const hasPhone = openWhatsApp(tx.contactPhone, message);
      if (hasPhone) {
        toast.success("WhatsApp açılıyor", `${tx.contactName} için hatırlatma mesajı hazırlandı.`);
      } else {
        toast.warning(
          "Telefon numarası yok",
          `Mesaj hazırlandı ancak ${tx.contactName} için kayıtlı numara bulunamadı.`,
        );
      }
    },
    [toast],
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    const index = transactions.findIndex((t) => t.id === target.id);
    deleteTransaction(target.id);
    toast.success(
      "İşlem silindi",
      `${target.contactName} kaydı silindi.`,
      {
        label: "Geri Al",
        onClick: () => {
          insertTransaction(target, index);
          toast.info("Geri alındı", `${target.contactName} kaydı geri yüklendi.`);
        },
      },
      7000,
    );
    setPendingDelete(null);
    setDetail(null);
    setPartial(null);
  }, [pendingDelete, transactions, deleteTransaction, insertTransaction, toast]);

  /* Klavye kısayolları — form alanına yazılırken devre dışı. */
  useEffect(() => {
    let gPressed = false;
    let gTimer: number | undefined;
    const reset = () => {
      gPressed = false;
      window.clearTimeout(gTimer);
    };

    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      const typing =
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "/") {
        const input = Array.from(
          document.querySelectorAll<HTMLInputElement>('input[type="search"]'),
        ).find((el) => el.offsetParent !== null);
        if (input) {
          event.preventDefault();
          input.focus();
        }
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        openNew();
        return;
      }
      if (event.key === "?") {
        toast.info(
          "Klavye kısayolları",
          "n: yeni işlem · /: ara · g+a alacaklar · g+b borçlar · g+c cariler · g+r raporlar",
        );
        return;
      }
      if (event.key === "g") {
        gPressed = true;
        window.clearTimeout(gTimer);
        gTimer = window.setTimeout(reset, 900);
        return;
      }
      if (gPressed) {
        reset();
        const routes: Record<string, () => void> = {
          d: () => navigate("dashboard"),
          l: () => navigate("ledger", "all"),
          a: () => navigate("ledger", "receivable"),
          b: () => navigate("ledger", "payable"),
          c: () => navigate("contacts"),
          r: () => navigate("reports"),
        };
        const go = routes[event.key.toLowerCase()];
        if (go) {
          event.preventDefault();
          go();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(gTimer);
    };
  }, [navigate, openNew, toast]);

  /* Yeni service worker sürümü hazır olduğunda yenileme bildirimi. */
  useEffect(() => {
    const onUpdate = () =>
      toast.info(
        "Yeni sürüm hazır",
        "Güncellemeyi uygulamak için sayfayı yenileyin.",
        { label: "Yenile", onClick: () => window.location.reload() },
        12000,
      );
    window.addEventListener("abt:sw-update", onUpdate);
    return () => window.removeEventListener("abt:sw-update", onUpdate);
  }, [toast]);

  const showOverdue = useCallback(() => {
    setPresetStatus("overdue");
    setLedgerType("all");
    setView("ledger");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const actions: RowActionsProps = {
    onDetail: setDetail,
    onPartial: openPartial,
    onEdit: openEdit,
    onWhatsApp: handleWhatsApp,
    onDelete: setPendingDelete,
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground
        variant={settings.wallpaper}
        animated={settings.wallpaperAnimated}
        intensity={settings.wallpaperIntensity}
        dark={theme === "dark"}
        accent={settings.accent}
      />

      <div className="relative z-10">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          view={view}
          ledgerType={ledgerType}
          onNavigate={navigate}
        />

        <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]")}>
          <TopHeader
            view={view}
            search={search}
            onSearchChange={handleSearch}
            onNewTransaction={openNew}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <main className="mx-auto w-full max-w-[1440px] px-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] pt-5 lg:px-6 lg:pb-12">
            <div key={view} className="animate-fade-in">
              {view === "dashboard" ? (
                <DashboardView
                  onSelect={setDetail}
                  onSeeAllDues={() => navigate("ledger", "all")}
                  onShowOverdue={showOverdue}
                />
              ) : view === "ledger" ? (
                <LedgerView
                  type={ledgerType}
                  onTypeChange={setLedgerType}
                  search={search}
                  actions={actions}
                  onNew={openNew}
                  presetStatus={presetStatus}
                />
              ) : view === "contacts" ? (
                <ContactsView search={search} onOpenTransaction={setDetail} onNew={openNew} />
              ) : (
                <ReportsView />
              )}
            </div>
          </main>
        </div>

        <BottomNav view={view} ledgerType={ledgerType} onNavigate={navigate} onQuickAdd={openNew} />
      </div>

      {/* Sayfa katmanları */}
      <TransactionForm open={formOpen} editing={editing} onClose={() => setFormOpen(false)} />
      <TransactionDetailSheet
        tx={detail}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onPartial={openPartial}
        onWhatsApp={handleWhatsApp}
        onDelete={setPendingDelete}
      />
      <PartialPaymentSheet tx={partial} onClose={() => setPartial(null)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="İşlemi sil"
        message={
          pendingDelete
            ? `${pendingDelete.contactName} için "${pendingDelete.description || pendingDelete.category}" kaydını silmek istediğinize emin misiniz? Silme sonrası kısa süre içinde geri alabilirsiniz.`
            : ""
        }
        confirmLabel="Sil"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* Ekran okuyucu için para birimi duyurusu */}
      <span className="sr-only" aria-live="polite">
        Gösterim para birimi {displayCurrency}
      </span>
    </div>
  );
}
