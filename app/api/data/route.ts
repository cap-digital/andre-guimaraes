import { NextRequest, NextResponse } from "next/server";
import { getDetail, getSummary } from "@/lib/dashboardData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A Edge function pode levar bem mais de 60s. Plano Vercel Pro permite até 300s.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") === "summary" ? "summary" : "detail";

  try {
    if (mode === "summary") {
      return NextResponse.json(await getSummary());
    }

    const de = searchParams.get("de") || undefined;
    const ate = searchParams.get("ate") || undefined;
    return NextResponse.json(await getDetail(de, ate));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar dados" },
      { status: 502 }
    );
  }
}
