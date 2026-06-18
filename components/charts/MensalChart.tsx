"use client";

import {
  Bar,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, GRID_COLOR, TooltipBox } from "./common";
import { fmtBRL, fmtBRLCompact, fmtInt, fmtMesCurto } from "@/lib/format";

export interface MensalPonto {
  ym: string;
  spend: number;
  leads: number;
}

export function MensalChart({ data }: { data: MensalPonto[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="ym"
          tickFormatter={fmtMesCurto}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
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
          tickFormatter={(v) => fmtInt(v)}
          width={44}
        />
        <Tooltip
          cursor={{ fill: "#F4F6FA" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox
                label={fmtMesCurto(String(label))}
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
        <Bar
          yAxisId="l"
          dataKey="spend"
          fill="#175A97"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
        <Line
          yAxisId="r"
          type="monotone"
          dataKey="leads"
          stroke="#10AFE0"
          strokeWidth={2.4}
          dot={{ r: 3, fill: "#10AFE0", strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
