"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { TooltipBox } from "./common";

export interface DonutSlice {
  nome: string;
  value: number;
  cor: string;
}

export function DonutChart({
  data,
  fmt,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[];
  fmt: (v: number) => string;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="nome"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.cor} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TooltipBox
                    items={[
                      {
                        name: payload[0].payload.nome,
                        value: payload[0].value as number,
                        color: payload[0].payload.cor,
                        fmt,
                      },
                    ]}
                  />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="text-lg font-semibold text-ink">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-[10px] uppercase tracking-wider text-muted">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      <ul className="flex w-full flex-1 flex-col gap-2">
        {data.map((d) => {
          const pct = total ? (d.value / total) * 100 : 0;
          return (
            <li key={d.nome} className="flex items-center gap-2 text-[12px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.cor }}
              />
              <span className="truncate text-ink">{d.nome}</span>
              <span className="ml-auto font-semibold text-ink">{fmt(d.value)}</span>
              <span className="w-10 text-right text-muted">{pct.toFixed(1)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
