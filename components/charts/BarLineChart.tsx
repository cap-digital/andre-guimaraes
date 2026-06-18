"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { AXIS, GRID_COLOR, TooltipBox } from "./common";

export interface BarLinePonto {
  label: string;
  bar: number;
  line?: number;
  cor?: string;
}

// Barras verticais (categoria) com linha opcional em eixo secundário
export function BarLineChart({
  data,
  barName,
  lineName,
  barColor = "#175A97",
  lineColor = "#10AFE0",
  barFmt,
  lineFmt,
  height = 280,
}: {
  data: BarLinePonto[];
  barName: string;
  lineName?: string;
  barColor?: string;
  lineColor?: string;
  barFmt: (v: number) => string;
  lineFmt?: (v: number) => string;
  height?: number;
}) {
  const temLinha = data.some((d) => d.line !== undefined);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ ...AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          yAxisId="bar"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={barFmt}
          width={56}
        />
        {temLinha && (
          <YAxis
            yAxisId="line"
            orientation="right"
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            tickFormatter={lineFmt}
            width={52}
          />
        )}
        <Tooltip
          cursor={{ fill: "#F4F6FA" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox
                label={String(label)}
                items={[
                  {
                    name: barName,
                    value: payload.find((p) => p.dataKey === "bar")?.value as number,
                    color: barColor,
                    fmt: barFmt,
                  },
                  ...(temLinha
                    ? [
                        {
                          name: lineName ?? "",
                          value: payload.find((p) => p.dataKey === "line")
                            ?.value as number,
                          color: lineColor,
                          fmt: lineFmt ?? barFmt,
                        },
                      ]
                    : []),
                ]}
              />
            ) : null
          }
        />
        <Bar yAxisId="bar" dataKey="bar" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.cor ?? barColor} />
          ))}
        </Bar>
        {temLinha && (
          <Line
            yAxisId="line"
            type="monotone"
            dataKey="line"
            stroke={lineColor}
            strokeWidth={2.4}
            dot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
