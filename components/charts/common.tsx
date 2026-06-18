"use client";

import type { ReactNode } from "react";

// Paleta sequencial derivada da marca para séries genéricas
export const SERIES_COLORS = [
  "#175A97",
  "#10AFE0",
  "#2BB6A3",
  "#6772D4",
  "#9B6FD4",
  "#E0942F",
  "#84AEDB",
  "#597E5E",
];

export const AXIS = {
  fontSize: 11,
  fill: "#8A93A0",
};

export const GRID_COLOR = "#EEF1F5";

interface TooltipItem {
  name: string;
  value: number;
  color?: string;
  fmt?: (v: number) => string;
}

export function TooltipBox({
  label,
  items,
}: {
  label?: ReactNode;
  items: TooltipItem[];
}) {
  return (
    <div className="rounded-xl border border-line bg-white/95 px-3 py-2 shadow-pop backdrop-blur">
      {label && (
        <div className="mb-1.5 text-[11px] font-semibold text-ink">{label}</div>
      )}
      <div className="flex flex-col gap-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: it.color || "#175A97" }}
            />
            <span className="text-muted">{it.name}</span>
            <span className="ml-auto font-semibold text-ink">
              {it.fmt ? it.fmt(it.value) : it.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
