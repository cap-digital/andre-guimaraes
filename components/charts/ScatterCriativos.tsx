"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  Cell,
} from "recharts";
import { AXIS, GRID_COLOR, TooltipBox } from "./common";
import { fmtBRL, fmtInt, fmtPct } from "@/lib/format";

export interface PontoCriativo {
  nome: string;
  empNome: string;
  spend: number;
  ctr: number;
  leads: number;
  cor: string;
}

export function ScatterCriativos({ data }: { data: PontoCriativo[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={GRID_COLOR} />
        <XAxis
          type="number"
          dataKey="spend"
          name="Investimento"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => fmtBRL(v, 0)}
        />
        <YAxis
          type="number"
          dataKey="ctr"
          name="CTR"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}%`}
          width={44}
        />
        <ZAxis type="number" dataKey="leads" range={[40, 520]} name="Leads" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox
                label={payload[0].payload.nome}
                items={[
                  { name: "Empreendimento", value: 0, color: payload[0].payload.cor, fmt: () => payload[0].payload.empNome },
                  { name: "Investimento", value: payload[0].payload.spend, fmt: (v) => fmtBRL(v) },
                  { name: "CTR", value: payload[0].payload.ctr, fmt: (v) => fmtPct(v) },
                  { name: "Leads", value: payload[0].payload.leads, fmt: (v) => fmtInt(v) },
                ]}
              />
            ) : null
          }
        />
        <Scatter data={data} fillOpacity={0.7}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.cor} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
