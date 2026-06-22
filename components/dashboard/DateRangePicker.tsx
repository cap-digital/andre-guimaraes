"use client";

import { useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react";
import "react-day-picker/style.css";
import { useDashboardData } from "@/lib/useDashboardData";
import { usePopover } from "@/lib/usePopover";
import {
  dateToIso,
  isoToDate,
  monthBounds,
  addDays,
  clampIso,
} from "@/lib/date";
import { fmtMesCurto, fmtDataCompleta } from "@/lib/format";
import clsx from "clsx";

export function DateRangePicker() {
  const { range, de, ate, months, setFilters } = useDashboardData();
  const { ref, open, setOpen } = usePopover<HTMLDivElement>();
  const [draft, setDraft] = useState<DateRange | undefined>();

  const selected: DateRange | undefined = useMemo(() => {
    if (!de || !ate) return undefined;
    return { from: isoToDate(de), to: isoToDate(ate) };
  }, [de, ate]);

  const current = draft ?? selected;

  const label =
    de && ate
      ? `${fmtDataCompleta(isoToDate(de))} — ${fmtDataCompleta(isoToDate(ate))}`
      : "Selecionar período";

  const isFullRange = de === range.min && ate === range.max;

  function apply(newDe: string, newAte: string) {
    // Sempre explícito: sem parâmetros, o padrão passa a ser "últimos 30 dias"
    // (carregado pelo servidor). "Todo o período" grava o intervalo completo.
    setFilters({ de: newDe, ate: newAte });
    setDraft(undefined);
    setOpen(false);
  }

  function quick(days: number) {
    const end = range.max;
    const start = clampIso(addDays(end, -(days - 1)), range.min, range.max);
    apply(start, end);
  }

  const activeMonth = useMemo(() => {
    if (!de || !ate) return null;
    const b = de.slice(0, 7);
    const mb = monthBounds(b);
    return mb.de === de && mb.ate === ate ? b : null;
  }, [de, ate]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-left text-[13px] font-medium text-ink shadow-sm transition hover:border-brand-200 sm:w-auto"
      >
        <CalendarDays size={16} className="text-brand" />
        <span className="truncate">{label}</span>
        <ChevronDown
          size={15}
          className={clsx("ml-auto text-muted transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,40rem)] origin-top-right rounded-2xl border border-line bg-white p-3 shadow-pop animate-fade-in sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            {/* Atalhos + meses */}
            <div className="flex flex-col gap-3 lg:w-44 lg:border-r lg:border-line lg:pr-3">
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Atalhos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={isFullRange} onClick={() => apply(range.min, range.max)}>
                    Todo o período
                  </Chip>
                  <Chip onClick={() => quick(7)}>Últimos 7 dias</Chip>
                  <Chip onClick={() => quick(30)}>Últimos 30 dias</Chip>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Mês
                </p>
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-auto pr-1 lg:max-h-none">
                  {months.map((m) => {
                    const b = monthBounds(m);
                    return (
                      <Chip
                        key={m}
                        active={activeMonth === m}
                        onClick={() => apply(b.de, clampIso(b.ate, range.min, range.max))}
                      >
                        {fmtMesCurto(m)}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Calendário */}
            <div className="flex flex-1 flex-col items-center">
              <DayPicker
                mode="range"
                locale={ptBR}
                numberOfMonths={1}
                defaultMonth={current?.from ?? isoToDate(ate || range.max)}
                startMonth={isoToDate(range.min)}
                endMonth={isoToDate(range.max)}
                disabled={{ before: isoToDate(range.min), after: isoToDate(range.max) }}
                selected={current}
                onSelect={(r) => setDraft(r)}
                className="rdp-root"
              />
              <div className="mt-1 flex w-full items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setDraft(undefined);
                    setOpen(false);
                  }}
                  className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted hover:bg-canvas"
                >
                  Cancelar
                </button>
                <button
                  disabled={!current?.from || !current?.to}
                  onClick={() => {
                    if (current?.from && current?.to) {
                      apply(dateToIso(current.from), dateToIso(current.to));
                    }
                  }}
                  className="rounded-lg bg-brand px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-lg border px-2.5 py-1 text-[12px] font-medium transition",
        active
          ? "border-brand bg-brand text-white"
          : "border-line bg-white text-muted hover:border-brand-200 hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}
