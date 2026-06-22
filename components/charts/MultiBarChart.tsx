"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, GRID_COLOR, TooltipBox } from "./common";
import type { SerieConfig } from "./MultiLineChart";

export function MultiBarChart({
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
      <BarChart data={data} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="x"
          tickFormatter={xFormatter}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          minTickGap={12}
        />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={yFormatter}
          width={56}
        />
        <Tooltip
          cursor={{ fill: "#F4F6FA" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox
                label={xFormatter(String(label))}
                items={payload
                  .map((p) => ({
                    name:
                      series.find((s) => s.key === p.dataKey)?.nome ??
                      String(p.dataKey),
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
          <Bar
            key={s.key}
            dataKey={s.key}
            fill={s.cor}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
