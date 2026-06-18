"use client";

export interface HeatmapData {
  rowLabels: string[];
  colLabels: string[];
  values: number[][]; // [row][col]
}

export function Heatmap({
  data,
  fmt,
  baseColor = "23,90,151", // rgb da marca
}: {
  data: HeatmapData;
  fmt: (v: number) => string;
  baseColor?: string;
}) {
  const max = Math.max(1, ...data.values.flat());

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[320px] gap-1"
        style={{
          gridTemplateColumns: `90px repeat(${data.colLabels.length}, minmax(0,1fr))`,
        }}
      >
        <div />
        {data.colLabels.map((c) => (
          <div
            key={c}
            className="pb-1 text-center text-[11px] font-semibold text-muted"
          >
            {c}
          </div>
        ))}

        {data.rowLabels.map((rl, ri) => (
          <Row
            key={rl}
            label={rl}
            values={data.values[ri]}
            max={max}
            fmt={fmt}
            baseColor={baseColor}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  label,
  values,
  max,
  fmt,
  baseColor,
}: {
  label: string;
  values: number[];
  max: number;
  fmt: (v: number) => string;
  baseColor: string;
}) {
  return (
    <>
      <div className="flex items-center pr-1 text-[11px] font-medium text-ink">
        {label}
      </div>
      {values.map((v, ci) => {
        const ratio = v / max;
        const alpha = v === 0 ? 0.04 : 0.12 + ratio * 0.78;
        const dark = ratio > 0.55;
        return (
          <div
            key={ci}
            title={`${label} · ${fmt(v)}`}
            className="flex h-12 items-center justify-center rounded-lg text-[11px] font-semibold transition"
            style={{
              background: `rgba(${baseColor}, ${alpha})`,
              color: dark ? "#fff" : "#0D121A",
            }}
          >
            {fmt(v)}
          </div>
        );
      })}
    </>
  );
}
