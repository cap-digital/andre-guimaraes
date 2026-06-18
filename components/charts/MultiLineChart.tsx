"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, GRID_COLOR, TooltipBox } from "./common";

export interface SerieConfig {
  key: string;
  nome: string;
  cor: string;
}

export function MultiLineChart({
  data,
  series,
  xFormatter,
  yFormatter,
  valueFormatter,
  height = 300,
}: {
  data: Array<Record<string, string | number>>;
  series: SerieConfig[];
  xFormatter: (v: string) => string;
  yFormatter: (v: number) => string;
  valueFormatter: (v: number) => string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="x"
          tickFormatter={xFormatter}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={yFormatter}
          width={56}
        />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox
                label={xFormatter(String(label))}
                items={payload
                  .map((p) => ({
                    name: series.find((s) => s.key === p.dataKey)?.nome ?? String(p.dataKey),
                    value: p.value as number,
                    color: p.color,
                    fmt: valueFormatter,
                  }))
                  .sort((a, b) => b.value - a.value)}
              />
            ) : null
          }
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.cor}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
