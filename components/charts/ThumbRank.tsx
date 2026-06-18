"use client";

import { CreativeImage } from "@/components/criativos/CreativeImage";
import { EmptyState } from "@/components/ui/States";

export interface ThumbRankItem {
  thumb: string;
  nome: string;
  sub?: string;
  cor: string;
  valueLabel: string;
  ratio: number; // 0–1 (preenchimento da barra)
}

export function ThumbRank({ items }: { items: ThumbRankItem[] }) {
  if (!items.length) return <EmptyState label="Sem dados" />;
  return (
    <ul className="flex flex-col">
      {items.map((it, i) => (
        <li
          key={i}
          className="group flex items-center gap-3 border-b border-line/60 py-2.5 last:border-0"
        >
          <span className="w-4 shrink-0 text-center text-[12px] font-semibold text-muted">
            {i + 1}
          </span>
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line">
            <CreativeImage src={it.thumb} alt={it.nome} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p
                className="truncate text-[12px] font-semibold text-ink"
                title={it.nome}
              >
                {it.nome}
              </p>
              <span className="shrink-0 text-[12px] font-semibold text-ink">
                {it.valueLabel}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              {it.sub && (
                <span className="shrink-0 text-[10px] text-muted">{it.sub}</span>
              )}
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(it.ratio * 100, 3)}%`,
                    background: it.cor,
                  }}
                />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
