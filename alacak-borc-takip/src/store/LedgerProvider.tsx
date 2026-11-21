import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  Currency,
  LedgerRow,
  Settings,
  Transaction,
  TransactionDraft,
} from "@/types";
import { loadSettings, loadTransactions, saveSettings, saveTransactions } from "@/lib/storage";
import { createSampleTransactions, makeInstallments } from "@/lib/sampleData";
import { buildRows, remainingAmount } from "@/lib/ledger";
import { todayISO } from "@/lib/format";
import { uid } from "@/lib/utils";
import { ACCENT_OPTIONS } from "@/lib/constants";

interface LedgerContextValue {
  /** İlk yükleme iskelet durumu. */
  loading: boolean;
  transactions: Transaction[];
  /** Gösterim para birimine çevrilmiş, türetilmiş satırlar. */
  rows: LedgerRow[];
  /** Tüm ayarlar (tema, aksan, duvar kağıdı, yedekleme). */
  settings: Settings;
  displayCurrency: Currency;
  setDisplayCurrency: (c: Currency) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  /** Ayarları kısmi olarak günceller. */
  updateSettings: (patch: Partial<Settings>) => void;
  addTransaction: (draft: TransactionDraft) => Transaction;
  updateTransaction: (id: string, draft: TransactionDraft) => void;
  deleteTransaction: (id: string) => void;
  addPayment: (id: string, amount: number, date?: string, note?: string) => void;
  removePayment: (id: string, paymentId: string) => void;
  /** Yedekten gelen kayıtları (isteğe bağlı ayarlarla) yükler. */
  importData: (transactions: Transaction[], settingsPatch?: Partial<Settings>) => void;
  resetDemoData: () => void;
  clearAll: () => void;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

function draftToTransaction(draft: TransactionDraft): Transaction {
  const now = new Date().toISOString();
  const installments = makeInstallments(draft.amount, draft.installmentsCount, draft.dueDate);
  const payments =
    draft.initialPayment && draft.initialPayment > 0
      ? [
          {
            id: uid("pay"),
            amount: Math.min(draft.initialPayment, draft.amount),
            date: draft.issueDate,
            note: "İlk ödeme",
          },
        ]
      : [];

  return {
    id: uid("tx"),
    type: draft.type,
    contactName: draft.contactName.trim(),
    contactPhone: draft.contactPhone?.trim() || undefined,
    amount: draft.amount,
    currency: draft.currency,
    issueDate: draft.issueDate,
    dueDate: draft.dueDate,
    category: draft.category,
    description: draft.description?.trim() || undefined,
    payments,
    installments,
    createdAt: now,
    updatedAt: now,
  };
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(() => loadSettings());
  const [transactions, setTransactions] = useState<Transaction[]>(
    () => loadTransactions() ?? createSampleTransactions(),
  );
  const [loading, setLoading] = useState(true);

  /* Kısa yapay yükleme — iskelet durumların görünmesi için. */
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(timer);
  }, []);

  /* Kalıcılık. */
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveSettings(settings);
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
    root.style.colorScheme = settings.theme;

    // Premium aksan paleti
    for (const opt of ACCENT_OPTIONS) root.classList.remove(`accent-${opt.value}`);
    root.classList.add(`accent-${settings.accent}`);

    // Duvar kağıdı yoğunluğu CSS değişkeni
    root.style.setProperty("--wp-opacity", String(settings.wallpaperIntensity / 100));

    try {
      localStorage.setItem("abt.theme", settings.theme);
      localStorage.setItem("abt.accent", settings.accent);
    } catch {
      /* yoksay */
    }
  }, [settings]);

  const rows = useMemo(
    () => buildRows(transactions, settings.displayCurrency),
    [transactions, settings.displayCurrency],
  );

  const setDisplayCurrency = useCallback((c: Currency) => {
    setSettings((s) => ({ ...s, displayCurrency: c }));
  }, []);

  const setTheme = useCallback((t: "light" | "dark") => {
    setSettings((s) => ({ ...s, theme: t }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const addTransaction = useCallback((draft: TransactionDraft) => {
    const tx = draftToTransaction(draft);
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  }, []);

  const updateTransaction = useCallback((id: string, draft: TransactionDraft) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              type: draft.type,
              contactName: draft.contactName.trim(),
              contactPhone: draft.contactPhone?.trim() || undefined,
              amount: draft.amount,
              currency: draft.currency,
              issueDate: draft.issueDate,
              dueDate: draft.dueDate,
              category: draft.category,
              description: draft.description?.trim() || undefined,
              installments: makeInstallments(draft.amount, draft.installmentsCount, draft.dueDate),
              updatedAt: new Date().toISOString(),
            }
          : tx,
      ),
    );
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  const addPayment = useCallback((id: string, amount: number, date?: string, note?: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== id) return tx;
        const capped = Math.min(amount, remainingAmount(tx));
        if (capped <= 0) return tx;
        return {
          ...tx,
          payments: [
            ...tx.payments,
            {
              id: uid("pay"),
              amount: capped,
              date: date || todayISO(),
              note: note?.trim() || undefined,
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const removePayment = useCallback((id: string, paymentId: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              payments: tx.payments.filter((p) => p.id !== paymentId),
              updatedAt: new Date().toISOString(),
            }
          : tx,
      ),
    );
  }, []);

  const importData = useCallback((txs: Transaction[], settingsPatch?: Partial<Settings>) => {
    setTransactions(txs);
    if (settingsPatch) setSettings((s) => ({ ...s, ...settingsPatch }));
  }, []);

  const resetDemoData = useCallback(() => {
    setTransactions(createSampleTransactions());
  }, []);

  const clearAll = useCallback(() => {
    setTransactions([]);
  }, []);

  const value = useMemo<LedgerContextValue>(
    () => ({
      loading,
      transactions,
      rows,
      settings,
      displayCurrency: settings.displayCurrency,
      setDisplayCurrency,
      theme: settings.theme,
      setTheme,
      toggleTheme,
      updateSettings,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addPayment,
      removePayment,
      importData,
      resetDemoData,
      clearAll,
    }),
    [
      loading,
      transactions,
      rows,
      settings,
      setDisplayCurrency,
      setTheme,
      toggleTheme,
      updateSettings,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addPayment,
      removePayment,
      importData,
      resetDemoData,
      clearAll,
    ],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger, LedgerProvider içinde kullanılmalıdır.");
  return ctx;
}
