"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, TooltipBox } from "./common";

export interface RankItem {
  nome: string;
  value: number;
  cor: string;
}

export function RankBarChart({
  data,
  fmt,
  unidade,
}: {
  data: RankItem[];
  fmt: (v: number) => string;
  unidade: string;
}) {
  const height = Math.max(data.length * 46 + 16, 180);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
        barCategoryGap={10}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="nome"
          tick={{ ...AXIS, fill: "#0D121A", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={104}
        />
        <Tooltip
          cursor={{ fill: "#F4F6FA" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox
                label={payload[0].payload.nome}
                items={[
                  {
                    name: unidade,
                    value: payload[0].value as number,
                    color: payload[0].payload.cor,
                    fmt,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="value" radius={[6, 6, 6, 6]} maxBarSize={26}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.cor} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => fmt(Number(v))}
            style={{ fontSize: 11, fontWeight: 600, fill: "#4E565F" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
