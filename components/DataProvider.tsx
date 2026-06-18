"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Creative, DatasetResponse, MetricRow } from "@/lib/types";

interface DataState {
  rows: MetricRow[];
  creatives: Creative[];
  range: { min: string; max: string };
  updatedAt: string | null;
  empByCid: string[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DatasetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch("/api/data")
      .then(async (r) => {
        if (!r.ok) throw new Error("Não foi possível carregar os dados.");
        return (await r.json()) as DatasetResponse;
      })
      .then((d) => {
        if (active) {
          setData(d);
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
  }, [tick]);

  const empByCid = useMemo(() => {
    if (!data) return [];
    const arr: string[] = [];
    for (const c of data.creatives) arr[c.id] = c.emp;
    return arr;
  }, [data]);

  const value: DataState = useMemo(
    () => ({
      rows: data?.rows ?? [],
      creatives: data?.creatives ?? [],
      range: data?.range ?? { min: "", max: "" },
      updatedAt: data?.updatedAt ?? null,
      empByCid,
      loading,
      error,
      reload: () => setTick((t) => t + 1),
    }),
    [data, empByCid, loading, error]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData precisa estar dentro de DataProvider");
  return ctx;
}
