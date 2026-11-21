import { Activity, Pill, ShieldCheck } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { Logo } from "@/components/brand/Logo";

const CHIPS = [
  { icon: ShieldCheck, label: "Bulut Yedek" },
  { icon: Activity, label: "Anlık Takip" },
  { icon: Pill, label: "Eczane Odaklı" },
];

/** Panonun tepesindeki kurumsal kimlik bandı — marka, tema ve güven vurgusu. */
export function BrandBanner() {
  return (
    <section className="sheen relative overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-br from-[#04372B] via-[#06503C] to-[#021A14] p-5 text-white shadow-card sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 opacity-[0.12]">
        <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
          <rect x="19" y="3" width="10" height="42" rx="5" fill="#fff" />
          <rect x="3" y="19" width="42" height="10" rx="5" fill="#fff" />
        </svg>
      </div>
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-[#10B981]/25 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/95 shadow-lg ring-1 ring-white/40">
            <Logo size={40} glow={false} />
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-emerald-200/80">
              {BRAND.tagline}
            </p>
            <h2 className="mt-1 truncate text-xl font-extrabold leading-tight sm:text-2xl">
              {BRAND.name} <span className="font-semibold text-emerald-200">{BRAND.suffix}</span>
            </h2>
            <span className="mt-2 block h-[3px] w-14 rounded-full bg-gradient-to-r from-[#12D98C] to-[#F0D07A]" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CHIPS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90 ring-1 ring-white/15 backdrop-blur"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
