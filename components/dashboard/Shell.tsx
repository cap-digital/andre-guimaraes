"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Images,
  Building2,
  UsersRound,
  Clapperboard,
  Menu,
  X,
  Home,
  RefreshCw,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { EmpSwitcher } from "./EmpSwitcher";
import { DateRangePicker } from "./DateRangePicker";
import { useFilters, buildQuery } from "@/lib/useFilters";
import { useData } from "@/components/DataProvider";

const NAV = [
  { href: "/visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/empreendimentos", label: "Empreendimentos", icon: Building2 },
  { href: "/publicos", label: "Públicos", icon: UsersRound },
  { href: "/video", label: "Vídeo", icon: Clapperboard },
  { href: "/criativos", label: "Criativos", icon: Images },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { filters } = useFilters();
  const { updatedAt, reload, loading } = useData();
  const qs = buildQuery(filters);

  // A página de Empreendimentos sempre compara todos os empreendimentos
  // (responde apenas ao filtro de período), então o seletor é ocultado.
  const showEmpSwitcher = !pathname?.startsWith("/empreendimentos");

  return (
    <div className="min-h-screen lg:flex lg:h-screen lg:overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden h-screen w-60 shrink-0 flex-col bg-navy lg:flex">
        <SidebarContent pathname={pathname} qs={qs} />
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-navy animate-fade-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 text-white/70 hover:text-white"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
            <SidebarContent
              pathname={pathname}
              qs={qs}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-y-auto">
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
          <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-line bg-white p-2 text-ink lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-base font-semibold text-ink sm:text-lg">
                  {NAV.find((n) => pathname?.startsWith(n.href))?.label ??
                    "Dashboard"}
                </h1>
                <p className="hidden text-xs text-muted sm:block">
                  Campanhas Meta Ads · Performance de mídia
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {showEmpSwitcher && <EmpSwitcher />}
              <DateRangePicker />
              <button
                onClick={reload}
                disabled={loading}
                title="Atualizar dados"
                className="flex items-center justify-center rounded-xl border border-line bg-white p-2.5 text-muted shadow-sm transition hover:text-brand disabled:opacity-50"
              >
                <RefreshCw size={16} className={clsx(loading && "animate-spin")} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>

        <footer className="border-t border-line px-4 py-4 text-center text-[11px] text-muted sm:px-6">
          Grupo André Guimarães · Dashboard de Mídia
          {updatedAt && (
            <> · Atualizado em {new Date(updatedAt).toLocaleString("pt-BR")}</>
          )}
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  qs,
  onNavigate,
}: {
  pathname: string | null;
  qs: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="px-5 py-5">
        <Logo variant="light" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`${item.href}${qs}`}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <Home size={18} />
          Trocar empreendimento
        </Link>
      </div>
    </>
  );
}
