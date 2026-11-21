import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AlertTriangle,
  Cloud,
  Coins,
  Copy,
  Database,
  Download,
  Image as ImageIcon,
  Link2,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  Unlink,
  Upload,
} from "lucide-react";
import type { ParsedBackup } from "@/lib/backup";
import { useLedger } from "@/store/LedgerProvider";
import { mergeRestoredSettings, useBackup } from "@/store/BackupProvider";
import { useToast } from "@/store/ToastProvider";
import { ACCENT_OPTIONS, BACKUP_INTERVALS, WALLPAPER_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Segmented } from "@/components/ui/Segmented";
import { Field, Input, Select } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CloudStatusChip } from "@/components/backup/CloudStatusChip";
import { cn } from "@/lib/utils";

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand/15">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          {description ? <p className="text-xs text-muted">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function formatStamp(iso?: string): string {
  if (!iso) return "Henüz yedeklenmedi";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatDate(iso.slice(0, 10))} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Döviz kuru girişi — geçerli değerleri üst bileşene bildirir. */
function RateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <Field label={label}>
      <Input
        value={text}
        inputMode="decimal"
        spellCheck={false}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = Number(e.target.value.replace(/\s/g, "").replace(",", "."));
          if (Number.isFinite(parsed) && parsed > 0) onChange(parsed);
        }}
        onBlur={() => setText(String(value))}
      />
    </Field>
  );
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, updateSettings, importData, replaceContacts, resetDemoData, clearAll, transactions } =
    useLedger();
  const backup = useBackup();
  const toast = useToast();

  const { online, connected, status, connecting, account, lastBackupAt } = backup;

  const [clientId, setClientId] = useState(settings.backup.google.clientId);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [dialog, setDialog] = useState<null | "restore" | "clear">(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const handleConnect = async () => {
    await backup.connectGoogle(clientId);
  };

  const handleCloudRestore = async () => {
    try {
      const parsed = await backup.fetchCloudBackup();
      setPending(parsed);
      setDialog("restore");
    } catch (e) {
      toast.error("Geri yükleme başarısız", e instanceof Error ? e.message : "Yedek alınamadı.");
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = await backup.importLocalBackup(file);
      setPending(parsed);
      setDialog("restore");
    } catch (e) {
      toast.error("Dosya okunamadı", e instanceof Error ? e.message : "Geçersiz yedek dosyası.");
    }
  };

  const applyRestore = () => {
    if (!pending) return;
    importData(pending.transactions, mergeRestoredSettings(settings, pending.settings));
    // Yedekte cari listesi varsa geri yükle; yoksa (eski yedekler) mevcut cariler korunur.
    if (pending.contacts !== undefined) replaceContacts(pending.contacts);
    const contactNote =
      pending.contacts !== undefined ? `, ${pending.contacts.length} cari` : "";
    toast.success(
      "Geri yükleme tamamlandı",
      `${pending.transactions.length} kayıt${contactNote} yüklendi${
        pending.skipped ? `, ${pending.skipped} kayıt atlandı` : ""
      }.`,
    );
    setDialog(null);
    setPending(null);
    onClose();
  };

  const copyOrigin = async () => {
    try {
      await navigator.clipboard.writeText(origin);
      toast.success("Kopyalandı", origin);
    } catch {
      toast.warning("Kopyalanamadı", origin);
    }
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title="Ayarlar"
        description="Görünüm, duvar kağıdı, bulut yedekleme ve veri yönetimi"
        size="lg"
        footer={
          <Button variant="secondary" block onClick={onClose}>
            Kapat
          </Button>
        }
      >
        <div className="space-y-7">
          {/* Elite başlık */}
          <div className="card-premium sheen relative overflow-hidden p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-light to-gold text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-gradient-gold">Elite Sürüm</p>
                <p className="text-xs text-muted">
                  Premium görünüm, otomatik bulut yedekleme ve çevrimdışı mod
                </p>
              </div>
            </div>
          </div>

          {/* Görünüm */}
          <Section icon={<Palette className="h-[18px] w-[18px]" />} title="Görünüm" description="Tema ve marka aksanı">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-ink">Tema</span>
                <Segmented
                  options={[
                    { value: "light", label: "Açık", icon: <Sun className="h-3.5 w-3.5" /> },
                    { value: "dark", label: "Koyu", icon: <Moon className="h-3.5 w-3.5" /> },
                  ]}
                  value={settings.theme}
                  onChange={(t) => updateSettings({ theme: t })}
                />
              </div>
              <div>
                <span className="text-[13px] font-semibold text-ink">Aksan rengi</span>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {ACCENT_OPTIONS.map((opt) => {
                    const active = settings.accent === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateSettings({ accent: opt.value })}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all active:scale-95",
                          active ? "border-transparent text-ink" : "border-line text-muted hover:text-ink",
                        )}
                        style={
                          active
                            ? ({ borderColor: opt.swatch, boxShadow: `0 0 0 3px ${opt.swatch}22` } as CSSProperties)
                            : undefined
                        }
                      >
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ background: opt.swatch }}
                        />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Section>

          {/* Döviz kurları */}
          <Section
            icon={<Coins className="h-[18px] w-[18px]" />}
            title="Döviz Kurları"
            description="1 birim yabancı paranın TL karşılığı — tüm hesaplamalarda kullanılır"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <RateInput
                label="USD → ₺"
                value={settings.rates.USD}
                onChange={(v) => updateSettings({ rates: { ...settings.rates, USD: v } })}
              />
              <RateInput
                label="EUR → ₺"
                value={settings.rates.EUR}
                onChange={(v) => updateSettings({ rates: { ...settings.rates, EUR: v } })}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-faint">
              Farklı para birimindeki kayıtlar seçtiğiniz gösterim birimine bu kurlarla çevrilir.
            </p>
          </Section>

          {/* Duvar kağıdı */}
          <Section
            icon={<ImageIcon className="h-[18px] w-[18px]" />}
            title="Hareketli Duvar Kağıdı"
            description="Uygulama arka planı için canlı efekt"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                {WALLPAPER_OPTIONS.map((opt) => {
                  const active = settings.wallpaper === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSettings({ wallpaper: opt.value })}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all active:scale-[0.98]",
                        active ? "border-brand bg-brand-50 dark:bg-brand/15" : "border-line hover:border-brand/30",
                      )}
                    >
                      <p className={cn("text-[13px] font-bold", active ? "text-brand" : "text-ink")}>
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">{opt.hint}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Hareketli</p>
                  <p className="text-[11px] text-muted">Animasyonu aç / kapat</p>
                </div>
                <Switch
                  checked={settings.wallpaperAnimated}
                  onChange={(v) => updateSettings({ wallpaperAnimated: v })}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-ink">Yoğunluk</span>
                  <span className="tnum font-bold text-brand">{settings.wallpaperIntensity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.wallpaperIntensity}
                  onChange={(e) => updateSettings({ wallpaperIntensity: Number(e.target.value) })}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3"
                  style={{ accentColor: "rgb(var(--c-brand))" }}
                />
              </div>
            </div>
          </Section>

          {/* Bulut yedekleme */}
          <Section
            icon={<Cloud className="h-[18px] w-[18px]" />}
            title="Google Drive Yedekleme"
            description="Verileriniz Drive'ınızda gizli appDataFolder'a yedeklenir"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <CloudStatusChip />
                {connected ? (
                  <span className="text-xs text-muted">
                    {account ? account : "Google hesabı bağlı"}
                  </span>
                ) : null}
              </div>

              <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
                  Son yedekleme
                </p>
                <p className="tnum mt-0.5 text-sm font-bold text-ink">{formatStamp(lastBackupAt)}</p>
              </div>

              {!connected ? (
                <>
                  <Field
                    label="Google İstemci Kimliği (Client ID)"
                    hint="Google Cloud Console → Kimlik Bilgileri → OAuth İstemci Kimliği"
                  >
                    <Input
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="xxxxx.apps.googleusercontent.com"
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </Field>

                  <div className="rounded-xl border border-brand/25 bg-brand-50/70 p-3.5 dark:bg-brand/10">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <div className="space-y-1.5 text-[11.5px] leading-relaxed text-muted">
                        <p className="font-semibold text-ink">Kurulum (tek seferlik)</p>
                        <p>
                          Google Cloud Console'da bir proje açın, <strong>Google Drive API</strong>'yi
                          etkinleştirin ve bir <strong>OAuth 2.0 İstemci Kimliği</strong> (Web
                          uygulaması) oluşturun.
                        </p>
                        <p>Yetkili JavaScript kaynağı olarak şu adresi ekleyin:</p>
                        <button
                          type="button"
                          onClick={copyOrigin}
                          className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-left font-mono text-[11px] text-ink transition hover:border-brand/40"
                        >
                          <span className="truncate">{origin}</span>
                          <Copy className="h-3.5 w-3.5 shrink-0 text-faint" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    block
                    leftIcon={<Link2 className="h-4 w-4" />}
                    disabled={connecting || !clientId.trim() || !online}
                    onClick={handleConnect}
                  >
                    {connecting ? "Bağlanıyor..." : "Google ile Bağlan"}
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-ink">Otomatik yedekleme</p>
                      <p className="text-[11px] text-muted">Değişikliklerden sonra otomatik yedekler</p>
                    </div>
                    <Switch
                      checked={settings.backup.autoBackup}
                      onChange={(v) => backup.patchBackup({ autoBackup: v })}
                    />
                  </div>

                  <Field label="Yedekleme aralığı">
                    <Select
                      value={settings.backup.intervalMinutes}
                      onChange={(e) =>
                        backup.patchBackup({ intervalMinutes: Number(e.target.value) })
                      }
                    >
                      {BACKUP_INTERVALS.map((m) => (
                        <option key={m} value={m}>
                          {m} dakikada bir
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      variant="primary"
                      leftIcon={
                        <RefreshCw className={cn("h-4 w-4", status === "syncing" && "animate-spin")} />
                      }
                      disabled={status === "syncing" || !online}
                      onClick={() => void backup.runBackup(false)}
                    >
                      Şimdi Yedekle
                    </Button>
                    <Button
                      variant="secondary"
                      leftIcon={<Cloud className="h-4 w-4" />}
                      disabled={status === "syncing" || !online}
                      onClick={handleCloudRestore}
                    >
                      Geri Yükle
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    block
                    leftIcon={<Unlink className="h-4 w-4" />}
                    onClick={backup.disconnectGoogle}
                  >
                    Bağlantıyı Kes
                  </Button>
                </div>
              )}
            </div>
          </Section>

          {/* Veri yönetimi */}
          <Section
            icon={<Database className="h-[18px] w-[18px]" />}
            title="Veri Yönetimi"
            description={`${transactions.length} kayıt · tarayıcıda (localStorage) saklanır`}
          >
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={backup.exportLocalBackup}
              >
                Yedek İndir
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => fileRef.current?.click()}
              >
                Yedek Yükle
              </Button>
              <Button
                variant="secondary"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                onClick={() => {
                  resetDemoData();
                  toast.success("Örnek veriler yüklendi");
                }}
              >
                Örnek Veri
              </Button>
              <Button
                variant="danger"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setDialog("clear")}
              >
                Tümünü Sil
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </Section>
        </div>
      </Sheet>

      <ConfirmDialog
        open={dialog === "restore"}
        title="Yedeği geri yükle"
        message={
          pending
            ? `${pending.transactions.length} kayıt mevcut verilerin yerine yüklenecek. Bu işlem mevcut kayıtların üzerine yazar. Devam edilsin mi?`
            : ""
        }
        confirmLabel="Geri Yükle"
        tone="brand"
        onConfirm={applyRestore}
        onCancel={() => {
          setDialog(null);
          setPending(null);
        }}
      />

      <ConfirmDialog
        open={dialog === "clear"}
        title="Tüm kayıtları sil"
        message="Bütün işlem kayıtları silinecek. Silindikten sonra açılan bildirimden kısa süre içinde geri alabilirsiniz. Devam edilsin mi?"
        confirmLabel="Tümünü Sil"
        onConfirm={() => {
          const snapshot = transactions;
          clearAll();
          toast.success(
            "Tüm kayıtlar silindi",
            `${snapshot.length} kayıt silindi.`,
            {
              label: "Geri Al",
              onClick: () => {
                importData(snapshot);
                toast.info("Geri alındı", `${snapshot.length} kayıt geri yüklendi.`);
              },
            },
            8000,
          );
          setDialog(null);
        }}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}
