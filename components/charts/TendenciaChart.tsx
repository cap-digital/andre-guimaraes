"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, GRID_COLOR, TooltipBox } from "./common";
import { fmtBRL, fmtBRLCompact, fmtCompact, fmtDataCurta, fmtInt } from "@/lib/format";

export interface TendenciaPonto {
  d: string;
  spend: number;
  leads: number;
}

export function TendenciaChart({ data }: { data: TendenciaPonto[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#175A97" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#175A97" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          yAxisId="l"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => fmtBRLCompact(v)}
          width={64}
        />
        <YAxis
          yAxisId="r"
          orientation="right"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => fmtCompact(v)}
          width={40}
        />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox
                label={fmtDataCurta(String(label))}
                items={[
                  {
                    name: "Investimento",
                    value: payload.find((p) => p.dataKey === "spend")?.value as number,
                    color: "#175A97",
                    fmt: (v) => fmtBRL(v),
                  },
                  {
                    name: "Leads",
                    value: payload.find((p) => p.dataKey === "leads")?.value as number,
                    color: "#10AFE0",
                    fmt: (v) => fmtInt(v),
                  },
                ]}
              />
            ) : null
          }
        />
        <Area
          yAxisId="l"
          type="monotone"
          dataKey="spend"
          stroke="#175A97"
          strokeWidth={2}
          fill="url(#gradSpend)"
        />
        <Line
          yAxisId="r"
          type="monotone"
          dataKey="leads"
          stroke="#10AFE0"
          strokeWidth={2.4}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
