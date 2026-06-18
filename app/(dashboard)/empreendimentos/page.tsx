"use client";

import { useMemo, useState } from "react";
import { useDashboardData } from "@/lib/useDashboardData";
import { byMonth, groupBy } from "@/lib/aggregations";
import { addAgg, EMPTY_AGG, cpc, cpl, cpm, ctr } from "@/lib/metrics";
import type { Aggregates } from "@/lib/types";
import {
  fmtBRL,
  fmtBRLCompact,
  fmtInt,
  fmtMesCurto,
  fmtPct,
} from "@/lib/format";
import { EMPREENDIMENTOS } from "@/lib/empreendimentos";
import { ChartCard, Card } from "@/components/ui/Card";
import { FullLoader, ErrorState, EmptyState } from "@/components/ui/States";
import { MultiLineChart } from "@/components/charts/MultiLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarLineChart } from "@/components/charts/BarLineChart";

export default function EmpreendimentosPage() {
  const { rows, empByCid, de, ate, loading, error, reload } = useDashboardData();
  const [metrica, setMetrica] = useState<"spend" | "leads">("leads");

  // Esta página sempre compara TODOS os empreendimentos (filtra só por data)
  const dateRows = useMemo(
    () => rows.filter((r) => r.d >= de && r.d <= ate),
    [rows, de, ate]
  );

  const porEmp = useMemo(() => {
    const m = groupBy(dateRows, (r) => empByCid[r.c]);
    return EMPREENDIMENTOS.map((e) => ({
      emp: e,
      agg: m.get(e.key) ?? { ...EMPTY_AGG },
    })).filter((x) => x.agg.impressions > 0 || x.agg.spend > 0);
  }, [dateRows, empByCid]);

  const total = useMemo(() => {
    const a = { ...EMPTY_AGG };
    dateRows.forEach((r) => addAgg(a, r));
    return a;
  }, [dateRows]);

  const evolucao = useMemo(() => {
    const meses = byMonth(dateRows);
    const mesesPorEmp = new Map<string, Map<string, Aggregates>>();
    EMPREENDIMENTOS.forEach((e) => mesesPorEmp.set(e.key, new Map()));
    for (const r of dateRows) {
      const k = empByCid[r.c];
      const ym = r.d.slice(0, 7);
      const map = mesesPorEmp.get(k);
      if (!map) continue;
      let a = map.get(ym);
      if (!a) {
        a = { ...EMPTY_AGG };
        map.set(ym, a);
      }
      addAgg(a, r);
    }
    const ymList = [...meses.keys()].sort();
    return ymList.map((ym) => {
      const ponto: Record<string, string | number> = { x: ym };
      for (const e of EMPREENDIMENTOS) {
        const a = mesesPorEmp.get(e.key)?.get(ym);
        ponto[e.key] = a ? (metrica === "spend" ? a.spend : a.leads) : 0;
      }
      return ponto;
    });
  }, [dateRows, empByCid, metrica]);

  const series = useMemo(
    () =>
      porEmp.map(({ emp }) => ({ key: emp.key, nome: emp.nome, cor: emp.cor })),
    [porEmp]
  );

  const shareInvest = useMemo(
    () =>
      porEmp
        .map(({ emp, agg }) => ({ nome: emp.nome, value: agg.spend, cor: emp.cor }))
        .filter((x) => x.value > 0),
    [porEmp]
  );
  const shareLeads = useMemo(
    () =>
      porEmp
        .map(({ emp, agg }) => ({ nome: emp.nome, value: agg.leads, cor: emp.cor }))
        .filter((x) => x.value > 0),
    [porEmp]
  );

  const barLine = useMemo(
    () =>
      porEmp
        .map(({ emp, agg }) => ({
          label: emp.iniciais,
          bar: agg.leads,
          line: agg.leads ? cpl(agg) : 0,
          cor: emp.cor,
        }))
        .sort((a, b) => b.bar - a.bar),
    [porEmp]
  );

  if (loading) return <FullLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!dateRows.length)
    return (
      <div className="rounded-2xl border border-line bg-white p-10 shadow-card">
        <EmptyState label="Nenhum dado para o período selecionado." />
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Tabela comparativa */}
      <Card className="overflow-hidden animate-fade-in">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold text-ink">
            Comparativo de empreendimentos
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Todos os empreendimentos no período selecionado
          </p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-y border-line bg-canvas text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-2.5 font-semibold">Empreendimento</th>
                <Th>Investimento</Th>
                <Th>Impressões</Th>
                <Th>Cliques</Th>
                <Th>CTR</Th>
                <Th>CPC</Th>
                <Th>CPM</Th>
                <Th>Leads</Th>
                <Th>CPL</Th>
              </tr>
            </thead>
            <tbody>
              {porEmp
                .slice()
                .sort((a, b) => b.agg.spend - a.agg.spend)
                .map(({ emp, agg }) => (
                  <tr
                    key={emp.key}
                    className="border-b border-line/70 transition hover:bg-canvas/60"
                  >
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[9px] font-bold text-white"
                          style={{ background: emp.cor }}
                        >
                          {emp.iniciais}
                        </span>
                        <span className="font-medium text-ink">{emp.nome}</span>
                      </span>
                    </td>
                    <Td>{fmtBRL(agg.spend, 0)}</Td>
                    <Td>{fmtInt(agg.impressions)}</Td>
                    <Td>{fmtInt(agg.clicks)}</Td>
                    <Td>{fmtPct(ctr(agg))}</Td>
                    <Td>{agg.clicks ? fmtBRL(cpc(agg)) : "—"}</Td>
                    <Td>{fmtBRL(cpm(agg))}</Td>
                    <Td strong>{fmtInt(agg.leads)}</Td>
                    <Td strong>{agg.leads ? fmtBRL(cpl(agg)) : "—"}</Td>
                  </tr>
                ))}
              <tr className="bg-navy text-white">
                <td className="px-5 py-3 font-semibold">Total</td>
                <Td light>{fmtBRL(total.spend, 0)}</Td>
                <Td light>{fmtInt(total.impressions)}</Td>
                <Td light>{fmtInt(total.clicks)}</Td>
                <Td light>{fmtPct(ctr(total))}</Td>
                <Td light>{total.clicks ? fmtBRL(cpc(total)) : "—"}</Td>
                <Td light>{fmtBRL(cpm(total))}</Td>
                <Td light strong>
                  {fmtInt(total.leads)}
                </Td>
                <Td light strong>
                  {total.leads ? fmtBRL(cpl(total)) : "—"}
                </Td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Evolução + Share investimento */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-7"
          title="Evolução mensal por empreendimento"
          subtitle="Comparação ao longo do tempo"
          action={
            <div className="flex rounded-lg border border-line bg-canvas p-0.5 text-[11px] font-medium">
              {(["leads", "spend"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetrica(m)}
                  className={
                    "rounded-md px-2.5 py-1 transition " +
                    (metrica === m
                      ? "bg-white text-brand shadow-sm"
                      : "text-muted hover:text-ink")
                  }
                >
                  {m === "leads" ? "Leads" : "Investido"}
                </button>
              ))}
            </div>
          }
        >
          <MultiLineChart
            data={evolucao}
            series={series}
            xFormatter={fmtMesCurto}
            yFormatter={(v) =>
              metrica === "spend" ? fmtBRLCompact(v) : fmtInt(v)
            }
            valueFormatter={(v) =>
              metrica === "spend" ? fmtBRL(v) : fmtInt(v)
            }
          />
        </ChartCard>
        <ChartCard
          className="lg:col-span-5"
          title="Participação no investimento"
          subtitle="Share de cada empreendimento"
        >
          {shareInvest.length ? (
            <DonutChart
              data={shareInvest}
              fmt={(v) => fmtBRLCompact(v)}
              centerLabel="Total"
              centerValue={fmtBRLCompact(total.spend)}
            />
          ) : (
            <EmptyState label="Sem dados" />
          )}
        </ChartCard>
      </div>

      {/* Leads x CPL + Share leads */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-7"
          title="Leads e custo por lead"
          subtitle="Volume de leads (barras) e CPL (linha) por empreendimento"
        >
          <BarLineChart
            data={barLine}
            barName="Leads"
            lineName="CPL"
            barFmt={(v) => fmtInt(v)}
            lineFmt={(v) => fmtBRL(v, 0)}
          />
        </ChartCard>
        <ChartCard
          className="lg:col-span-5"
          title="Participação nos leads"
          subtitle="Share de leads gerados"
        >
          {shareLeads.length ? (
            <DonutChart
              data={shareLeads}
              fmt={(v) => fmtInt(v)}
              centerLabel="Leads"
              centerValue={fmtInt(total.leads)}
            />
          ) : (
            <EmptyState label="Sem dados" />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2.5 text-right font-semibold">{children}</th>;
}

function Td({
  children,
  strong,
  light,
}: {
  children: React.ReactNode;
  strong?: boolean;
  light?: boolean;
}) {
  return (
    <td
      className={
        "px-3 py-3 text-right tabular-nums " +
        (light ? "text-white " : strong ? "text-ink " : "text-muted ") +
        (strong ? "font-semibold" : "")
      }
    >
      {children}
    </td>
  );
}
