import { useEffect, useState } from "react";

/** Bir değeri `delay` ms boyunca değişmeden bekletir; filtre/arama için kullanılır. */
export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
