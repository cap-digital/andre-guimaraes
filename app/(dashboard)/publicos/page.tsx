"use client";

import { useMemo } from "react";
import { Crown, Target, Users2 } from "lucide-react";
import { useDashboardData } from "@/lib/useDashboardData";
import { ageGenderMatrix, groupBy } from "@/lib/aggregations";
import { addAgg, EMPTY_AGG, cpl, ctr } from "@/lib/metrics";
import type { Aggregates } from "@/lib/types";
import {
  fmtBRL,
  fmtBRLCompact,
  fmtInt,
  fmtPct,
  FAIXAS_ETARIAS,
  labelFaixa,
  labelGenero,
} from "@/lib/format";
import { ChartCard, Card } from "@/components/ui/Card";
import { FullLoader, ErrorState, EmptyState } from "@/components/ui/States";
import { BarLineChart } from "@/components/charts/BarLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Heatmap } from "@/components/charts/Heatmap";

const GENEROS = ["female", "male", "unknown"];
const GENERO_COR: Record<string, string> = {
  female: "#9B6FD4",
  male: "#175A97",
  unknown: "#A9C8E8",
};

export default function PublicosPage() {
  const { filteredRows, loading, error, reload } = useDashboardData();

  const total = useMemo(() => {
    const a = { ...EMPTY_AGG };
    filteredRows.forEach((r) => addAgg(a, r));
    return a;
  }, [filteredRows]);

  const porFaixa = useMemo(() => {
    const m = groupBy(filteredRows, (r) => r.ag);
    return FAIXAS_ETARIAS.map((f) => ({ faixa: f, agg: m.get(f) ?? { ...EMPTY_AGG } }));
  }, [filteredRows]);

  const porGenero = useMemo(() => {
    const m = groupBy(filteredRows, (r) => r.g);
    return GENEROS.map((g) => ({ g, agg: m.get(g) ?? { ...EMPTY_AGG } }));
  }, [filteredRows]);

  // Agregado por célula faixa x gênero (para melhor público)
  const celulas = useMemo(() => {
    const m = new Map<string, { ag: string; g: string; agg: Aggregates }>();
    for (const r of filteredRows) {
      const k = `${r.ag}||${r.g}`;
      let c = m.get(k);
      if (!c) {
        c = { ag: r.ag, g: r.g, agg: { ...EMPTY_AGG } };
        m.set(k, c);
      }
      addAgg(c.agg, r);
    }
    return [...m.values()];
  }, [filteredRows]);

  const insights = useMemo(() => {
    const comLeads = celulas.filter((c) => c.agg.leads > 0);
    const topVolume = [...comLeads].sort((a, b) => b.agg.leads - a.agg.leads)[0];
    const mediaLeads =
      comLeads.reduce((s, c) => s + c.agg.leads, 0) / (comLeads.length || 1);
    const eficiente = [...comLeads]
      .filter((c) => c.agg.leads >= Math.max(3, mediaLeads * 0.5))
      .sort((a, b) => cpl(a.agg) - cpl(b.agg))[0];
    const generoTop = [...porGenero].sort((a, b) => b.agg.leads - a.agg.leads)[0];
    const generoShare = total.leads
      ? (generoTop.agg.leads / total.leads) * 100
      : 0;
    return { topVolume, eficiente, generoTop, generoShare };
  }, [celulas, porGenero, total]);

  const barFaixa = useMemo(
    () =>
      porFaixa
        .filter((f) => f.agg.impressions > 0)
        .map((f) => ({
          label: f.faixa === "Unknown" ? "N/D" : f.faixa,
          bar: f.agg.leads,
          line: f.agg.leads ? cpl(f.agg) : 0,
        })),
    [porFaixa]
  );

  const donutGenero = useMemo(
    () =>
      porGenero
        .map((x) => ({
          nome: labelGenero(x.g),
          value: x.agg.leads,
          cor: GENERO_COR[x.g],
        }))
        .filter((x) => x.value > 0),
    [porGenero]
  );

  const heatmap = useMemo(() => {
    const values = ageGenderMatrix(
      filteredRows,
      FAIXAS_ETARIAS,
      GENEROS,
      (a) => a.leads
    );
    return {
      rowLabels: FAIXAS_ETARIAS.map(labelFaixa),
      colLabels: GENEROS.map(labelGenero),
      values,
    };
  }, [filteredRows]);

  if (loading) return <FullLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!filteredRows.length)
    return (
      <div className="rounded-2xl border border-line bg-white p-10 shadow-card">
        <EmptyState label="Nenhum dado para os filtros selecionados." />
      </div>
    );

  const { topVolume, eficiente, generoTop, generoShare } = insights;

  return (
    <div className="space-y-5">
      {/* Insights */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InsightCard
          icon={<Crown size={16} />}
          accent="#E0942F"
          label="Público que mais converte"
          value={
            topVolume
              ? `${labelFaixa(topVolume.ag)} · ${labelGenero(topVolume.g)}`
              : "—"
          }
          hint={topVolume ? `${fmtInt(topVolume.agg.leads)} leads gerados` : ""}
        />
        <InsightCard
          icon={<Target size={16} />}
          accent="#2BB6A3"
          label="Menor custo por lead"
          value={
            eficiente
              ? `${labelFaixa(eficiente.ag)} · ${labelGenero(eficiente.g)}`
              : "—"
          }
          hint={eficiente ? `${fmtBRL(cpl(eficiente.agg))} por lead` : ""}
        />
        <InsightCard
          icon={<Users2 size={16} />}
          accent="#9B6FD4"
          label="Gênero predominante"
          value={generoTop ? labelGenero(generoTop.g) : "—"}
          hint={`${fmtPct(generoShare, 1)} dos leads`}
        />
      </div>

      {/* Faixa etária + Gênero */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-8"
          title="Leads e CPL por faixa etária"
          subtitle="Volume de leads (barras) e custo por lead (linha)"
        >
          {barFaixa.length ? (
            <BarLineChart
              data={barFaixa}
              barName="Leads"
              lineName="CPL"
              barFmt={(v) => fmtInt(v)}
              lineFmt={(v) => fmtBRL(v, 0)}
            />
          ) : (
            <EmptyState label="Sem dados" />
          )}
        </ChartCard>
        <ChartCard
          className="lg:col-span-4"
          title="Leads por gênero"
          subtitle="Distribuição dos leads"
        >
          {donutGenero.length ? (
            <DonutChart
              data={donutGenero}
              fmt={(v) => fmtInt(v)}
              centerLabel="Leads"
              centerValue={fmtInt(total.leads)}
            />
          ) : (
            <EmptyState label="Sem dados" />
          )}
        </ChartCard>
      </div>

      {/* Heatmap + Tabela faixa */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-5"
          title="Leads por faixa e gênero"
          subtitle="Intensidade de conversão por público"
        >
          <Heatmap data={heatmap} fmt={(v) => fmtInt(v)} />
        </ChartCard>

        <Card className="overflow-hidden lg:col-span-7 animate-fade-in">
          <div className="px-5 pt-5">
            <h3 className="text-[15px] font-semibold text-ink">
              Desempenho por faixa etária
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Métricas consolidadas por idade
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead>
                <tr className="border-y border-line bg-canvas text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-5 py-2.5 font-semibold">Faixa</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Invest.</th>
                  <th className="px-3 py-2.5 text-right font-semibold">CTR</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Leads</th>
                  <th className="px-3 py-2.5 text-right font-semibold">CPL</th>
                </tr>
              </thead>
              <tbody>
                {porFaixa
                  .filter((f) => f.agg.impressions > 0)
                  .sort((a, b) => b.agg.leads - a.agg.leads)
                  .map((f) => (
                    <tr
                      key={f.faixa}
                      className="border-b border-line/70 transition hover:bg-canvas/60"
                    >
                      <td className="px-5 py-2.5 font-medium text-ink">
                        {labelFaixa(f.faixa)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                        {fmtBRLCompact(f.agg.spend)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                        {fmtPct(ctr(f.agg))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink">
                        {fmtInt(f.agg.leads)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink">
                        {f.agg.leads ? fmtBRL(cpl(f.agg)) : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function InsightCard({
  icon,
  accent,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="flex items-start gap-3 p-4 animate-fade-in">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${accent}1A`, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-0.5 truncate text-base font-semibold text-ink">
          {value}
        </p>
        {hint && <p className="text-[11px] text-muted">{hint}</p>}
      </div>
    </Card>
  );
}
