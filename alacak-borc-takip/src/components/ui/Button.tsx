import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-sm hover:bg-brand-700 active:bg-brand-700 disabled:bg-brand/50",
  secondary:
    "bg-surface-2 text-ink border border-line hover:bg-surface-3 disabled:opacity-60",
  outline: "bg-transparent text-ink border border-line hover:bg-surface-2 disabled:opacity-60",
  ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-60",
  danger: "bg-payable text-white shadow-sm hover:bg-payable-dark disabled:bg-payable/50",
  success:
    "bg-receivable text-white shadow-sm hover:bg-receivable-dark disabled:bg-receivable/50",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
  icon: "h-10 w-10 rounded-xl justify-center",
};

export function Button({
  variant = "secondary",
  size = "md",
  leftIcon,
  rightIcon,
  block,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center font-semibold transition-all duration-150",
        "active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
