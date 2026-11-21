import type { Currency, LedgerRow } from "@/types";
import { BRAND, STATUS_META } from "@/lib/constants";
import { TX_TYPE_LABEL } from "@/lib/ledger";
import { formatCurrency, formatDate, formatDateLong, todayISO } from "@/lib/format";

export type ReportScope = "all" | "contact";

export interface ReportOptions {
  rows: LedgerRow[];
  scope: ReportScope;
  contact?: string;
  from?: string;
  to?: string;
  typeLabel: string;
  displayCurrency: Currency;
  /** Aktif durum filtresi (ör. "Bekliyor"). Boşsa rapora eklenmez. */
  statusLabel?: string;
  /** Aktif kategori filtresi. Boşsa rapora eklenmez. */
  categoryLabel?: string;
  /** Aktif serbest arama terimi. Boşsa rapora eklenmez. */
  searchLabel?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dateRangeLabel(from?: string, to?: string): string {
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  if (from) return `${formatDate(from)} ve sonrası`;
  if (to) return `${formatDate(to)} ve öncesi`;
  return "Tüm Zamanlar";
}

const STATUS_COLORS: Record<string, string> = {
  paid: "#10B981",
  overdue: "#EF4444",
  partial: "#F59E0B",
  pending: "#059669",
};

/** Rapor letterhead'inde kullanılan eczane logosu — "S" harfi ve sağlık haçı. */
const LOGO_SVG = `<svg viewBox="0 0 48 48" width="27" height="27" aria-hidden="true">
      <path d="M32.5 19.7c0-4.7-17-4.7-17 1.5s17 3.4 17 9.6-17 6.2-17 1.5" fill="none" stroke="#fff" stroke-width="6.8" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="36.5" cy="12" r="6.9" fill="#fff" />
      <rect x="34" y="7.5" width="5" height="9" rx="2.5" fill="#059669" />
      <rect x="32" y="9.5" width="9" height="5" rx="2.5" fill="#059669" />
    </svg>`;

/** Yazdırılabilir, markalı rapor HTML'i üretir. */
export function buildReportHtml(opts: ReportOptions): string {
  const { rows, scope, contact, from, to, typeLabel, displayCurrency, statusLabel, categoryLabel, searchLabel } = opts;

  let receivable = 0;
  let payable = 0;
  let paid = 0;
  for (const row of rows) {
    if (row.tx.type === "receivable") receivable += row.remaining;
    else payable += row.remaining;
    paid += row.paid;
  }
  const net = receivable - payable;

  const scopeLabel = scope === "contact" ? `Cari: ${contact ?? "-"}` : "Tüm Kayıtlar";

  const metaItems: { k: string; v: string }[] = [
    { k: "Kapsam", v: scopeLabel },
    { k: "İşlem Türü", v: typeLabel },
  ];
  if (statusLabel) metaItems.push({ k: "Durum", v: statusLabel });
  if (categoryLabel) metaItems.push({ k: "Kategori", v: categoryLabel });
  if (searchLabel) metaItems.push({ k: "Arama", v: `“${searchLabel}”` });
  metaItems.push({ k: "Vade Aralığı", v: dateRangeLabel(from, to) });
  metaItems.push({ k: "Oluşturma", v: formatDateLong(todayISO()) });

  const metaHtml = metaItems
    .map(
      (item) =>
        `<div class="item"><div class="k">${escapeHtml(item.k)}</div><div class="v">${escapeHtml(
          item.v,
        )}</div></div>`,
    )
    .join("");

  const bodyRows = rows
    .map((row) => {
      const { tx } = row;
      const color = STATUS_COLORS[row.status] ?? "#4F46E5";
      const amountColor = tx.type === "receivable" ? "#059669" : "#DC2626";
      return `<tr>
        <td>${escapeHtml(tx.contactName)}</td>
        <td><span class="type" style="color:${amountColor}">${escapeHtml(TX_TYPE_LABEL[tx.type])}</span></td>
        <td>${escapeHtml(tx.category)}</td>
        <td>${escapeHtml(formatDate(row.nextDueDate))}</td>
        <td class="num">${escapeHtml(formatCurrency(row.total, displayCurrency))}</td>
        <td class="num">${escapeHtml(formatCurrency(row.paid, displayCurrency))}</td>
        <td class="num strong">${escapeHtml(formatCurrency(row.remaining, displayCurrency))}</td>
        <td><span class="badge" style="color:${color};background:${color}1A">${escapeHtml(
          STATUS_META[row.status].label,
        )}</span></td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(BRAND.full)} — Alacak &amp; Borç Raporu</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px;
    font-family: "Plus Jakarta Sans", -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    color: #0F172A;
    background: #FFFFFF;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .logo {
    width: 46px; height: 46px; border-radius: 14px; flex: none;
    background: linear-gradient(135deg, #12D98C, #059669 55%, #036B52);
    display: flex; align-items: center; justify-content: center;
  }
  .name { font-size: 16px; margin: 0; font-weight: 800; letter-spacing: 0.02em; }
  .name .suffix { color: #059669; font-weight: 700; }
  .sub {
    color: #64748B; font-size: 10.5px; margin: 3px 0 0; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.16em;
  }
  .muted { color: #64748B; font-size: 12px; margin: 2px 0 0; }
  .rule { height: 4px; border-radius: 999px; background: linear-gradient(90deg,#059669,#10B981,#C9A227); margin: 20px 0; }
  .meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
  .meta .item {
    border: 1px solid #E2E8F0; border-radius: 10px; padding: 8px 12px; min-width: 150px;
  }
  .meta .item .k { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #94A3B8; font-weight: 700; }
  .meta .item .v { font-size: 13px; font-weight: 700; margin-top: 2px; }
  .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 22px; }
  .tile { border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; }
  .tile .k { font-size: 11px; color: #64748B; font-weight: 600; }
  .tile .v { font-size: 16px; font-weight: 800; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th {
    text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em;
    color: #64748B; border-bottom: 1.5px solid #CBD5E1; padding: 8px 8px;
  }
  tbody td { border-bottom: 1px solid #EEF2F7; padding: 8px 8px; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .strong { font-weight: 800; }
  .type { font-weight: 700; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
  .empty { padding: 24px; text-align: center; color: #94A3B8; font-size: 13px; }
  .foot { margin-top: 24px; font-size: 11px; color: #94A3B8; }
  @page { size: A4; margin: 14mm; }
</style>
</head>
<body>
  <div class="brand">
    <div class="logo">${LOGO_SVG}</div>
    <div>
      <h1 class="name">${escapeHtml(BRAND.name)} <span class="suffix">${escapeHtml(BRAND.suffix)}</span></h1>
      <p class="sub">Alacak &amp; Borç Raporu</p>
    </div>
  </div>

  <div class="rule"></div>

  <div class="meta">${metaHtml}</div>

  <div class="tiles">
    <div class="tile"><div class="k">Alacak (Kalan)</div><div class="v" style="color:#059669">${escapeHtml(
      formatCurrency(receivable, displayCurrency),
    )}</div></div>
    <div class="tile"><div class="k">Borç (Kalan)</div><div class="v" style="color:#DC2626">${escapeHtml(
      formatCurrency(payable, displayCurrency),
    )}</div></div>
    <div class="tile"><div class="k">Net Bakiye</div><div class="v" style="color:${
      net >= 0 ? "#059669" : "#DC2626"
    }">${escapeHtml(formatCurrency(net, displayCurrency))}</div></div>
    <div class="tile"><div class="k">Tahsil / Ödenen</div><div class="v" style="color:#059669">${escapeHtml(
      formatCurrency(paid, displayCurrency),
    )}</div></div>
  </div>

  ${
    rows.length === 0
      ? '<div class="empty">Seçili kriterlere uygun kayıt bulunmuyor.</div>'
      : `<table>
    <thead>
      <tr>
        <th>Kişi / Firma</th>
        <th>Tür</th>
        <th>Kategori</th>
        <th>Vade</th>
        <th class="num">Toplam</th>
        <th class="num">Ödenen</th>
        <th class="num">Kalan</th>
        <th>Durum</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>`
  }

  <p class="foot">
    Toplam ${rows.length} kayıt · Tüm tutarlar ${escapeHtml(displayCurrency)} birimine sabit kur ile çevrilmiştir.
    Bu rapor ${escapeHtml(BRAND.full)} takip paneli ile oluşturulmuştur.
  </p>
</body>
</html>`;
}

/** Raporun nasıl sunulduğunu belirtir. */
export type PdfOutcome = "print" | "window" | "download" | "blocked";

/** Gizli bir çerçevede raporu yazdırır — açılır pencere engeline takılmaz. */
function printInFrame(html: string): boolean {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;";
  document.body.appendChild(frame);

  try {
    const win = frame.contentWindow;
    if (!win) throw new Error("frame yok");

    // Kısıtlı (opak kökenli) kum havuzunda document erişimi burada hata verir.
    const doc = win.document;
    doc.open();
    doc.write(html);
    doc.close();

    window.setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* yazdırma engellendiyse çerçeve sessizce kaldırılır */
      } finally {
        window.setTimeout(() => frame.remove(), 1200);
      }
    }, 400);

    return true;
  } catch {
    frame.remove();
    return false;
  }
}

/** Raporu Blob URL ile yeni sekmede açar. */
function openInNewTab(html: string): boolean {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

/** Raporu indirilebilir bir dosya olarak kaydeder (kısıtlı ortamlarda son çare). */
function downloadHtml(html: string): void {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${BRAND.full} - Alacak Borc Raporu.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Raporu yazdırma/PDF görünümüyle sunar. Önce gizli çerçeve ile yazdırmayı dener
 * (açılır pencere engeline takılmaz); olmazsa yeni sekme; o da engellenirse dosya indirir.
 */
export function exportReportPdf(opts: ReportOptions): PdfOutcome {
  const html = buildReportHtml(opts);

  if (printInFrame(html)) return "print";

  try {
    if (openInNewTab(html)) return "window";
  } catch {
    /* yeni sekme engellendi → indirme yoluna düş */
  }

  try {
    downloadHtml(html);
    return "download";
  } catch {
    return "blocked";
  }
}

/** PDF sunum sonucunu kullanıcı bildirimine çevirir. */
export function pdfOutcomeToast(outcome: PdfOutcome): {
  tone: "success" | "error" | "info";
  title: string;
  description: string;
} {
  switch (outcome) {
    case "print":
      return {
        tone: "success",
        title: "Yazdırma penceresi açıldı",
        description: "Hedef olarak “PDF olarak kaydet” seçeneğini kullanabilirsiniz.",
      };
    case "window":
      return {
        tone: "success",
        title: "Rapor hazırlandı",
        description: "Açılan sekmeden “PDF olarak kaydet” seçebilirsiniz.",
      };
    case "download":
      return {
        tone: "info",
        title: "Rapor indirildi",
        description: "Dosyayı açıp “Yazdır → PDF olarak kaydet” ile PDF'e çevirebilirsiniz.",
      };
    default:
      return {
        tone: "error",
        title: "Rapor açılamadı",
        description: "Tarayıcınız açılır pencere ve yazdırmayı engelliyor olabilir.",
      };
  }
}
