import { BACKUP_FILE_NAME, GOOGLE_DRIVE_SCOPE } from "@/lib/constants";

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_FILES = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

let gisPromise: Promise<void> | null = null;

/** Google Identity Services betiğini (bir kez) yükler. */
export function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google kimlik servisi yüklenemedi.")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(new Error("Google kimlik servisi yüklenemedi."));
    };
    document.head.appendChild(script);
  });

  return gisPromise;
}

function pickErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: string } | string }).error;
    if (typeof error === "string" && error) return error;
    if (error && typeof error === "object" && error.message) return error.message;
  }
  return fallback;
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as unknown;
    return pickErrorMessage(payload, fallback);
  } catch {
    return fallback;
  }
}

/** Kullanıcıdan Drive appDataFolder izni ister ve erişim jetonu döner. */
export async function requestAccessToken(clientId: string): Promise<string> {
  if (!clientId.trim()) throw new Error("Google İstemci Kimliği gerekli.");
  await loadGis();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("Google kimlik servisi kullanılamıyor.");

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: `${GOOGLE_DRIVE_SCOPE} openid email profile`,
      prompt: "consent",
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || "Erişim izni alınamadı."));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: () => reject(new Error("Google bağlantı penceresi kapatıldı.")),
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}

/** Bağlı hesabın e-posta adresini döner; alınamazsa undefined. */
export async function fetchAccountEmail(token: string): Promise<string | undefined> {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return undefined;
    const data = (await response.json()) as { email?: string };
    return data.email;
  } catch {
    return undefined;
  }
}

/** Drive'ın gizli appDataFolder'ındaki mevcut yedeği bulur. */
export async function findRemoteBackup(token: string): Promise<{ id: string } | null> {
  const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
  const url = `${DRIVE_FILES}?spaces=appDataFolder&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)&q=${query}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(await readError(response, "Google Drive taranamadı."));
  const data = (await response.json()) as { files?: { id: string }[] };
  const file = data.files?.[0];
  return file ? { id: file.id } : null;
}

/** Yedeği Drive'a yükler (varsa günceller) ve dosya kimliğini döner. */
export async function uploadBackup(
  token: string,
  content: string,
  existingFileId?: string,
): Promise<{ id: string }> {
  const boundary = "abt_backup_boundary_7f3a";
  const metadata = existingFileId
    ? { name: BACKUP_FILE_NAME }
    : { name: BACKUP_FILE_NAME, parents: ["appDataFolder"] };
  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${content}\r\n` +
    `--${boundary}--`;

  const url = existingFileId
    ? `${DRIVE_UPLOAD}/${existingFileId}?uploadType=multipart&fields=id`
    : `${DRIVE_UPLOAD}?uploadType=multipart&fields=id`;

  const response = await fetch(url, {
    method: existingFileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) throw new Error(await readError(response, "Yedek Google Drive'a yüklenemedi."));
  const data = (await response.json()) as { id: string };
  return { id: data.id };
}

/** Drive'daki yedeğin metnini indirir. */
export async function fetchRemoteBackup(token: string, fileId: string): Promise<string> {
  const response = await fetch(`${DRIVE_FILES}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await readError(response, "Yedek Google Drive'dan indirilemedi."));
  return response.text();
}
