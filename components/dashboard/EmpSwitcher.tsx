"use client";

import clsx from "clsx";
import { Building2, Check, ChevronDown, LayoutGrid } from "lucide-react";
import { EMPREENDIMENTOS, EMP_MAP } from "@/lib/empreendimentos";
import { useDashboardData } from "@/lib/useDashboardData";
import { usePopover } from "@/lib/usePopover";

export function EmpSwitcher() {
  const { emp, setFilters } = useDashboardData();
  const { ref, open, setOpen } = usePopover<HTMLDivElement>();

  const atual = emp === "todos" ? null : EMP_MAP[emp];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-left text-[13px] font-medium text-ink shadow-sm transition hover:border-brand-200 sm:w-auto"
      >
        {atual ? (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold text-white"
            style={{ background: atual.cor }}
          >
            {atual.iniciais}
          </span>
        ) : (
          <LayoutGrid size={16} className="text-brand" />
        )}
        <span className="truncate">{atual ? atual.nome : "Todos os empreendimentos"}</span>
        <ChevronDown
          size={15}
          className={clsx("ml-auto text-muted transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-[min(88vw,16rem)] rounded-2xl border border-line bg-white p-1.5 shadow-pop animate-fade-in">
          <Item
            active={emp === "todos"}
            onClick={() => {
              setFilters({ emp: null });
              setOpen(false);
            }}
            icon={
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy/10 text-navy">
                <Building2 size={14} />
              </span>
            }
            label="Todos os empreendimentos"
          />
          <div className="my-1 h-px bg-line" />
          {EMPREENDIMENTOS.map((e) => (
            <Item
              key={e.key}
              active={emp === e.key}
              onClick={() => {
                setFilters({ emp: e.key });
                setOpen(false);
              }}
              icon={
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold text-white"
                  style={{ background: e.cor }}
                >
                  {e.iniciais}
                </span>
              }
              label={e.nome}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Item({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[13px] font-medium transition",
        active ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-canvas"
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
      {active && <Check size={15} className="ml-auto text-brand" />}
    </button>
  );
}
