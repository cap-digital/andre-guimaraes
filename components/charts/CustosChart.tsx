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
import { fmtBRL, fmtDataCurta, fmtPct } from "@/lib/format";

export interface CustoPonto {
  d: string;
  cpm: number;
  cpc: number;
  ctr: number;
}

export function CustosChart({ data }: { data: CustoPonto[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="d"
          tickFormatter={fmtDataCurta}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          yAxisId="money"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => fmtBRL(v, 0)}
          width={52}
        />
        <YAxis
          yAxisId="pct"
          orientation="right"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}%`}
          width={44}
        />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox
                label={fmtDataCurta(String(label))}
                items={[
                  {
                    name: "CPM",
                    value: payload.find((p) => p.dataKey === "cpm")?.value as number,
                    color: "#175A97",
                    fmt: (v) => fmtBRL(v),
                  },
                  {
                    name: "CPC",
                    value: payload.find((p) => p.dataKey === "cpc")?.value as number,
                    color: "#9B6FD4",
                    fmt: (v) => fmtBRL(v),
                  },
                  {
                    name: "CTR",
                    value: payload.find((p) => p.dataKey === "ctr")?.value as number,
                    color: "#10AFE0",
                    fmt: (v) => fmtPct(v),
                  },
                ]}
              />
            ) : null
          }
        />
        <Line
          yAxisId="money"
          type="monotone"
          dataKey="cpm"
          stroke="#175A97"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="money"
          type="monotone"
          dataKey="cpc"
          stroke="#9B6FD4"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="ctr"
          stroke="#10AFE0"
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
