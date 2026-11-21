import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3, Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import type { TxType } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { useToast } from "@/store/ToastProvider";
import { monthlyCashFlow } from "@/lib/ledger";
import { formatCompact, formatCurrency } from "@/lib/format";
import { downloadCsv, downloadExcel } from "@/lib/csv";
import { exportReportPdf, pdfOutcomeToast, type ReportScope } from "@/lib/report";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#059669",
  "#10B981",
  "#0EA5E9",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
  "#84CC16",
  "#F97316",
  "#EC4899",
];

const TYPE_OPTIONS = [
  { value: "all" as const, label: "Tümü" },
  { value: "receivable" as const, label: "Alacaklar" },
  { value: "payable" as const, label: "Borçlar" },
];

const SCOPE_OPTIONS: { value: ReportScope; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "contact", label: "Cari" },
];

export function ReportsView() {
  const { rows, displayCurrency, loading } = useLedger();
  const toast = useToast();
  const [type, setType] = useState<"all" | TxType>("all");
  const [scope, setScope] = useState<ReportScope>("all");
  const [contact, setContact] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const contacts = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.tx.contactName) set.add(r.tx.contactName);
    return [...set].sort((a, b) => a.localeCompare(b, "tr"));
  }, [rows]);

  // Seçili cari boş ya da geçersizse ilk cariye düş.
  const activeContact = contacts.includes(contact) ? contact : contacts[0] ?? "";

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (type !== "all" && r.tx.type !== type) return false;
        if (scope === "contact" && r.tx.contactName !== activeContact) return false;
        if (from && r.tx.dueDate < from) return false;
        if (to && r.tx.dueDate > to) return false;
        return true;
      }),
    [rows, type, scope, activeContact, from, to],
  );

  const filteredTxs = useMemo(() => filtered.map((r) => r.tx), [filtered]);

  const totals = useMemo(() => {
    let receivable = 0;
    let payable = 0;
    let paid = 0;
    for (const r of filtered) {
      if (r.tx.type === "receivable") receivable += r.remaining;
      else payable += r.remaining;
      paid += r.paid;
    }
    return { receivable, payable, net: receivable - payable, paid };
  }, [filtered]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.tx.category, (map.get(r.tx.category) ?? 0) + r.total);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const cashFlow = useMemo(
    () => monthlyCashFlow(filteredTxs, displayCurrency, 6),
    [filteredTxs, displayCurrency],
  );

  const categoryTotal = categoryData.reduce((s, c) => s + c.value, 0);

  const handleExport = (kind: "csv" | "excel") => {
    if (filtered.length === 0) {
      toast.warning("Dışa aktarılacak kayıt yok", "Lütfen filtreleri değiştirin.");
      return;
    }
    if (kind === "csv") {
      downloadCsv(filtered);
      toast.success("CSV indirildi", `${filtered.length} kayıt dışa aktarıldı.`);
    } else {
      downloadExcel(filtered);
      toast.success("Excel indirildi", `${filtered.length} kayıt dışa aktarıldı.`);
    }
  };

  const handlePdf = () => {
    if (filtered.length === 0) {
      toast.warning("Raporlanacak kayıt yok", "Lütfen filtreleri değiştirin.");
      return;
    }
    const outcome = exportReportPdf({
      rows: filtered,
      scope,
      contact: activeContact,
      from,
      to,
      typeLabel: TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Tümü",
      displayCurrency,
    });
    const notice = pdfOutcomeToast(outcome);
    toast[notice.tone](notice.title, notice.description);
  };

  return (
    <div className="space-y-5">
      {/* Filtre + Dışa aktarma */}
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex w-full flex-1 flex-wrap items-end gap-3">
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-ink">Tür</p>
              <Segmented options={TYPE_OPTIONS} value={type} onChange={setType} size="sm" />
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-ink">Rapor Kapsamı</p>
              <Segmented options={SCOPE_OPTIONS} value={scope} onChange={setScope} size="sm" />
            </div>
            {scope === "contact" ? (
              <Field label="Cari" className="w-full sm:w-[190px]">
                <Select value={activeContact} onChange={(e) => setContact(e.target.value)}>
                  {contacts.length === 0 ? <option value="">Kayıtlı cari yok</option> : null}
                  {contacts.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label="Başlangıç" className="w-[calc(50%_-_0.375rem)] sm:w-[150px]">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Bitiş" className="w-[calc(50%_-_0.375rem)] sm:w-[150px]">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Field label="Para Birimi" className="w-[calc(50%_-_0.375rem)] sm:w-[130px]">
              <Select value={displayCurrency} disabled>
                <option value={displayCurrency}>{displayCurrency}</option>
              </Select>
            </Field>
          </div>
          <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              leftIcon={<FileText className="h-4 w-4" />}
              onClick={() => handleExport("csv")}
            >
              CSV İndir
            </Button>
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              leftIcon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() => handleExport("excel")}
            >
              Excel İndir
            </Button>
            <Button
              variant="primary"
              className="flex-1 sm:flex-none"
              leftIcon={<Printer className="h-4 w-4" />}
              rightIcon={<Download className="h-4 w-4 opacity-70" />}
              onClick={handlePdf}
            >
              PDF Rapor
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI recap */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Alacak (Kalan)" value={formatCurrency(totals.receivable, displayCurrency)} tone="success" />
        <Tile label="Borç (Kalan)" value={formatCurrency(totals.payable, displayCurrency)} tone="danger" />
        <Tile
          label="Net Bakiye"
          value={formatCurrency(totals.net, displayCurrency)}
          tone={totals.net >= 0 ? "success" : "danger"}
        />
        <Tile label="Tahsil / Ödenen" value={formatCurrency(totals.paid, displayCurrency)} tone="brand" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Kategori dağılımı */}
        <Card>
          <CardHeader title="Kategori Bazlı Dağılım" subtitle={`${categoryData.length} kategori · toplam ${formatCompact(categoryTotal, displayCurrency)}`} />
          {loading ? null : categoryData.length === 0 ? (
            <EmptyState icon={<BarChart3 className="h-6 w-6" />} title="Veri yok" description="Seçili filtreler için kayıt bulunmuyor." />
          ) : (
            <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
              <div className="h-[200px] w-full sm:w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, n: string) => [formatCurrency(Number(v), displayCurrency), n]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgb(var(--c-border))",
                        background: "rgb(var(--c-surface))",
                        fontSize: 12,
                        color: "rgb(var(--c-ink))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full flex-1 space-y-2">
                {categoryData.slice(0, 6).map((c, i) => {
                  const pct = categoryTotal > 0 ? (c.value / categoryTotal) * 100 : 0;
                  return (
                    <div key={c.name} className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: PALETTE[i % PALETTE.length] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{c.name}</span>
                      <span className="tnum text-xs font-bold text-ink">
                        {formatCurrency(c.value, displayCurrency)}
                      </span>
                      <span className="tnum w-10 text-right text-[11px] text-faint">{Math.round(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Aylık nakit akışı */}
        <Card>
          <CardHeader title="Aylık Nakit Akışı" subtitle="Son 6 ay · vade bazlı" />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Ay</th>
                  <th className="pb-2 text-right text-[11px] font-bold uppercase tracking-wide text-faint">Alacak</th>
                  <th className="pb-2 text-right text-[11px] font-bold uppercase tracking-wide text-faint">Borç</th>
                  <th className="pb-2 text-right text-[11px] font-bold uppercase tracking-wide text-faint">Net</th>
                </tr>
              </thead>
              <tbody>
                {cashFlow.map((p) => {
                  const net = p.alacak - p.borc;
                  return (
                    <tr key={p.key} className="border-t border-line">
                      <td className="py-2.5 text-[13px] font-semibold capitalize text-ink">{p.label}</td>
                      <td className="tnum py-2.5 text-right text-[13px] font-semibold text-receivable">
                        {formatCurrency(p.alacak, displayCurrency)}
                      </td>
                      <td className="tnum py-2.5 text-right text-[13px] font-semibold text-payable">
                        {formatCurrency(p.borc, displayCurrency)}
                      </td>
                      <td
                        className={cn(
                          "tnum py-2.5 text-right text-[13px] font-bold",
                          net >= 0 ? "text-ink" : "text-payable",
                        )}
                      >
                        {formatCurrency(net, displayCurrency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p className="px-1 text-xs text-faint">
        Tüm tutarlar seçili gösterim para birimine ({displayCurrency}) sabit kur ile çevrilmiştir. Dışa aktarılan dosyalar işlemlerin kendi para birimini içerir.
      </p>
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "brand";
}) {
  const color = tone === "success" ? "text-receivable" : tone === "danger" ? "text-payable" : "text-brand";
  return (
    <div className="card px-4 py-3">
      <p className="truncate text-[11px] font-semibold text-muted">{label}</p>
      <p className={cn("tnum mt-1 truncate text-base font-extrabold", color)}>{value}</p>
    </div>
  );
}
