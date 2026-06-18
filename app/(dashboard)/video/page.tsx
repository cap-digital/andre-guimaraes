"use client";

import { useMemo } from "react";
import { PlayCircle, Banknote, Gauge, Repeat2 } from "lucide-react";
import { useDashboardData } from "@/lib/useDashboardData";
import { byCreative } from "@/lib/aggregations";
import { EMPTY_AGG, cpv } from "@/lib/metrics";
import type { Aggregates } from "@/lib/types";
import { fmtBRL, fmtCompact, fmtInt, fmtPct } from "@/lib/format";
import { EMP_MAP, empNome } from "@/lib/empreendimentos";
import { KpiCard } from "@/components/ui/KpiCard";
import { ChartCard } from "@/components/ui/Card";
import { FullLoader, ErrorState, EmptyState } from "@/components/ui/States";
import { FunilConversao } from "@/components/charts/FunilConversao";
import { BarLineChart } from "@/components/charts/BarLineChart";
import { ThumbRank } from "@/components/charts/ThumbRank";

interface VideoCard {
  cid: number;
  agg: Aggregates;
}

export default function VideoPage() {
  const { filteredRows, creatives, loading, error, reload } = useDashboardData();

  const porCriativo = useMemo(() => byCreative(filteredRows), [filteredRows]);

  // Criativos de vídeo (têm reproduções)
  const videos = useMemo<VideoCard[]>(() => {
    const list: VideoCard[] = [];
    for (const [cid, agg] of porCriativo.entries()) {
      if (agg.videoViews > 0) list.push({ cid, agg });
    }
    return list.sort((a, b) => b.agg.videoViews - a.agg.videoViews);
  }, [porCriativo]);

  const total = useMemo(() => {
    const a = { ...EMPTY_AGG };
    videos.forEach((v) => {
      a.spend += v.agg.spend;
      a.videoViews += v.agg.videoViews;
      a.v25 += v.agg.v25;
      a.v50 += v.agg.v50;
      a.v75 += v.agg.v75;
      a.v100 += v.agg.v100;
      a.impressions += v.agg.impressions;
    });
    return a;
  }, [videos]);

  const conclusao = total.videoViews ? (total.v100 / total.videoViews) * 100 : 0;

  const funil = useMemo(
    () => [
      { label: "Reproduções (ThruPlay)", value: total.videoViews, cor: "#0E3B65" },
      { label: "25% assistido", value: total.v25, cor: "#175A97" },
      { label: "50% assistido", value: total.v50, cor: "#3F7EB8" },
      { label: "75% assistido", value: total.v75, cor: "#10AFE0" },
      { label: "100% assistido", value: total.v100, cor: "#5BCBEC" },
    ],
    [total]
  );

  const curva = useMemo(() => {
    const base = total.videoViews || 1;
    return [
      { label: "25%", bar: (total.v25 / base) * 100 },
      { label: "50%", bar: (total.v50 / base) * 100 },
      { label: "75%", bar: (total.v75 / base) * 100 },
      { label: "100%", bar: (total.v100 / base) * 100 },
    ];
  }, [total]);

  const rankReproducoes = useMemo(() => {
    const max = videos[0]?.agg.videoViews || 1;
    return videos.slice(0, 7).map((v) => {
      const c = creatives[v.cid];
      return {
        thumb: c?.thumb ?? "",
        nome: c?.ad ?? "—",
        sub: empNome(c?.emp ?? ""),
        cor: EMP_MAP[c?.emp ?? ""]?.cor ?? "#175A97",
        valueLabel: fmtCompact(v.agg.videoViews),
        ratio: v.agg.videoViews / max,
      };
    });
  }, [videos, creatives]);

  const rankCpv = useMemo(() => {
    const ordenado = videos
      .filter((v) => cpv(v.agg) > 0)
      .sort((a, b) => cpv(a.agg) - cpv(b.agg))
      .slice(0, 7);
    const min = ordenado.length ? cpv(ordenado[0].agg) : 1;
    return ordenado.map((v) => {
      const c = creatives[v.cid];
      return {
        thumb: c?.thumb ?? "",
        nome: c?.ad ?? "—",
        sub: empNome(c?.emp ?? ""),
        cor: EMP_MAP[c?.emp ?? ""]?.cor ?? "#10AFE0",
        valueLabel: fmtBRL(cpv(v.agg)),
        ratio: min / cpv(v.agg),
      };
    });
  }, [videos, creatives]);

  if (loading) return <FullLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!videos.length)
    return (
      <div className="rounded-2xl border border-line bg-white p-10 shadow-card">
        <EmptyState label="Nenhum criativo de vídeo no período selecionado." />
      </div>
    );

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Reproduções (ThruPlay)"
          value={fmtCompact(total.videoViews)}
          hint={fmtInt(total.videoViews)}
          icon={PlayCircle}
          accent="#175A97"
        />
        <KpiCard
          label="Investimento em vídeo"
          value={fmtBRL(total.spend, 0)}
          icon={Banknote}
          accent="#0A2B4B"
        />
        <KpiCard
          label="CPV (custo por view)"
          value={total.videoViews ? fmtBRL(cpv(total)) : "—"}
          icon={Gauge}
          accent="#10AFE0"
        />
        <KpiCard
          label="Taxa de conclusão"
          value={fmtPct(conclusao, 1)}
          hint="assistiram até o fim"
          icon={Repeat2}
          accent="#2BB6A3"
        />
      </div>

      {/* Funil + Curva */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-5"
          title="Funil de retenção"
          subtitle="Pessoas que assistiram cada etapa do vídeo"
        >
          <div className="py-2">
            <FunilConversao etapas={funil} />
          </div>
        </ChartCard>
        <ChartCard
          className="lg:col-span-7"
          title="Curva de retenção"
          subtitle="% das reproduções que alcançaram cada marco"
        >
          <BarLineChart
            data={curva}
            barName="Retenção"
            barColor="#175A97"
            barFmt={(v) => `${v.toFixed(0)}%`}
          />
        </ChartCard>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-7"
          title="Vídeos mais assistidos"
          subtitle="Top criativos por reproduções"
        >
          <ThumbRank items={rankReproducoes} />
        </ChartCard>
        <ChartCard
          className="lg:col-span-5"
          title="Melhor custo por view"
          subtitle="Top criativos por menor CPV"
        >
          <ThumbRank items={rankCpv} />
        </ChartCard>
      </div>
    </div>
  );
}
