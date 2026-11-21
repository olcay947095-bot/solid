/** İşlem türü: alacak (+) veya borç (−). */
export type TxType = "receivable" | "payable";

/** Türetilmiş kayıt durumu. */
export type TxStatus = "paid" | "pending" | "overdue" | "partial";

/** Desteklenen para birimleri. */
export type Currency = "TRY" | "USD" | "EUR";

/** Tema modu. */
export type ThemeMode = "light" | "dark";

/** Marka aksan paleti kimliği. */
export type AccentId = "indigo" | "emerald" | "gold" | "cyan";

/** Hareketli duvar kağıdı varyantı. */
export type WallpaperId = "aurora" | "mesh" | "starfield" | "grid" | "solid";

/** Tek bir tahsil/ödeme kaydı. */
export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

/** Taksit planı kalemi. */
export interface Installment {
  id: string;
  no: number;
  dueDate: string;
  amount: number;
}

/** Kalıcı işlem kaydı. */
export interface Transaction {
  id: string;
  type: TxType;
  contactName: string;
  contactPhone?: string;
  amount: number;
  currency: Currency;
  issueDate: string;
  dueDate: string;
  category: string;
  description?: string;
  payments: Payment[];
  installments: Installment[];
  createdAt: string;
  updatedAt: string;
}

/** Yeni işlem/düzenleme formunun gönderdiği taslak. */
export interface TransactionDraft {
  type: TxType;
  contactName: string;
  contactPhone?: string;
  amount: number;
  currency: Currency;
  issueDate: string;
  dueDate: string;
  category: string;
  description?: string;
  installmentsCount: number;
  initialPayment?: number;
}

/** Gösterim para birimine çevrilmiş, türetilmiş liste satırı. */
export interface LedgerRow {
  tx: Transaction;
  total: number;
  paid: number;
  remaining: number;
  status: TxStatus;
  nextDueDate: string;
}

/** Liste filtreleri. */
export interface Filters {
  type: "all" | TxType;
  status: "all" | TxStatus;
  from: string;
  to: string;
  search: string;
  category: string;
}

/** Google Drive yedekleme yapılandırması. */
export interface GoogleBackupConfig {
  enabled: boolean;
  connected: boolean;
  clientId: string;
  account?: string;
  fileId?: string;
  lastBackupAt?: string;
}

/** Yedekleme ayarları. */
export interface BackupSettings {
  autoBackup: boolean;
  intervalMinutes: number;
  google: GoogleBackupConfig;
}

/** Uygulama ayarları. */
export interface Settings {
  theme: ThemeMode;
  displayCurrency: Currency;
  accent: AccentId;
  wallpaper: WallpaperId;
  wallpaperAnimated: boolean;
  wallpaperIntensity: number;
  backup: BackupSettings;
}

/** Dışa/içe aktarılan yedek dosyası içeriği. */
export interface BackupPayload {
  app: string;
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  settings: Settings;
}
