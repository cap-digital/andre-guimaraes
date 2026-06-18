"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, LayoutGrid, TrendingUp, Users2 } from "lucide-react";
import { useData } from "@/components/DataProvider";
import { EMPREENDIMENTOS } from "@/lib/empreendimentos";
import { Logo } from "@/components/ui/Logo";
import { fmtBRLCompact, fmtCompact } from "@/lib/format";
import { ErrorState } from "@/components/ui/States";

export function Landing() {
  const { rows, empByCid, range, loading, error, reload } = useData();

  const statsByEmp = useMemo(() => {
    const m = new Map<string, { spend: number; leads: number }>();
    for (const e of EMPREENDIMENTOS) m.set(e.key, { spend: 0, leads: 0 });
    for (const r of rows) {
      const k = empByCid[r.c];
      const s = m.get(k);
      if (s) {
        s.spend += r.sp;
        s.leads += r.ld;
      }
    }
    return m;
  }, [rows, empByCid]);

  const totals = useMemo(() => {
    let spend = 0,
      leads = 0;
    for (const s of statsByEmp.values()) {
      spend += s.spend;
      leads += s.leads;
    }
    return { spend, leads };
  }, [statsByEmp]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy">
      {/* Brilhos de fundo */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-cyan/20 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        <header className="flex items-center justify-between">
          <Logo variant="light" />
          <span className="hidden text-xs font-medium text-white/50 sm:block">
            Dashboard de Mídia · Meta Ads
          </span>
        </header>

        <div className="mt-12 max-w-2xl sm:mt-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-cyan-light">
            <TrendingUp size={13} /> Performance de campanhas
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            Acompanhe os resultados dos seus empreendimentos
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">
            Selecione um empreendimento para uma análise dedicada ou veja o
            panorama consolidado de todos os 6 empreendimentos do Grupo André
            Guimarães.
          </p>
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl bg-white p-6">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : (
          <>
            {/* Ver todos */}
            <Link
              href="/visao-geral"
              className="group mt-10 flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-gradient-to-r from-brand/30 to-cyan/15 p-5 transition hover:border-white/30 sm:p-6"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                  <LayoutGrid size={22} />
                </span>
                <div>
                  <p className="text-base font-semibold text-white">
                    Ver todos os empreendimentos
                  </p>
                  <p className="text-xs text-white/60">
                    {loading
                      ? "Carregando dados…"
                      : `${fmtBRLCompact(totals.spend)} investidos · ${fmtCompact(
                          totals.leads
                        )} leads no total`}
                  </p>
                </div>
              </div>
              <ArrowRight
                size={22}
                className="text-white/70 transition group-hover:translate-x-1 group-hover:text-white"
              />
            </Link>

            {/* Grade de empreendimentos */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EMPREENDIMENTOS.map((e) => {
                const s = statsByEmp.get(e.key);
                return (
                  <Link
                    key={e.key}
                    href={`/visao-geral?emp=${encodeURIComponent(e.key)}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/25 hover:bg-white/[0.07]"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: e.cor }}
                    />
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white"
                        style={{ background: e.cor }}
                      >
                        {e.iniciais}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {e.nome}
                        </p>
                        <p className="text-[11px] text-white/50">
                          Meta Ads
                        </p>
                      </div>
                      <ArrowRight
                        size={18}
                        className="ml-auto text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/80"
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Mini
                        label="Investimento"
                        value={loading ? "—" : fmtBRLCompact(s?.spend ?? 0)}
                      />
                      <Mini
                        label="Leads"
                        value={loading ? "—" : fmtCompact(s?.leads ?? 0)}
                        icon={<Users2 size={12} />}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>

            {!loading && range.min && (
              <p className="mt-6 text-center text-[11px] text-white/40">
                Dados de {range.min.split("-").reverse().join("/")} a{" "}
                {range.max.split("-").reverse().join("/")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-black/20 px-3 py-2">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/40">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
