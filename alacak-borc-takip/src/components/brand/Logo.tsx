import { cn } from "@/lib/utils";

interface LogoProps {
  /** Kenar uzunluğu (px). */
  size?: number;
  className?: string;
  /** Yumuşak yeşil parıltı gölgesi. */
  glow?: boolean;
}

/**
 * Eczane kurumsal logosu — "S" baş harfi ve sağlık haçı rozeti.
 * Canlı yeşil degrade zemin üzerinde net, belirgin ve okunaklı işaret.
 */
export function Logo({ size = 40, className, glow = true }: LogoProps) {
  const mark = Math.round(size * 0.84);
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-[#12D98C] via-[#059669] to-[#036B52] ring-1 ring-black/5",
        glow && "shadow-[0_8px_22px_-8px_rgba(5,150,105,0.75)]",
        className,
      )}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}
    >
      <svg
        viewBox="0 0 48 48"
        width={mark}
        height={mark}
        aria-hidden="true"
        className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]"
      >
        {/* Üst parlaklık — premium cam efekti */}
        <path d="M0 12C0 5.4 5.4 0 12 0h24c6.6 0 12 5.4 12 12v1H0z" fill="#fff" opacity="0.16" />
        {/* S harfi — eczanenin baş harfi */}
        <path
          d="M32.5 19.7c0-4.7-17-4.7-17 1.5s17 3.4 17 9.6-17 6.2-17 1.5"
          fill="none"
          stroke="#fff"
          strokeWidth="6.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Sağlık haçı rozeti */}
        <circle cx="36.5" cy="12" r="6.9" fill="#fff" />
        <rect x="34" y="7.5" width="5" height="9" rx="2.5" fill="#059669" />
        <rect x="32" y="9.5" width="9" height="5" rx="2.5" fill="#059669" />
      </svg>
    </span>
  );
}
