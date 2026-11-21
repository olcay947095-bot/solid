import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer select-none items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-brand" : "bg-surface-3",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
      {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
    </label>
  );
}
