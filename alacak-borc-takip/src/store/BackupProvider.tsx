import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { BackupSettings, GoogleBackupConfig, Settings } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { useToast } from "@/store/ToastProvider";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  createBackupPayload,
  downloadBackupFile,
  parseBackup,
  readBackupFile,
  serializeBackup,
  type ParsedBackup,
} from "@/lib/backup";
import {
  fetchAccountEmail,
  findRemoteBackup,
  fetchRemoteBackup,
  requestAccessToken,
  uploadBackup,
} from "@/lib/googleDrive";

type BackupStatus = "idle" | "syncing" | "success" | "error" | "queued";

interface BackupContextValue {
  online: boolean;
  connected: boolean;
  status: BackupStatus;
  error: string | null;
  connecting: boolean;
  lastBackupAt?: string;
  account?: string;
  /** Ayar güncelleyicileri (yerel ayar ağacına işler). */
  patchBackup: (patch: Partial<BackupSettings>) => void;
  patchGoogle: (patch: Partial<GoogleBackupConfig>) => void;
  /** Google hesabını bağlar; yedekleme hemen başlar. */
  connectGoogle: (clientId: string) => Promise<string | undefined>;
  disconnectGoogle: () => void;
  /** Yedeklemeyi tetikler. `silent` ise başarı bildirimi gösterilmez. */
  runBackup: (silent?: boolean) => Promise<void>;
  /** Buluttaki yedeği indirir ve ayrıştırır (uygulamaz). */
  fetchCloudBackup: () => Promise<ParsedBackup>;
  exportLocalBackup: () => void;
  importLocalBackup: (file: File) => Promise<ParsedBackup>;
}

const BackupContext = createContext<BackupContextValue | null>(null);

export function BackupProvider({ children }: { children: ReactNode }) {
  const { transactions, settings, contacts, updateSettings } = useLedger();
  const toast = useToast();
  const online = useOnlineStatus();

  /* Her render'da güncel durumu okuyabilmek için ref. */
  const stateRef = useRef({ transactions, settings, contacts });
  stateRef.current = { transactions, settings, contacts };

  const tokenRef = useRef<string | null>(null);
  const queuedRef = useRef(false);
  const [status, setStatus] = useState<BackupStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connected = settings.backup.google.connected;

  const patchBackup = useCallback(
    (patch: Partial<BackupSettings>) => {
      updateSettings({ backup: { ...stateRef.current.settings.backup, ...patch } });
    },
    [updateSettings],
  );

  const patchGoogle = useCallback(
    (patch: Partial<GoogleBackupConfig>) => {
      const b = stateRef.current.settings.backup;
      updateSettings({ backup: { ...b, google: { ...b.google, ...patch } } });
    },
    [updateSettings],
  );

  /** Drive'a yedek yükler. */
  const runBackup = useCallback(
    async (silent = false) => {
      const { transactions: txs, settings: st, contacts: ctcs } = stateRef.current;
      const g = st.backup.google;
      const token = tokenRef.current;

      if (!g.enabled) {
        if (!silent) toast.warning("Bulut yedekleme kapalı", "Ayarlardan Google Drive yedeklemesini açın.");
        return;
      }
      if (!token || !g.connected) {
        if (!silent) toast.info("Google hesabı bağlı değil", "Yedeklemek için önce hesabınızı bağlayın.");
        return;
      }
      if (!navigator.onLine) {
        queuedRef.current = true;
        setStatus("queued");
        return;
      }

      setStatus("syncing");
      setError(null);
      try {
        const content = serializeBackup(createBackupPayload(txs, st, ctcs));
        const meta = await uploadBackup(token, content, g.fileId);
        const now = new Date().toISOString();
        const b = stateRef.current.settings.backup;
        updateSettings({
          backup: { ...b, google: { ...b.google, fileId: meta.id, lastBackupAt: now } },
        });
        queuedRef.current = false;
        setStatus("success");
        if (!silent) {
          toast.success(
            "Bulut yedeklemesi tamamlandı",
            `${txs.length} kayıt Google Drive'a güvenle kaydedildi.`,
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Yedekleme başarısız oldu.";
        setStatus("error");
        setError(msg);
        if (!silent) toast.error("Yedekleme başarısız", msg);
      }
    },
    [toast, updateSettings],
  );

  const connectGoogle = useCallback(
    async (clientId: string) => {
      setConnecting(true);
      try {
        const token = await requestAccessToken(clientId);
        tokenRef.current = token;
        const email = await fetchAccountEmail(token);
        const b = stateRef.current.settings.backup;
        updateSettings({
          backup: {
            ...b,
            google: { ...b.google, enabled: true, clientId, connected: true, account: email },
          },
        });
        toast.success(
          "Google Drive bağlandı",
          email ? `${email} hesabına otomatik yedeklenecek.` : "Otomatik yedekleme hazır.",
        );
        return email;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Bağlantı kurulamadı.";
        toast.error("Bağlantı kurulamadı", msg);
        return undefined;
      } finally {
        setConnecting(false);
      }
    },
    [toast, updateSettings],
  );

  /* Sayfa yenilendikten sonra izin hâlâ geçerliyse jetonu sessizce yenile.
     Erişim jetonu oturuma özeldir; bu adım bağlantının kalıcılığını sağlar. */
  const reconnectedRef = useRef(false);
  useEffect(() => {
    if (reconnectedRef.current) return;
    const g = settings.backup.google;
    if (g.connected || !g.enabled || !g.clientId.trim()) {
      reconnectedRef.current = true;
      return;
    }
    reconnectedRef.current = true;
    if (!navigator.onLine) return;
    void (async () => {
      try {
        const token = await requestAccessToken(g.clientId, { silent: true });
        tokenRef.current = token;
        const email = await fetchAccountEmail(token);
        const b = stateRef.current.settings.backup;
        updateSettings({
          backup: {
            ...b,
            google: { ...b.google, connected: true, account: email ?? b.google.account },
          },
        });
        toast.info(
          "Google Drive yeniden bağlandı",
          email ? `${email} hesabına otomatik yedekleme sürüyor.` : "Otomatik yedekleme sürüyor.",
        );
      } catch {
        /* Sessiz yeniden bağlantı kurulamadı — kullanıcı elle yeniden bağlanabilir. */
      }
    })();
  }, [settings.backup.google, updateSettings, toast]);

  const disconnectGoogle = useCallback(() => {
    tokenRef.current = null;
    queuedRef.current = false;
    patchGoogle({ connected: false });
    setStatus("idle");
    setError(null);
    toast.info("Google Drive bağlantısı kapatıldı");
  }, [patchGoogle, toast]);

  const fetchCloudBackup = useCallback(async () => {
    const token = tokenRef.current;
    const g = stateRef.current.settings.backup.google;
    if (!token || !g.connected) throw new Error("Önce Google hesabınızı bağlayın.");
    if (!navigator.onLine) throw new Error("Geri yükleme için internet bağlantısı gerekli.");

    setStatus("syncing");
    setError(null);
    try {
      const meta = g.fileId ? { id: g.fileId } : await findRemoteBackup(token);
      if (!meta) throw new Error("Google Drive'da kayıtlı yedek bulunamadı.");
      const text = await fetchRemoteBackup(token, meta.id);
      const parsed = parseBackup(text);
      setStatus("success");
      return parsed;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Yedek alınamadı.";
      setStatus("error");
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const exportLocalBackup = useCallback(() => {
    const { transactions: txs, settings: st, contacts: ctcs } = stateRef.current;
    downloadBackupFile(createBackupPayload(txs, st, ctcs));
    toast.success("Yedek indirildi", "Cihazınıza JSON yedek dosyası kaydedildi.");
  }, [toast]);

  const importLocalBackup = useCallback(async (file: File) => {
    const text = await readBackupFile(file);
    return parseBackup(text);
  }, []);

  /* Bağlanınca ilk yedeği al. */
  const prevConnected = useRef(false);
  useEffect(() => {
    if (connected && !prevConnected.current) void runBackup(true);
    prevConnected.current = connected;
  }, [connected, runBackup]);

  /* İnternet geri gelince bekleyen yedeği gönder. */
  const prevOnline = useRef(online);
  useEffect(() => {
    if (online && !prevOnline.current && queuedRef.current) {
      toast.info("Bağlantı geri geldi", "Bekleyen yedek Google Drive'a aktarılıyor.");
      void runBackup(true);
    }
    prevOnline.current = online;
  }, [online, runBackup, toast]);

  /* Otomatik yedekleme — periyodik. */
  useEffect(() => {
    const { autoBackup, intervalMinutes, google } = settings.backup;
    if (!autoBackup || !google.connected || !google.enabled) return;
    const period = Math.max(1, intervalMinutes) * 60_000;
    const id = setInterval(() => void runBackup(true), period);
    return () => clearInterval(id);
  }, [
    settings.backup.autoBackup,
    settings.backup.intervalMinutes,
    settings.backup.google.connected,
    settings.backup.google.enabled,
    runBackup,
  ]);

  /* Veri değişince (15 sn sessizlik sonrası) otomatik yedek. */
  const sig = useMemo(() => {
    let max = "";
    for (const t of transactions) if (t.updatedAt > max) max = t.updatedAt;
    return `${transactions.length}|${max}`;
  }, [transactions]);
  const lastSigRef = useRef(sig);

  useEffect(() => {
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;
    const { autoBackup, google } = settings.backup;
    if (!autoBackup || !google.connected || !google.enabled) return;
    const id = setTimeout(() => void runBackup(true), 15_000);
    return () => clearTimeout(id);
  }, [sig, settings.backup, runBackup]);

  const value = useMemo<BackupContextValue>(
    () => ({
      online,
      connected,
      status,
      error,
      connecting,
      lastBackupAt: settings.backup.google.lastBackupAt,
      account: settings.backup.google.account,
      patchBackup,
      patchGoogle,
      connectGoogle,
      disconnectGoogle,
      runBackup,
      fetchCloudBackup,
      exportLocalBackup,
      importLocalBackup,
    }),
    [
      online,
      connected,
      status,
      error,
      connecting,
      settings.backup.google.lastBackupAt,
      settings.backup.google.account,
      patchBackup,
      patchGoogle,
      connectGoogle,
      disconnectGoogle,
      runBackup,
      fetchCloudBackup,
      exportLocalBackup,
      importLocalBackup,
    ],
  );

  return <BackupContext.Provider value={value}>{children}</BackupContext.Provider>;
}

export function useBackup(): BackupContextValue {
  const ctx = useContext(BackupContext);
  if (!ctx) throw new Error("useBackup, BackupProvider içinde kullanılmalıdır.");
  return ctx;
}

/** Yedekten gelen ayarları mevcut ayarlarla güvenli biçimde birleştirir. */
export function mergeRestoredSettings(current: Settings, patch?: Partial<Settings>): Partial<Settings> {
  if (!patch) return {};
  const next: Partial<Settings> = {};

  // Yalnızca yedekte geçerli olan alanlar uygulanır; eksik alanlar mevcut
  // ayarları bozmaz (eski yedeklerde bu alanlar bulunmayabilir).
  if (patch.theme === "dark" || patch.theme === "light") next.theme = patch.theme;
  if (patch.displayCurrency) next.displayCurrency = patch.displayCurrency;
  if (patch.accent) next.accent = patch.accent;
  if (patch.wallpaper) next.wallpaper = patch.wallpaper;
  if (typeof patch.wallpaperAnimated === "boolean") next.wallpaperAnimated = patch.wallpaperAnimated;
  if (typeof patch.wallpaperIntensity === "number") {
    next.wallpaperIntensity = Math.min(100, Math.max(0, Math.round(patch.wallpaperIntensity)));
  }

  const rates = patch.rates;
  if (rates && typeof rates === "object") {
    next.rates = {
      TRY: 1,
      USD: typeof rates.USD === "number" && rates.USD > 0 ? rates.USD : current.rates.USD,
      EUR: typeof rates.EUR === "number" && rates.EUR > 0 ? rates.EUR : current.rates.EUR,
    };
  }

  // Bulut bağlantı durumu cihaza özeldir; asla geri yüklenmez.
  next.backup = current.backup;
  return next;
}
