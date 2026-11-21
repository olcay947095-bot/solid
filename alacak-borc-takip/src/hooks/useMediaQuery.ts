import { useEffect, useState } from "react";

/** CSS media query'yi dinleyen hook (SSR-güvenli). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Tailwind lg kırılımı (=1024px) altı için mobil tespiti. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1023.98px)");
}
