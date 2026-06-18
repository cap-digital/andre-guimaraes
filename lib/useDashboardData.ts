"use client";

import { useMemo } from "react";
import { useData } from "@/components/DataProvider";
import { useFilters } from "./useFilters";
import type { MetricRow } from "./types";

export function monthsBetween(min: string, max: string): string[] {
  if (!min || !max) return [];
  const out: string[] = [];
  let [y, m] = [Number(min.slice(0, 4)), Number(min.slice(5, 7))];
  const [ey, em] = [Number(max.slice(0, 4)), Number(max.slice(5, 7))];
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function useDashboardData() {
  const { rows, creatives, empByCid, range, loading, error, updatedAt, reload } =
    useData();
  const { filters, setFilters } = useFilters();

  // Intervalo efetivo (padrão = intervalo total dos dados)
  const de = filters.de || range.min;
  const ate = filters.ate || range.max;
  const emp = filters.emp || "todos";

  const filteredRows = useMemo(() => {
    if (!rows.length) return [] as MetricRow[];
    return rows.filter((r) => {
      if (r.d < de || r.d > ate) return false;
      if (emp !== "todos" && empByCid[r.c] !== emp) return false;
      return true;
    });
  }, [rows, empByCid, de, ate, emp]);

  const months = useMemo(
    () => monthsBetween(range.min, range.max),
    [range.min, range.max]
  );

  return {
    rows,
    creatives,
    empByCid,
    filteredRows,
    range,
    de,
    ate,
    emp,
    months,
    filters,
    setFilters,
    loading,
    error,
    updatedAt,
    reload,
  };
}
