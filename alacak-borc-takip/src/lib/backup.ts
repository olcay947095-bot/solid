import type { BackupPayload, Settings, Transaction } from "@/types";
import { BACKUP_FILE_NAME } from "@/lib/constants";
import { isValidTx } from "@/lib/storage";

export const BACKUP_VERSION = 1;
const BACKUP_APP = "alacak-borc-takip" as const;

export interface ParsedBackup {
  transactions: Transaction[];
  settings?: Partial<Settings>;
  skipped?: number;
}

/** Yedekleme nesnesini oluşturur. */
export function createBackupPayload(transactions: Transaction[], settings: Settings): BackupPayload {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    transactions,
    settings,
  };
}

/** Yedeği okunabilir JSON metnine dönüştürür. */
export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

/** Yedeği JSON dosyası olarak indirir. */
export function downloadBackupFile(payload: BackupPayload): void {
  const blob = new Blob([serializeBackup(payload)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = BACKUP_FILE_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Seçilen yedek dosyasını metin olarak okur. */
export function readBackupFile(file: File): Promise<string> {
  return file.text();
}

/** Yedek metnini ayrıştırır ve geçerli kayıtları döndürür. */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Geçersiz yedek dosyası: içerik JSON olarak okunamadı.");
  }

  let rawTransactions: unknown;
  let settings: Partial<Settings> | undefined;

  if (Array.isArray(data)) {
    rawTransactions = data;
  } else if (data && typeof data === "object" && "transactions" in data) {
    const record = data as { transactions?: unknown; settings?: unknown };
    rawTransactions = record.transactions;
    if (record.settings && typeof record.settings === "object") {
      settings = record.settings as Partial<Settings>;
    }
  } else {
    throw new Error("Tanınmayan yedek biçimi.");
  }

  if (!Array.isArray(rawTransactions)) {
    throw new Error("Yedek dosyasında kayıt listesi bulunamadı.");
  }

  const transactions: Transaction[] = [];
  let skipped = 0;
  for (const item of rawTransactions) {
    if (isValidTx(item)) transactions.push(item);
    else skipped += 1;
  }

  if (transactions.length === 0) {
    throw new Error("Yedek dosyasında geçerli kayıt bulunamadı.");
  }

  return { transactions, settings, skipped };
}
