import type { Currency, LedgerRow } from "@/types";
import { STATUS_META } from "@/lib/constants";
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
  pending: "#4F46E5",
};

/** Yazdırılabilir, markalı rapor HTML'i üretir. */
export function buildReportHtml(opts: ReportOptions): string {
  const { rows, scope, contact, from, to, typeLabel, displayCurrency } = opts;

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
<title>Alacak & Borç Raporu</title>
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
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo {
    width: 44px; height: 44px; border-radius: 12px;
    background: linear-gradient(135deg, #4F46E5, #7C3AED);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 18px;
  }
  h1 { font-size: 20px; margin: 0; font-weight: 800; }
  .muted { color: #64748B; font-size: 12px; margin: 2px 0 0; }
  .rule { height: 4px; border-radius: 999px; background: linear-gradient(90deg,#4F46E5,#7C3AED,#0EA5E9); margin: 20px 0; }
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
    <div class="logo">₺</div>
    <div>
      <h1>Alacak &amp; Borç Raporu</h1>
      <p class="muted">Alacak ve Borç Takip Paneli</p>
    </div>
  </div>

  <div class="rule"></div>

  <div class="meta">
    <div class="item"><div class="k">Kapsam</div><div class="v">${escapeHtml(scopeLabel)}</div></div>
    <div class="item"><div class="k">İşlem Türü</div><div class="v">${escapeHtml(typeLabel)}</div></div>
    <div class="item"><div class="k">Vade Aralığı</div><div class="v">${escapeHtml(dateRangeLabel(from, to))}</div></div>
    <div class="item"><div class="k">Oluşturma</div><div class="v">${escapeHtml(formatDateLong(todayISO()))}</div></div>
  </div>

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
    <div class="tile"><div class="k">Tahsil / Ödenen</div><div class="v" style="color:#4F46E5">${escapeHtml(
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
    Bu rapor Alacak &amp; Borç Takip uygulaması ile oluşturulmuştur.
  </p>
</body>
</html>`;
}

/** Raporu yeni bir pencerede açar ve yazdırma/PDF görünümünü tetikler. */
export function exportReportPdf(opts: ReportOptions): boolean {
  const html = buildReportHtml(opts);
  const win = window.open("", "_blank", "width=980,height=1040");
  if (!win) return false;

  win.document.open();
  win.document.write(html);
  win.document.close();

  const trigger = () => {
    try {
      win.focus();
      win.print();
    } catch {
      /* yazdırma çağrısı engellendiyse pencere açık kalır */
    }
  };

  if (win.document.readyState === "complete") {
    setTimeout(trigger, 250);
  } else {
    win.addEventListener("load", () => setTimeout(trigger, 250));
  }

  return true;
}
