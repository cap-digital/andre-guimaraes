"use client";

import { fmtInt, fmtPct } from "@/lib/format";

export interface FunilEtapa {
  label: string;
  value: number;
  cor: string;
}

// Funil de conversão: cada etapa proporcional ao topo, com taxa de passagem
export function FunilConversao({ etapas }: { etapas: FunilEtapa[] }) {
  const topo = etapas[0]?.value || 1;
  return (
    <div className="flex flex-col gap-2.5">
      {etapas.map((e, i) => {
        const pctTopo = (e.value / topo) * 100;
        const anterior = i > 0 ? etapas[i - 1].value : null;
        const taxa = anterior ? (e.value / anterior) * 100 : null;
        return (
          <div key={e.label}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="font-medium text-ink">{e.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-ink">{fmtInt(e.value)}</span>
                {taxa !== null && (
                  <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                    {fmtPct(taxa, 1)}
                  </span>
                )}
              </span>
            </div>
            <div className="h-7 w-full overflow-hidden rounded-lg bg-canvas">
              <div
                className="flex h-full items-center rounded-lg transition-all"
                style={{
                  width: `${Math.max(pctTopo, 2)}%`,
                  background: e.cor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
