import { addAgg, EMPTY_AGG } from "./metrics";
import type { Aggregates, MetricRow } from "./types";

function emptyAgg(): Aggregates {
  return { ...EMPTY_AGG };
}

export function groupBy(
  rows: MetricRow[],
  keyFn: (r: MetricRow) => string
): Map<string, Aggregates> {
  const m = new Map<string, Aggregates>();
  for (const r of rows) {
    const k = keyFn(r);
    let a = m.get(k);
    if (!a) {
      a = emptyAgg();
      m.set(k, a);
    }
    addAgg(a, r);
  }
  return m;
}

export function byDay(rows: MetricRow[]): Map<string, Aggregates> {
  return groupBy(rows, (r) => r.d);
}

export function byMonth(rows: MetricRow[]): Map<string, Aggregates> {
  return groupBy(rows, (r) => r.d.slice(0, 7));
}

export function byCreative(rows: MetricRow[]): Map<number, Aggregates> {
  const m = new Map<number, Aggregates>();
  for (const r of rows) {
    let a = m.get(r.c);
    if (!a) {
      a = emptyAgg();
      m.set(r.c, a);
    }
    addAgg(a, r);
  }
  return m;
}

// Matriz faixa etária (linhas) x gênero (colunas) para uma métrica
export function ageGenderMatrix(
  rows: MetricRow[],
  rowKeys: string[],
  colKeys: string[],
  pick: (a: Aggregates) => number
): number[][] {
  const idxRow = new Map(rowKeys.map((k, i) => [k, i]));
  const idxCol = new Map(colKeys.map((k, i) => [k, i]));
  const acc: Aggregates[][] = rowKeys.map(() => colKeys.map(() => emptyAgg()));
  for (const r of rows) {
    const ri = idxRow.get(r.ag);
    const ci = idxCol.get(r.g);
    if (ri === undefined || ci === undefined) continue;
    addAgg(acc[ri][ci], r);
  }
  return acc.map((row) => row.map(pick));
}
