import { avatarGradient, cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-[11px]",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({
  name,
  size = "md",
  className,
  ring,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        SIZES[size],
        ring && "ring-2 ring-surface ring-offset-1 ring-offset-line",
        className,
      )}
      style={{ background: avatarGradient(name) }}
      aria-hidden
      title={name}
    >
      {initials(name)}
    </div>
  );
}
