import type { Currency, LedgerRow } from "@/types";
import { BRAND, STATUS_META } from "@/lib/constants";
import { TX_TYPE_LABEL } from "@/lib/ledger";
import { formatCurrency, formatDate, formatDateLong, todayISO } from "@/lib/format";
import regularFontUrl from "@/assets/fonts/NotoSans-Regular.ttf?url";
import boldFontUrl from "@/assets/fonts/NotoSans-Bold.ttf?url";

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
    Toplam ${rows.length} kayıt · Tüm tutarlar ${escapeHtml(displayCurrency)} birimine Ayarlar'da tanımlı döviz kurlarıyla çevrilmiştir.
    Bu rapor ${escapeHtml(BRAND.full)} takip paneli ile oluşturulmuştur.
  </p>
</body>
</html>`;
}

/* --- Gerçek PDF üretimi (jsPDF) ---------------------------------------------- */

const RGB = {
  brand: [5, 150, 105],
  brandSoft: [247, 250, 249],
  gold: [201, 162, 39],
  ink: [15, 23, 42],
  muted: [100, 116, 139],
  faint: [148, 163, 184],
  line: [226, 232, 240],
  white: [255, 255, 255],
  receivable: [5, 150, 105],
  payable: [220, 38, 38],
} as const;

const STATUS_RGB: Record<string, readonly [number, number, number]> = {
  paid: [16, 185, 129],
  overdue: [239, 68, 68],
  partial: [245, 158, 11],
  pending: [5, 150, 105],
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

let fontCache: Promise<{ regular: string; bold: string }> | null = null;

/** Türkçe karakterleri destekleyen gömülü fontları (tek seferlik) yükler. */
function loadFonts(): Promise<{ regular: string; bold: string }> {
  if (!fontCache) {
    fontCache = Promise.all([fetch(regularFontUrl), fetch(boldFontUrl)])
      .then(async ([regular, bold]) => ({
        regular: arrayBufferToBase64(await regular.arrayBuffer()),
        bold: arrayBufferToBase64(await bold.arrayBuffer()),
      }))
      .catch((err) => {
        fontCache = null;
        throw err;
      });
  }
  return fontCache;
}

/** Rapordan gerçek bir PDF (Blob) üretir. jsPDF/fontlar yalnızca burada yüklenir. */
export async function buildReportPdf(opts: ReportOptions): Promise<Blob> {
  const { rows, scope, contact, from, to, typeLabel, displayCurrency, statusLabel, categoryLabel, searchLabel } =
    opts;

  const [{ jsPDF }, { default: autoTable }, fonts] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadFonts(),
  ]);

  let receivable = 0;
  let payable = 0;
  let paid = 0;
  for (const row of rows) {
    if (row.tx.type === "receivable") receivable += row.remaining;
    else payable += row.remaining;
    paid += row.paid;
  }
  const net = receivable - payable;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.addFileToVFS("NotoSans-Regular.ttf", fonts.regular);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", fonts.bold);
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;

  // Başlık — logo kutusu + marka adı
  const logo = 34;
  doc.setFillColor(...RGB.brand);
  doc.roundedRect(margin, margin, logo, logo, 9, 9, "F");
  doc.setTextColor(...RGB.white);
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(19);
  doc.text("S", margin + logo / 2, margin + logo / 2, { align: "center", baseline: "middle" });

  const nameX = margin + logo + 12;
  doc.setFontSize(15);
  doc.setTextColor(...RGB.ink);
  doc.text(BRAND.name, nameX, margin + 13);
  doc.setTextColor(...RGB.brand);
  doc.text(` ${BRAND.suffix}`, nameX + doc.getTextWidth(BRAND.name), margin + 13);

  doc.setFont("NotoSans", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...RGB.muted);
  doc.setCharSpace(1.5);
  doc.text("ALACAK & BORÇ RAPORU", nameX, margin + 26);
  doc.setCharSpace(0);

  // Başlık kuralı (marka yeşili → altın)
  const ruleY = margin + logo + 8;
  const goldW = 72;
  doc.setFillColor(...RGB.brand);
  doc.rect(margin, ruleY, contentW - goldW, 3, "F");
  doc.setFillColor(...RGB.gold);
  doc.rect(margin + contentW - goldW, ruleY, goldW, 3, "F");

  // Kapsam / filtre özeti
  const scopeLabel = scope === "contact" ? `Cari: ${contact ?? "-"}` : "Tüm Kayıtlar";
  const metaParts = [`Kapsam: ${scopeLabel}`, `İşlem Türü: ${typeLabel}`];
  if (statusLabel) metaParts.push(`Durum: ${statusLabel}`);
  if (categoryLabel) metaParts.push(`Kategori: ${categoryLabel}`);
  if (searchLabel) metaParts.push(`Arama: “${searchLabel}”`);
  metaParts.push(`Vade Aralığı: ${dateRangeLabel(from, to)}`);
  metaParts.push(`Oluşturma: ${formatDateLong(todayISO())}`);

  doc.setFont("NotoSans", "normal");
  doc.setFontSize(8.5);
  const metaLines = doc.splitTextToSize(metaParts.join("     •     "), contentW - 24);
  const metaTop = ruleY + 14;
  const metaH = metaLines.length * 12 + 14;
  doc.setDrawColor(...RGB.line);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, metaTop, contentW, metaH, 6, 6, "FD");
  doc.setTextColor(...RGB.muted);
  doc.text(metaLines, margin + 12, metaTop + 15);

  // Özet kutucukları
  const tileGap = 10;
  const tileW = (contentW - tileGap * 3) / 4;
  const tileH = 44;
  const tilesY = metaTop + metaH + 16;
  const tiles: { k: string; v: string; c: readonly [number, number, number] }[] = [
    { k: "Alacak (Kalan)", v: formatCurrency(receivable, displayCurrency), c: RGB.receivable },
    { k: "Borç (Kalan)", v: formatCurrency(payable, displayCurrency), c: RGB.payable },
    {
      k: "Net Bakiye",
      v: formatCurrency(net, displayCurrency),
      c: net >= 0 ? RGB.receivable : RGB.payable,
    },
    { k: "Tahsil / Ödenen", v: formatCurrency(paid, displayCurrency), c: RGB.receivable },
  ];
  tiles.forEach((tile, i) => {
    const x = margin + i * (tileW + tileGap);
    doc.setDrawColor(...RGB.line);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, tilesY, tileW, tileH, 6, 6, "FD");
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...RGB.muted);
    doc.text(tile.k, x + 10, tilesY + 16);
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...tile.c);
    doc.text(tile.v, x + 10, tilesY + 32);
  });

  const footerText = `Toplam ${rows.length} kayıt · Tüm tutarlar ${displayCurrency} birimine Ayarlar'da tanımlı döviz kurlarıyla çevrilmiştir.`;
  const drawFooter = () => {
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...RGB.faint);
    doc.text(footerText, margin, pageH - 30);
    doc.text(`Bu rapor ${BRAND.full} takip paneli ile oluşturulmuştur.`, margin, pageH - 19);
    doc.text(`Sayfa ${doc.getNumberOfPages()}`, pageW - margin, pageH - 19, { align: "right" });
  };

  const tableY = tilesY + tileH + 16;
  if (rows.length === 0) {
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...RGB.faint);
    doc.text("Seçili kriterlere uygun kayıt bulunmuyor.", pageW / 2, tableY + 24, { align: "center" });
    drawFooter();
  } else {
    autoTable(doc, {
      startY: tableY,
      head: [["Kişi / Firma", "Tür", "Kategori", "Vade", "Toplam", "Ödenen", "Kalan", "Durum"]],
      body: rows.map((row) => [
        row.tx.contactName,
        TX_TYPE_LABEL[row.tx.type],
        row.tx.category,
        formatDate(row.nextDueDate),
        formatCurrency(row.total, displayCurrency),
        formatCurrency(row.paid, displayCurrency),
        formatCurrency(row.remaining, displayCurrency),
        STATUS_META[row.status].label,
      ]),
      theme: "striped",
      styles: {
        font: "NotoSans",
        fontSize: 8,
        cellPadding: { top: 5, right: 6, bottom: 5, left: 6 },
        textColor: RGB.ink,
        overflow: "linebreak",
      },
      headStyles: {
        font: "NotoSans",
        fontStyle: "bold",
        fillColor: RGB.brand,
        textColor: RGB.white,
        fontSize: 7.5,
        halign: "left",
      },
      alternateRowStyles: { fillColor: RGB.brandSoft },
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin, top: margin, bottom: 54 },
      didParseCell: (data) => {
        if (data.section !== "body") return;
        const row = rows[data.row.index];
        if (!row) return;
        if (data.column.index === 1) {
          data.cell.styles.textColor = row.tx.type === "receivable" ? RGB.receivable : RGB.payable;
          data.cell.styles.fontStyle = "bold";
        } else if (data.column.index === 7) {
          data.cell.styles.textColor = STATUS_RGB[row.status] ?? RGB.ink;
          data.cell.styles.fontStyle = "bold";
        }
      },
      didDrawPage: drawFooter,
    });
  }

  return doc.output("blob");
}

/* --- Sunum ---------------------------------------------------------------- */

/** Raporun nasıl sunulduğunu belirtir. */
export type PdfOutcome = "open" | "download" | "blocked";

/** Raporu Blob URL ile yeni sekmede açar. */
function openInNewTab(url: string): boolean {
  const win = window.open(url, "_blank");
  if (!win) return false;
  return true;
}

/** Blob'u indirilebilir bir dosya olarak kaydeder. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Raporu gerçek bir PDF olarak üretip yeni sekmede açar.
 * Yeni sekme, kullanıcı hareketi korunması için senkron açılır; içerik async hazırlanır.
 * Açılır pencere engellenirse PDF indirilir; üretim başarısız olursa HTML raporuna düşülür.
 */
export async function exportReportPdf(opts: ReportOptions): Promise<PdfOutcome> {
  let win: Window | null = null;
  try {
    win = window.open("", "_blank");
  } catch {
    win = null;
  }

  try {
    const blob = await buildReportPdf(opts);
    const url = URL.createObjectURL(blob);
    if (win) {
      win.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
      return "open";
    }
    downloadBlob(blob, `${BRAND.full} - Alacak Borc Raporu.pdf`);
    return "download";
  } catch (err) {
    console.error("PDF üretilemedi, HTML raporuna düşülüyor:", err);
    if (win) win.close();
    try {
      const html = buildReportHtml(opts);
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      if (openInNewTab(url)) {
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return "open";
      }
      downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${BRAND.full} - Alacak Borc Raporu.html`);
      return "download";
    } catch {
      return "blocked";
    }
  }
}

/** PDF sunum sonucunu kullanıcı bildirimine çevirir. */
export function pdfOutcomeToast(outcome: PdfOutcome): {
  tone: "success" | "error" | "info";
  title: string;
  description: string;
} {
  switch (outcome) {
    case "open":
      return {
        tone: "success",
        title: "Rapor açıldı",
        description: "PDF yeni sekmede görüntüleniyor.",
      };
    case "download":
      return {
        tone: "info",
        title: "Rapor indirildi",
        description: "PDF dosyası indirilenler klasörüne kaydedildi.",
      };
    default:
      return {
        tone: "error",
        title: "Rapor açılamadı",
        description: "Tarayıcınız açılır pencereyi engelliyor olabilir.",
      };
  }
}
