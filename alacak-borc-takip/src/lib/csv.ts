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
  const headerCells = HEADERS.map(
    (header) =>
      `<th style="background:#4F46E5;color:#ffffff;border:1px solid #cbd5e1;padding:6px 10px;text-align:left;font-size:12px;">${escapeHtml(
        header,
      )}</th>`,
  ).join("");
  const bodyRows = body
    .map(
      (cells) =>
        `<tr>${cells
          .map(
            (cell) =>
              `<td style="border:1px solid #e2e8f0;padding:6px 10px;font-size:12px;">${escapeHtml(cell)}</td>`,
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
