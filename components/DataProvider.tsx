"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFilters } from "@/lib/useFilters";
import type {
  Creative,
  DatasetResponse,
  MetricRow,
  SummaryResponse,
  SummaryRow,
} from "@/lib/types";

interface DataState {
  rows: MetricRow[];
  creatives: Creative[];
  summaryRows: SummaryRow[];
  range: { min: string; max: string };
  de: string;
  ate: string;
  updatedAt: string | null;
  empByCid: string[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { filters } = useFilters();
  const [detail, setDetail] = useState<DatasetResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Resumo (todo o período) — carregado uma vez; alimenta o comparativo
  // de período anterior. Leve, não bloqueia a interface.
  useEffect(() => {
    let active = true;
    fetch("/api/data?mode=summary")
      .then(async (r) => {
        if (!r.ok) throw new Error("summary");
        return (await r.json()) as SummaryResponse;
      })
      .then((d) => {
        if (active) setSummary(d);
      })
      .catch(() => {
        // Falha no resumo não derruba o dashboard; só desativa os deltas.
        if (active) setSummary(null);
      });
    return () => {
      active = false;
    };
  }, [tick]);

  // Detalhe — recarrega sempre que o período selecionado muda.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ mode: "detail" });
    if (filters.de) params.set("de", filters.de);
    if (filters.ate) params.set("ate", filters.ate);

    fetch(`/api/data?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Não foi possível carregar os dados.");
        return (await r.json()) as DatasetResponse;
      })
      .then((d) => {
        if (active) {
          setDetail(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : "Erro desconhecido.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [filters.de, filters.ate, tick]);

  const empByCid = useMemo(() => {
    if (!detail) return [];
    const arr: string[] = [];
    for (const c of detail.creatives) arr[c.id] = c.emp;
    return arr;
  }, [detail]);

  const value: DataState = useMemo(
    () => ({
      rows: detail?.rows ?? [],
      creatives: detail?.creatives ?? [],
      summaryRows: summary?.summary ?? [],
      range: detail?.range ?? summary?.range ?? { min: "", max: "" },
      de: detail?.de ?? "",
      ate: detail?.ate ?? "",
      updatedAt: detail?.updatedAt ?? null,
      empByCid,
      loading,
      error,
      reload: () => setTick((t) => t + 1),
    }),
    [detail, summary, empByCid, loading, error]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData precisa estar dentro de DataProvider");
  return ctx;
}
