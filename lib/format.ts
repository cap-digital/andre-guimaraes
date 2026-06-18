export const fmtBRL = (v: number, frac = 2) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  }).format(Number.isFinite(v) ? v : 0);

export const fmtInt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(
    Number.isFinite(v) ? v : 0
  );

export const fmtDec = (v: number, frac = 2) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  }).format(Number.isFinite(v) ? v : 0);

export const fmtPct = (v: number, frac = 2) => `${fmtDec(v, frac)}%`;

// Abrevia números grandes: 12.345 -> 12,3 mil
export function fmtCompact(v: number): string {
  if (!Number.isFinite(v)) return "0";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${fmtDec(v / 1_000_000, 1)} mi`;
  if (abs >= 1_000) return `${fmtDec(v / 1_000, 1)} mil`;
  return fmtInt(v);
}

export function fmtBRLCompact(v: number): string {
  if (!Number.isFinite(v)) return "R$ 0";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${fmtDec(v / 1_000_000, 1)} mi`;
  if (abs >= 1_000) return `R$ ${fmtDec(v / 1_000, 1)} mil`;
  return fmtBRL(v, 0);
}

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const MESES_LONGOS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// "2026-01-05" -> "05 jan"
export function fmtDataCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d} ${MESES[Number(m) - 1]}`;
}

// "2026-01" -> "Janeiro 2026"
export function fmtMesLongo(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MESES_LONGOS[Number(m) - 1]} ${y}`;
}

// "2026-01" -> "jan/26"
export function fmtMesCurto(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MESES[Number(m) - 1]}/${y.slice(2)}`;
}

export function fmtDataCompleta(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export const FAIXAS_ETARIAS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Unknown"];

export function labelFaixa(f: string): string {
  return f === "Unknown" ? "N/D" : `${f} anos`;
}

export function labelGenero(g: string): string {
  if (g === "female") return "Feminino";
  if (g === "male") return "Masculino";
  return "Não identificado";
}
