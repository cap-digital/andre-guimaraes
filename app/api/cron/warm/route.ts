import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { DASHBOARD_TAG, getDetail, getSummary } from "@/lib/dashboardData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Aquecimento diário (Vercel Cron). Invalida o cache e reconstrói os payloads
// padrão — detalhe (últimos 30 dias) e resumo (período todo) — para que os
// usuários peguem dados frescos já cacheados, sem o caminho frio de ~90s.
//
// Roda logo após o windsor.ai atualizar a planilha (9h BRT). Veja vercel.json.
export async function GET(req: NextRequest) {
  // Proteção opcional: se CRON_SECRET estiver definido, exige o header que o
  // Vercel Cron envia automaticamente.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  try {
    // Invalida o cache atual e reconstrói com dados frescos.
    revalidateTag(DASHBOARD_TAG);
    const [detail, summary] = await Promise.all([getDetail(), getSummary()]);

    return NextResponse.json({
      ok: true,
      warmedAt: new Date().toISOString(),
      detailRows: detail.rows.length,
      summaryRows: summary.summary.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro" },
      { status: 502 }
    );
  }
}
