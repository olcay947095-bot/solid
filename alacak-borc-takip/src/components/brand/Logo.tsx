import { cn } from "@/lib/utils";

interface LogoProps {
  /** Kenar uzunluğu (px). */
  size?: number;
  className?: string;
  /** Yumuşak yeşil parıltı gölgesi. */
  glow?: boolean;
}

/** Eczane kurumsal logosu — yeşil zemine beyaz haç ve altın pırıltı. */
export function Logo({ size = 40, className, glow = true }: LogoProps) {
  const cross = Math.round(size * 0.62);
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-[#12B981] via-[#059669] to-[#047857] ring-1 ring-black/5",
        glow && "shadow-[0_8px_20px_-8px_rgba(5,150,105,0.65)]",
        className,
      )}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}
    >
      <svg
        viewBox="0 0 48 48"
        width={cross}
        height={cross}
        aria-hidden="true"
        className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]"
      >
        <rect x="19" y="8" width="10" height="32" rx="5" fill="#fff" />
        <rect x="8" y="19" width="32" height="10" rx="5" fill="#fff" />
        <circle cx="41.5" cy="6.5" r="3.6" fill="#F0D07A" />
      </svg>
    </span>
  );
}
