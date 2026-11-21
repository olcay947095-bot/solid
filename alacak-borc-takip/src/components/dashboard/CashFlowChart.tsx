import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Currency } from "@/types";
import { useLedger } from "@/store/LedgerProvider";
import { monthlyCashFlow, type CashFlowPoint } from "@/lib/ledger";
import { formatCompact, formatCurrency } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface TooltipItem {
  dataKey?: string | number;
  value?: number;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
  currency: Currency;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-pop">
      <p className="mb-2 text-xs font-bold text-ink">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p) => (
          <div key={String(p.dataKey)} className="flex items-center justify-between gap-6 text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.dataKey === "alacak" ? "Alacak" : "Borç"}
            </span>
            <span className="tnum font-semibold text-ink">{formatCurrency(p.value ?? 0, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ total, color, label }: { total: string; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className="tnum text-xs font-bold text-ink">{total}</span>
    </div>
  );
}

export function CashFlowChart() {
  const { transactions, displayCurrency, theme, loading } = useLedger();

  const data = useMemo(
    () => monthlyCashFlow(transactions, displayCurrency, 6),
    [transactions, displayCurrency],
  );

  const totals = useMemo(
    () =>
      data.reduce(
        (acc: { alacak: number; borc: number }, p: CashFlowPoint) => {
          acc.alacak += p.alacak;
          acc.borc += p.borc;
          return acc;
        },
        { alacak: 0, borc: 0 },
      ),
    [data],
  );

  const grid = theme === "dark" ? "#293347" : "#E2E8F0";
  const axis = theme === "dark" ? "#94A3B8" : "#64748B";

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Nakit Akışı"
        subtitle="Son 6 ayın vade bazlı alacak / borç karşılaştırması"
        action={
          <div className="hidden items-center gap-4 sm:flex">
            <Legend
              total={formatCompact(totals.alacak, displayCurrency)}
              color="#10B981"
              label="Alacak"
            />
            <Legend total={formatCompact(totals.borc, displayCurrency)} color="#EF4444" label="Borç" />
          </div>
        }
      />

      <div className="mt-4 h-[280px] w-full">
        {loading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 6, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAlacak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBorc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke={grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: axis, fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tickFormatter={(v) => formatCompact(Number(v), displayCurrency)}
                tick={{ fill: axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<ChartTooltip currency={displayCurrency} />} cursor={{ stroke: grid }} />
              <Area
                type="monotone"
                dataKey="alacak"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#gradAlacak)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="borc"
                stroke="#EF4444"
                strokeWidth={2.5}
                fill="url(#gradBorc)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={cn("mt-4 flex items-center gap-5 border-t border-line pt-4 sm:hidden")}>
        <Legend total={formatCompact(totals.alacak, displayCurrency)} color="#10B981" label="Alacak" />
        <Legend total={formatCompact(totals.borc, displayCurrency)} color="#EF4444" label="Borç" />
      </div>
    </Card>
  );
}
