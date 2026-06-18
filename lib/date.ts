// Conversões seguras entre "YYYY-MM-DD" e Date local (sem fuso)
export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + n);
  return dateToIso(d);
}

export function monthBounds(ym: string): { de: string; ate: string } {
  const [y, m] = ym.split("-").map(Number);
  const de = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const ate = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { de, ate };
}

export function clampIso(iso: string, min: string, max: string): string {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
}

export function diffDays(de: string, ate: string): number {
  return Math.round(
    (isoToDate(ate).getTime() - isoToDate(de).getTime()) / 86400000
  );
}
