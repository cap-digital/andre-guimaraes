import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "./Card";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  deltaLabel,
  invertDelta = false,
  accent = "#175A97",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  delta?: number | null;
  deltaLabel?: string;
  invertDelta?: boolean;
  accent?: string;
}) {
  const hasDelta = delta !== null && delta !== undefined && Number.isFinite(delta);
  const positive = (delta ?? 0) >= 0;
  // invertDelta: para métricas onde "menor é melhor" (ex.: CPL, CPC)
  const good = invertDelta ? !positive : positive;

  return (
    <Card className="group relative overflow-hidden p-4 animate-fade-in sm:p-5">
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-80"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent}14`, color: accent }}
        >
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        {value}
      </div>
      <div className="mt-1 flex items-center gap-2">
        {hasDelta && (
          <span
            className={clsx(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              good ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}
          >
            {positive ? (
              <ArrowUpRight size={12} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={12} strokeWidth={2.5} />
            )}
            {Math.abs(delta as number).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
        {hasDelta && deltaLabel && (
          <span className="text-[11px] text-muted">{deltaLabel}</span>
        )}
      </div>
    </Card>
  );
}
