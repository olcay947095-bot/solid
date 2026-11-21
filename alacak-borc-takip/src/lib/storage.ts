import type {
  AccentId,
  Contact,
  Currency,
  Settings,
  ThemeMode,
  Transaction,
  WallpaperId,
} from "@/types";

const SETTINGS_KEY = "abt.settings.v1";
const LEDGER_KEY = "abt.ledger.v1";
const CONTACTS_KEY = "abt.contacts.v1";
const THEME_KEY = "abt.theme";
const ACCENT_KEY = "abt.accent";

const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  displayCurrency: "TRY",
  rates: { TRY: 1, USD: 34, EUR: 37 },
  accent: "green",
  wallpaper: "aurora",
  wallpaperAnimated: true,
  wallpaperIntensity: 60,
  backup: {
    autoBackup: true,
    intervalMinutes: 30,
    google: {
      enabled: false,
      connected: false,
      clientId: "",
    },
  },
};

const CURRENCIES: Currency[] = ["TRY", "USD", "EUR"];
const ACCENTS: AccentId[] = ["green", "indigo", "emerald", "gold", "cyan"];
const WALLPAPERS: WallpaperId[] = ["aurora", "mesh", "starfield", "grid", "solid"];

function isCurrency(value: unknown): value is Currency {
  return CURRENCIES.includes(value as Currency);
}

function isAccent(value: unknown): value is AccentId {
  return ACCENTS.includes(value as AccentId);
}

function isWallpaper(value: unknown): value is WallpaperId {
  return WALLPAPERS.includes(value as WallpaperId);
}

function isTheme(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

function clampIntensity(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Kaydın geçerli bir işlem nesnesi olup olmadığını doğrular. */
export function isValidTx(value: unknown): value is Transaction {
  if (!value || typeof value !== "object") return false;
  const tx = value as Record<string, unknown>;
  return (
    typeof tx.id === "string" &&
    (tx.type === "receivable" || tx.type === "payable") &&
    typeof tx.contactName === "string" &&
    typeof tx.amount === "number" &&
    isCurrency(tx.currency) &&
    typeof tx.issueDate === "string" &&
    typeof tx.dueDate === "string" &&
    typeof tx.category === "string" &&
    Array.isArray(tx.payments) &&
    Array.isArray(tx.installments)
  );
}

/** Kaydın geçerli bir cari nesnesi olup olmadığını doğrular. */
export function isValidContact(value: unknown): value is Contact {
  if (!value || typeof value !== "object") return false;
  const contact = value as Record<string, unknown>;
  return typeof contact.id === "string" && typeof contact.name === "string";
}

/** Varsayılanlarla birleştirilmiş, doğrulanmış ayarları yükler. */
export function loadSettings(): Settings {
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    rates: { ...DEFAULT_SETTINGS.rates },
    backup: {
      ...DEFAULT_SETTINGS.backup,
      google: { ...DEFAULT_SETTINGS.backup.google },
    },
  };

  try {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const storedAccent = localStorage.getItem(ACCENT_KEY);
    if (isTheme(storedTheme)) settings.theme = storedTheme;
    if (isAccent(storedAccent)) settings.accent = storedAccent;

    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      if (isTheme(parsed.theme)) settings.theme = parsed.theme;
      if (isCurrency(parsed.displayCurrency)) settings.displayCurrency = parsed.displayCurrency;
      const rates = parsed.rates;
      if (rates && typeof rates === "object") {
        if (typeof rates.USD === "number" && rates.USD > 0) settings.rates.USD = rates.USD;
        if (typeof rates.EUR === "number" && rates.EUR > 0) settings.rates.EUR = rates.EUR;
      }
      settings.rates.TRY = 1;
      if (isAccent(parsed.accent)) settings.accent = parsed.accent;
      if (isWallpaper(parsed.wallpaper)) settings.wallpaper = parsed.wallpaper;
      if (typeof parsed.wallpaperAnimated === "boolean") settings.wallpaperAnimated = parsed.wallpaperAnimated;
      if (typeof parsed.wallpaperIntensity === "number") {
        settings.wallpaperIntensity = clampIntensity(parsed.wallpaperIntensity);
      }

      const backup = parsed.backup;
      if (backup && typeof backup === "object") {
        if (typeof backup.autoBackup === "boolean") settings.backup.autoBackup = backup.autoBackup;
        if (typeof backup.intervalMinutes === "number") {
          settings.backup.intervalMinutes = Math.max(1, Math.round(backup.intervalMinutes));
        }
        const google = backup.google;
        if (google && typeof google === "object") {
          if (typeof google.enabled === "boolean") settings.backup.google.enabled = google.enabled;
          if (typeof google.clientId === "string") settings.backup.google.clientId = google.clientId;
          if (typeof google.account === "string") settings.backup.google.account = google.account;
          if (typeof google.fileId === "string") settings.backup.google.fileId = google.fileId;
          if (typeof google.lastBackupAt === "string") settings.backup.google.lastBackupAt = google.lastBackupAt;
        }
      }
    }
  } catch {
    /* bozuk kayıt — varsayılanlara dön */
  }

  // Erişim jetonu oturuma özeldir; sayfa yeniden yüklenince bağlantı kurulmamış sayılır.
  settings.backup.google.connected = false;
  return settings;
}

/** Kayıtlı işlemleri yükler; yoksa veya bozuksa null döner. */
export function loadTransactions(): Transaction[] | null {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isValidTx);
  } catch {
    return null;
  }
}

/** Ayarları kalıcı olarak saklar. */
export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* kota/depolama hatası — sessizce yoksay */
  }
}

/** İşlemleri kalıcı olarak saklar. */
export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(transactions));
  } catch {
    /* kota/depolama hatası — sessizce yoksay */
  }
}

/** Kayıtlı carileri yükler; yoksa veya bozuksa null döner. */
export function loadContacts(): Contact[] | null {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isValidContact);
  } catch {
    return null;
  }
}

/** Carileri kalıcı olarak saklar. */
export function saveContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch {
    /* kota/depolama hatası — sessizce yoksay */
  }
}
