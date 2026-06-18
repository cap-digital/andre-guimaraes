"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Search,
  Film,
  Layers,
  Banknote,
  Users2,
  Target,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useDashboardData } from "@/lib/useDashboardData";
import { byCreative } from "@/lib/aggregations";
import { cpl, cpm, ctr, sumRows } from "@/lib/metrics";
import type { Aggregates } from "@/lib/types";
import { fmtBRL, fmtCompact, fmtInt, fmtPct } from "@/lib/format";
import { EMP_MAP, empNome } from "@/lib/empreendimentos";
import { Card } from "@/components/ui/Card";
import { FullLoader, ErrorState, EmptyState } from "@/components/ui/States";
import { CreativeImage } from "@/components/criativos/CreativeImage";

type SortKey = "spend" | "leads" | "ctr" | "cpl" | "impressions";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "spend", label: "Investimento" },
  { key: "leads", label: "Leads" },
  { key: "impressions", label: "Impressões" },
  { key: "ctr", label: "CTR" },
  { key: "cpl", label: "CPL" },
];

interface CardData {
  cid: number;
  ad: string;
  adset: string;
  emp: string;
  thumb: string;
  agg: Aggregates;
}

export default function CriativosPage() {
  const { filteredRows, creatives, loading, error, reload } = useDashboardData();
  const [sort, setSort] = useState<SortKey>("spend");
  const [busca, setBusca] = useState("");

  const cards = useMemo<CardData[]>(() => {
    const m = byCreative(filteredRows);
    const list: CardData[] = [];
    for (const [cid, agg] of m.entries()) {
      const c = creatives[cid];
      if (!c) continue;
      list.push({ cid, ad: c.ad, adset: c.adset, emp: c.emp, thumb: c.thumb, agg });
    }
    return list;
  }, [filteredRows, creatives]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const filtered = q
      ? cards.filter(
          (c) =>
            c.ad.toLowerCase().includes(q) ||
            c.adset.toLowerCase().includes(q) ||
            empNome(c.emp).toLowerCase().includes(q)
        )
      : cards;
    const val = (c: CardData) => {
      switch (sort) {
        case "spend":
          return c.agg.spend;
        case "leads":
          return c.agg.leads;
        case "impressions":
          return c.agg.impressions;
        case "ctr":
          return ctr(c.agg);
        case "cpl":
          return c.agg.leads ? cpl(c.agg) : Infinity;
      }
    };
    return [...filtered].sort((a, b) => {
      // CPL: menor primeiro; demais: maior primeiro
      if (sort === "cpl") return val(a) - val(b);
      return val(b) - val(a);
    });
  }, [cards, busca, sort]);

  // Resumo / análise dos criativos do período
  const resumo = useMemo(() => {
    const total = sumRows(filteredRows);
    const comLeads = cards.filter((c) => c.agg.leads > 0);
    // Destaque por volume de leads
    const destaque = [...cards].sort((a, b) => b.agg.leads - a.agg.leads)[0];
    // Mais eficiente: menor CPL entre os que têm volume relevante
    const mediaLeads =
      comLeads.reduce((s, c) => s + c.agg.leads, 0) / (comLeads.length || 1);
    const eficiente = [...comLeads]
      .filter((c) => c.agg.leads >= Math.max(3, mediaLeads * 0.5))
      .sort((a, b) => cpl(a.agg) - cpl(b.agg))[0];
    return { total, destaque, eficiente, qtde: cards.length };
  }, [cards, filteredRows]);

  if (loading) return <FullLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <CriativosBanner resumo={resumo} />

      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar criativo, conjunto…"
            className="w-full rounded-xl border border-line bg-canvas py-2 pl-9 pr-3 text-[13px] text-ink outline-none transition focus:border-brand-200 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted">
            <ArrowUpDown size={13} /> Ordenar
          </span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={
                "shrink-0 rounded-lg border px-2.5 py-1 text-[12px] font-medium transition " +
                (sort === s.key
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-muted hover:text-ink")
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between px-1">
        <p className="text-[13px] text-muted">
          <span className="font-semibold text-ink">{visiveis.length}</span>{" "}
          {visiveis.length === 1 ? "criativo" : "criativos"}
        </p>
      </div>

      {visiveis.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiveis.map((c) => (
            <CriativoCard key={c.cid} data={c} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white p-10 shadow-card">
          <EmptyState label="Nenhum criativo encontrado." />
        </div>
      )}
    </div>
  );
}

function CriativosBanner({
  resumo,
}: {
  resumo: {
    total: Aggregates;
    destaque?: CardData;
    eficiente?: CardData;
    qtde: number;
  };
}) {
  const { total, destaque, eficiente, qtde } = resumo;
  const d = destaque;
  const e = d ? EMP_MAP[d.emp] : undefined;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy p-5 shadow-card sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/30 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan/20 blur-[90px]" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
        {/* Identificação */}
        <div className="lg:w-56 lg:shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-light">
            <Sparkles size={12} /> Análise de criativos
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight text-white">
              {fmtInt(qtde)}
            </span>
            <span className="text-sm text-white/60">
              {qtde === 1 ? "criativo" : "criativos"} no período
            </span>
          </div>
        </div>

        {/* Big numbers */}
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <BigNumber
            icon={<Banknote size={15} />}
            label="Investimento"
            value={fmtBRL(total.spend, 0)}
          />
          <BigNumber
            icon={<Users2 size={15} />}
            label="Leads gerados"
            value={fmtInt(total.leads)}
          />
          <BigNumber
            icon={<Target size={15} />}
            label="CPL médio"
            value={total.leads ? fmtBRL(cpl(total)) : "—"}
          />
          <BigNumber
            icon={<Layers size={15} />}
            label="CTR médio"
            value={fmtPct(ctr(total))}
          />
        </div>
      </div>

      {/* Análise escrita */}
      {d && (
        <div className="relative mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 text-[13px] leading-relaxed text-white/75 sm:flex-row sm:gap-6">
          <p className="flex-1">
            <span className="mr-1.5 inline-flex items-center gap-1 align-middle font-semibold text-white">
              <Trophy size={14} className="text-amber-300" /> Destaque:
            </span>
            o criativo <span className="font-semibold text-white">“{d.ad}”</span>
            {e && <> ({e.nome})</>} liderou o período com{" "}
            <span className="font-semibold text-cyan-light">
              {fmtInt(d.agg.leads)} {d.agg.leads === 1 ? "lead" : "leads"}
            </span>
            {d.agg.leads > 0 && <> a um CPL de {fmtBRL(cpl(d.agg))}</>}, CTR de{" "}
            {fmtPct(ctr(d.agg))} e {fmtBRL(d.agg.spend, 0)} investidos.
          </p>
          {eficiente && eficiente.cid !== d.cid && (
            <p className="flex-1 sm:border-l sm:border-white/10 sm:pl-6">
              <span className="mr-1.5 font-semibold text-white">
                Mais eficiente:
              </span>
              <span className="font-semibold text-white">
                “{eficiente.ad}”
              </span>{" "}
              entregou o menor custo por lead, a{" "}
              <span className="font-semibold text-cyan-light">
                {fmtBRL(cpl(eficiente.agg))}
              </span>{" "}
              por lead ({fmtInt(eficiente.agg.leads)} leads).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function BigNumber({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.06] px-3 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/55">
        <span className="text-cyan-light">{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function CriativoCard({ data }: { data: CardData }) {
  const e = EMP_MAP[data.emp];
  const a = data.agg;
  const isVideo = a.videoViews > 0;
  return (
    <Card className="group flex flex-col overflow-hidden animate-fade-in">
      <div className="relative overflow-hidden">
        <CreativeImage src={data.thumb} alt={data.ad} />
        <span
          className="absolute left-2 top-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
          style={{ background: e?.cor ?? "#175A97" }}
        >
          {e?.iniciais ?? "—"}
          <span className="hidden sm:inline">{e?.nome ?? empNome(data.emp)}</span>
        </span>
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          {isVideo ? <Film size={11} /> : <Layers size={11} />}
          {isVideo ? "Vídeo" : "Imagem"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink" title={data.ad}>
          {data.ad}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted" title={data.adset}>
          {data.adset}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
          <Metric label="Investimento" value={fmtBRL(a.spend)} />
          <Metric label="Leads" value={fmtInt(a.leads)} />
          <Metric label="Impressões" value={fmtCompact(a.impressions)} />
          <Metric label="Cliques" value={fmtCompact(a.clicks)} />
          <Metric label="CTR" value={fmtPct(ctr(a))} />
          <Metric label="CPM" value={fmtBRL(cpm(a))} />
          <Metric
            label="CPL"
            value={a.leads ? fmtBRL(cpl(a)) : "—"}
            highlight
          />
          {isVideo && (
            <Metric label="Reprod. vídeo" value={fmtCompact(a.videoViews)} />
          )}
        </div>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-canvas px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p
        className={
          "mt-0.5 text-[13px] font-semibold " +
          (highlight ? "text-brand" : "text-ink")
        }
      >
        {value}
      </p>
    </div>
  );
}
