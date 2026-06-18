"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface Filters {
  emp: string; // "todos" ou chave do empreendimento
  de: string | null; // YYYY-MM-DD
  ate: string | null; // YYYY-MM-DD
}

export function useFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: Filters = useMemo(
    () => ({
      emp: params.get("emp") || "todos",
      de: params.get("de"),
      ate: params.get("ate"),
    }),
    [params]
  );

  const setFilters = useCallback(
    (patch: Partial<{ emp: string | null; de: string | null; ate: string | null }>) => {
      const next = new URLSearchParams(params.toString());
      const apply = (k: string, v: string | null | undefined) => {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      };
      if ("emp" in patch) apply("emp", patch.emp);
      if ("de" in patch) apply("de", patch.de);
      if ("ate" in patch) apply("ate", patch.ate);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  return { filters, setFilters };
}

// Constrói querystring preservando filtros (para navegação entre páginas)
export function buildQuery(filters: Filters): string {
  const p = new URLSearchParams();
  if (filters.emp && filters.emp !== "todos") p.set("emp", filters.emp);
  if (filters.de) p.set("de", filters.de);
  if (filters.ate) p.set("ate", filters.ate);
  const s = p.toString();
  return s ? `?${s}` : "";
}
