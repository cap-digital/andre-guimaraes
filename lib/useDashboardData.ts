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
  const {
    rows,
    creatives,
    summaryRows,
    empByCid,
    range,
    de,
    ate,
    loading,
    error,
    updatedAt,
    reload,
  } = useData();
  const { filters, setFilters } = useFilters();

  // O período (de/ate) já vem aplicado pelo servidor; aqui só filtramos por
  // empreendimento. O recorte de data é mantido por segurança.
  const emp = filters.emp || "todos";

  const filteredRows = useMemo(() => {
    if (!rows.length) return [] as MetricRow[];
    if (emp === "todos") return rows;
    return rows.filter((r) => empByCid[r.c] === emp);
  }, [rows, empByCid, emp]);

  const months = useMemo(
    () => monthsBetween(range.min, range.max),
    [range.min, range.max]
  );

  return {
    rows,
    creatives,
    summaryRows,
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
