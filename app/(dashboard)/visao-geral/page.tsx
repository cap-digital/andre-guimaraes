"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  Eye,
  MousePointerClick,
  Users2,
  Percent,
  Target,
  Radio,
} from "lucide-react";
import { useDashboardData } from "@/lib/useDashboardData";
import {
  ageGenderMatrix,
  byCreative,
  byDay,
  byMonth,
  groupBy,
} from "@/lib/aggregations";
import {
  cpc,
  cpl,
  cpm,
  ctr,
  frequency,
  sumRows,
  taxaConversao,
} from "@/lib/metrics";
import {
  fmtBRL,
  fmtBRLCompact,
  fmtCompact,
  fmtDec,
  fmtInt,
  fmtPct,
  FAIXAS_ETARIAS,
  labelFaixa,
  labelGenero,
} from "@/lib/format";
import { EMPREENDIMENTOS, EMP_MAP, empNome } from "@/lib/empreendimentos";
import { KpiCard } from "@/components/ui/KpiCard";
import { ChartCard } from "@/components/ui/Card";
import { FullLoader, ErrorState, EmptyState } from "@/components/ui/States";
import { TendenciaChart } from "@/components/charts/TendenciaChart";
import { MensalChart } from "@/components/charts/MensalChart";
import { CustosChart } from "@/components/charts/CustosChart";
import { RankBarChart, type RankItem } from "@/components/charts/RankBarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { FunilConversao } from "@/components/charts/FunilConversao";
import { ScatterCriativos } from "@/components/charts/ScatterCriativos";

const GENEROS = ["female", "male", "unknown"];

type RankMetric = "spend" | "leads" | "cpl";

export default function VisaoGeralPage() {
  const {
    filteredRows,
    rows,
    empByCid,
    creatives,
    emp,
    de,
    ate,
    loading,
    error,
    reload,
  } = useDashboardData();
  const [rankMetric, setRankMetric] = useState<RankMetric>("spend");

  const total = useMemo(() => sumRows(filteredRows), [filteredRows]);

  // Período anterior de mesmo tamanho (para variação)
  const prev = useMemo(() => {
    if (!de || !ate) return null;
    const start = new Date(de);
    const end = new Date(ate);
    const len = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (len - 1));
    const ps = prevStart.toISOString().slice(0, 10);
    const pe = prevEnd.toISOString().slice(0, 10);
    const r = rows.filter((row) => {
      if (row.d < ps || row.d > pe) return false;
      if (emp !== "todos" && empByCid[row.c] !== emp) return false;
      return true;
    });
    return sumRows(r);
  }, [rows, empByCid, de, ate, emp]);

  const delta = (cur: number, old: number | undefined) => {
    if (old === undefined || old === 0) return null;
    return ((cur - old) / old) * 100;
  };

  // Séries temporais
  const tendencia = useMemo(() => {
    const m = byDay(filteredRows);
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([d, a]) => ({ d, spend: a.spend, leads: a.leads }));
  }, [filteredRows]);

  const custos = useMemo(() => {
    const m = byDay(filteredRows);
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([d, a]) => ({ d, cpm: cpm(a), cpc: cpc(a), ctr: ctr(a) }));
  }, [filteredRows]);

  const mensal = useMemo(() => {
    const m = byMonth(filteredRows);
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, a]) => ({ ym, spend: a.spend, leads: a.leads }));
  }, [filteredRows]);

  // Ranking: empreendimentos (todos) ou top criativos (específico)
  const rank: { titulo: string; items: RankItem[]; fmt: (v: number) => string; unidade: string } =
    useMemo(() => {
      const pick = (a: ReturnType<typeof sumRows>) =>
        rankMetric === "spend" ? a.spend : rankMetric === "leads" ? a.leads : cpl(a);
      const fmt =
        rankMetric === "leads" ? (v: number) => fmtInt(v) : (v: number) => fmtBRL(v, rankMetric === "cpl" ? 2 : 0);
      const unidade =
        rankMetric === "spend" ? "Investimento" : rankMetric === "leads" ? "Leads" : "CPL";

      if (emp === "todos") {
        const m = groupBy(filteredRows, (r) => empByCid[r.c]);
        const items = EMPREENDIMENTOS.map((e) => ({
          nome: e.nome,
          value: m.has(e.key) ? pick(m.get(e.key)!) : 0,
          cor: e.cor,
        }))
          .filter((x) => x.value > 0)
          .sort((a, b) => b.value - a.value);
        return { titulo: "Empreendimentos", items, fmt, unidade };
      }
      const m = byCreative(filteredRows);
      const items = [...m.entries()]
        .map(([cid, a]) => ({
          nome: creatives[cid]?.ad ?? "—",
          value: pick(a),
          cor: EMP_MAP[emp]?.cor ?? "#175A97",
        }))
        .filter((x) => x.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 7);
      return { titulo: "Criativos", items, fmt, unidade };
    }, [filteredRows, empByCid, creatives, emp, rankMetric]);

  // Donut investimento por gênero
  const donutGenero = useMemo(() => {
    const m = groupBy(filteredRows, (r) => r.g);
    const cores: Record<string, string> = {
      female: "#9B6FD4",
      male: "#175A97",
      unknown: "#A9C8E8",
    };
    return GENEROS.map((g) => ({
      nome: labelGenero(g),
      value: m.get(g)?.spend ?? 0,
      cor: cores[g],
    })).filter((x) => x.value > 0);
  }, [filteredRows]);

  // Heatmap de leads por faixa x gênero
  const heatmap = useMemo(() => {
    const generos = GENEROS;
    const values = ageGenderMatrix(
      filteredRows,
      FAIXAS_ETARIAS,
      generos,
      (a) => a.leads
    );
    return {
      rowLabels: FAIXAS_ETARIAS.map(labelFaixa),
      colLabels: generos.map(labelGenero),
      values,
    };
  }, [filteredRows]);

  // Funil de conversão
  const funil = useMemo(
    () => [
      { label: "Impressões", value: total.impressions, cor: "#0A2B4B" },
      { label: "Cliques", value: total.clicks, cor: "#175A97" },
      { label: "Leads", value: total.leads, cor: "#10AFE0" },
    ],
    [total]
  );

  // Funil de retenção de vídeo
  const videoFunil = useMemo(
    () => [
      { label: "Reproduções (ThruPlay)", value: total.videoViews, cor: "#0E3B65" },
      { label: "25% assistido", value: total.v25, cor: "#175A97" },
      { label: "50% assistido", value: total.v50, cor: "#3F7EB8" },
      { label: "75% assistido", value: total.v75, cor: "#10AFE0" },
      { label: "100% assistido", value: total.v100, cor: "#5BCBEC" },
    ],
    [total]
  );

  // Dispersão de criativos
  const scatter = useMemo(() => {
    const m = byCreative(filteredRows);
    return [...m.entries()]
      .map(([cid, a]) => {
        const c = creatives[cid];
        return {
          nome: c?.ad ?? "—",
          empNome: empNome(c?.emp ?? ""),
          spend: a.spend,
          ctr: ctr(a),
          leads: a.leads,
          cor: EMP_MAP[c?.emp ?? ""]?.cor ?? "#175A97",
        };
      })
      .filter((x) => x.spend > 0);
  }, [filteredRows, creatives]);

  if (loading) return <FullLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!filteredRows.length)
    return (
      <div className="rounded-2xl border border-line bg-white p-10 shadow-card">
        <EmptyState label="Nenhum dado para os filtros selecionados." />
      </div>
    );

  const temVideo = total.videoViews > 0;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Investimento"
          value={fmtBRL(total.spend)}
          icon={Banknote}
          accent="#175A97"
          delta={delta(total.spend, prev?.spend)}
          deltaLabel="vs. período anterior"
        />
        <KpiCard
          label="Leads"
          value={fmtInt(total.leads)}
          icon={Users2}
          accent="#10AFE0"
          delta={delta(total.leads, prev?.leads)}
          deltaLabel="vs. anterior"
        />
        <KpiCard
          label="CPL (Custo por Lead)"
          value={total.leads ? fmtBRL(cpl(total)) : "—"}
          icon={Target}
          accent="#2BB6A3"
          invertDelta
          delta={prev && prev.leads ? delta(cpl(total), cpl(prev)) : null}
          deltaLabel="vs. anterior"
        />
        <KpiCard
          label="CTR"
          value={fmtPct(ctr(total))}
          icon={Percent}
          accent="#6772D4"
          delta={prev ? delta(ctr(total), ctr(prev)) : null}
          deltaLabel="vs. anterior"
        />
        <KpiCard
          label="Impressões"
          value={fmtCompact(total.impressions)}
          hint={fmtInt(total.impressions)}
          icon={Eye}
          accent="#9B6FD4"
        />
        <KpiCard
          label="Cliques"
          value={fmtCompact(total.clicks)}
          hint={fmtInt(total.clicks)}
          icon={MousePointerClick}
          accent="#E0942F"
        />
        <KpiCard
          label="CPM"
          value={fmtBRL(cpm(total))}
          icon={Radio}
          accent="#175A97"
          invertDelta
          delta={prev ? delta(cpm(total), cpm(prev)) : null}
        />
        <KpiCard
          label="CPC"
          value={total.clicks ? fmtBRL(cpc(total)) : "—"}
          icon={MousePointerClick}
          accent="#0A2B4B"
          invertDelta
          delta={prev && prev.clicks ? delta(cpc(total), cpc(prev)) : null}
        />
      </div>

      {/* Tendência + Gênero */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-8"
          title="Investimento e leads no período"
          subtitle="Evolução diária de investimento (área) e leads (linha)"
        >
          <TendenciaChart data={tendencia} />
        </ChartCard>
        <ChartCard
          className="lg:col-span-4"
          title="Investimento por gênero"
          subtitle="Distribuição do investimento"
        >
          {donutGenero.length ? (
            <DonutChart
              data={donutGenero}
              fmt={(v) => fmtBRLCompact(v)}
              centerLabel="Total"
              centerValue={fmtBRLCompact(total.spend)}
            />
          ) : (
            <EmptyState label="Sem dados" />
          )}
        </ChartCard>
      </div>

      {/* Mensal + Custos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-7"
          title="Comparativo mensal"
          subtitle="Investimento (barras) e leads (linha) por mês"
        >
          <MensalChart data={mensal} />
        </ChartCard>
        <ChartCard
          className="lg:col-span-5"
          title="Custos e taxa de cliques"
          subtitle="CPM, CPC (R$) e CTR (%) ao longo do tempo"
        >
          <CustosChart data={custos} />
        </ChartCard>
      </div>

      {/* Ranking + Funil */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-7"
          title={`Ranking · ${rank.titulo}`}
          subtitle="Comparação por métrica selecionada"
          action={
            <div className="flex rounded-lg border border-line bg-canvas p-0.5 text-[11px] font-medium">
              {(["spend", "leads", "cpl"] as RankMetric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setRankMetric(m)}
                  className={
                    "rounded-md px-2.5 py-1 transition " +
                    (rankMetric === m
                      ? "bg-white text-brand shadow-sm"
                      : "text-muted hover:text-ink")
                  }
                >
                  {m === "spend" ? "Investido" : m === "leads" ? "Leads" : "CPL"}
                </button>
              ))}
            </div>
          }
        >
          {rank.items.length ? (
            <RankBarChart data={rank.items} fmt={rank.fmt} unidade={rank.unidade} />
          ) : (
            <EmptyState label="Sem dados" />
          )}
        </ChartCard>

        <ChartCard
          className="lg:col-span-5"
          title="Funil de conversão"
          subtitle="Da impressão ao lead, com taxa de passagem"
        >
          <div className="py-2">
            <FunilConversao etapas={funil} />
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-center">
              <MiniStat
                label="Taxa de conversão (lead/clique)"
                value={fmtPct(taxaConversao(total))}
              />
              <MiniStat
                label="Frequência média"
                value={fmtDec(frequency(total), 2)}
              />
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Heatmap + Vídeo */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-5"
          title="Leads por faixa etária e gênero"
          subtitle="Volume de leads por público"
        >
          <Heatmap data={heatmap} fmt={(v) => fmtInt(v)} />
        </ChartCard>

        <ChartCard
          className="lg:col-span-7"
          title="Retenção de vídeo"
          subtitle={
            temVideo
              ? "Quantas pessoas assistiram cada etapa do vídeo"
              : "Sem reproduções de vídeo no período"
          }
        >
          {temVideo ? (
            <div className="py-2">
              <FunilConversao etapas={videoFunil} />
            </div>
          ) : (
            <EmptyState label="Sem dados de vídeo" />
          )}
        </ChartCard>
      </div>

      {/* Dispersão */}
      <ChartCard
        title="Eficiência dos criativos"
        subtitle="Investimento × CTR · tamanho da bolha = leads gerados"
      >
        {scatter.length ? (
          <ScatterCriativos data={scatter} />
        ) : (
          <EmptyState label="Sem dados" />
        )}
      </ChartCard>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted">{label}</p>
    </div>
  );
}
