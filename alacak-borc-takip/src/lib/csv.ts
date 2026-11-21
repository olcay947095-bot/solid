import type { LedgerRow } from "@/types";
import { STATUS_META } from "@/lib/constants";
import { TX_TYPE_LABEL, remainingAmount, totalPaid } from "@/lib/ledger";
import { formatDate } from "@/lib/format";

const HEADERS = [
  "Kişi / Firma",
  "Tür",
  "Telefon",
  "Kategori",
  "Açıklama",
  "Tutar",
  "Para Birimi",
  "İşlem Tarihi",
  "Vade",
  "Durum",
  "Ödenen",
  "Kalan",
];

/** Para sütunlarının indeksleri — Excel'de sağa hizalı, sayı biçimiyle yazılır. */
const NUMERIC_COLUMNS = new Set([5, 10, 11]);

/* Marka yeşili ve hairline tonları — rapor/Pdf çıktısıyla aynı palet. */
const BRAND_HEADER_BG = "#059669";
const HEADER_BORDER = "#CBD5E1";
const CELL_BORDER = "#E2E8F0";

function number(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function matrix(rows: LedgerRow[]): string[][] {
  return rows.map((row) => {
    const { tx } = row;
    return [
      tx.contactName,
      TX_TYPE_LABEL[tx.type],
      tx.contactPhone ?? "",
      tx.category,
      tx.description ?? "",
      number(tx.amount),
      tx.currency,
      formatDate(tx.issueDate),
      formatDate(tx.dueDate),
      STATUS_META[row.status].label,
      number(totalPaid(tx)),
      number(remainingAmount(tx)),
    ];
  });
}

function csvCell(value: string): string {
  if (/[";\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function fileStamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Satırları UTF-8 BOM'lu, noktalı virgülle ayrılmış CSV olarak indirir. */
export function downloadCsv(rows: LedgerRow[]): void {
  const lines = [HEADERS, ...matrix(rows)].map((row) => row.map(csvCell).join(";"));
  const content = `\uFEFF${lines.join("\r\n")}`;
  triggerDownload(new Blob([content], { type: "text/csv;charset=utf-8;" }), `alacak-borc-${fileStamp()}.csv`);
}

/** Satırları Excel'in açabileceği HTML tablo (.xls) olarak indirir. */
export function downloadExcel(rows: LedgerRow[]): void {
  const body = matrix(rows);
  const headerCells = HEADERS.map((header, index) => {
    const align = NUMERIC_COLUMNS.has(index) ? "right" : "left";
    return `<th style="background:${BRAND_HEADER_BG};color:#ffffff;border:1px solid ${HEADER_BORDER};padding:6px 10px;text-align:${align};font-size:12px;font-weight:700;">${escapeHtml(
      header,
    )}</th>`;
  }).join("");
  const bodyRows = body
    .map(
      (cells) =>
        `<tr>${cells
          .map((cell, index) =>
            NUMERIC_COLUMNS.has(index)
              ? `<td style="border:1px solid ${CELL_BORDER};padding:6px 10px;font-size:12px;text-align:right;mso-number-format:'#,##0.00';">${escapeHtml(
                  cell,
                )}</td>`
              : `<td style="border:1px solid ${CELL_BORDER};padding:6px 10px;font-size:12px;">${escapeHtml(
                  cell,
                )}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  const html = `<html><head><meta charset="utf-8" /></head><body><table style="border-collapse:collapse;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
  triggerDownload(
    new Blob([`\uFEFF${html}`], { type: "application/vnd.ms-excel;charset=utf-8" }),
    `alacak-borc-${fileStamp()}.xls`,
  );
}
