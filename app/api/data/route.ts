import { NextRequest, NextResponse } from "next/server";
import { resolveEmp } from "@/lib/empreendimentos";
import { EMPTY_AGG } from "@/lib/metrics";
import type {
  Creative,
  DatasetResponse,
  MetricRow,
  SummaryResponse,
  SummaryRow,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EDGE_URL =
  "https://cqrpbiepyeypbkizwacu.supabase.co/functions/v1/Andre-Guimaraes";
const EDGE_KEY = "sb_publishable_YN9YKLw6sludrgf9T2i_1g_Dcm8dIiK";

const TTL_MS = 1000 * 60 * 30; // 30 minutos

interface RawRow {
  date: string;
  campaign: string;
  adset_name: string;
  ad_name: string;
  thumbnail_url: string;
  age: string;
  gender: string;
  spend: unknown;
  impressions: unknown;
  clicks: unknown;
  actions_post_engagement: unknown;
  reach: unknown;
  video_thruplay_watched_actions_video_view: unknown;
  video_p25_watched_actions_video_view: unknown;
  video_p50_watched_actions_video_view: unknown;
  video_p75_watched_actions_video_view: unknown;
  video_p100_watched_actions_video_view: unknown;
  actions_onsite_conversion_messaging_conversation_started_7d: unknown;
  actions_offsite_conversion_fb_pixel_lead: unknown;
  actions_onsite_conversion_lead_grouped: unknown;
  Empreendimento?: string;
}

interface EdgePayload {
  meta?: RawRow[];
  range?: { min: string; max: string };
}

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

const emptyRange = { min: "", max: "" };

async function callEdge(body: Record<string, unknown>): Promise<EdgePayload> {
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EDGE_KEY}`,
      apikey: EDGE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Edge function respondeu ${res.status}`);
  }

  return (await res.json()) as EdgePayload;
}

// ---- Detalhe: linhas por criativo × idade × gênero, do período selecionado ----

async function buildDetail(de?: string, ate?: string): Promise<DatasetResponse> {
  const body: Record<string, unknown> = { mode: "detail" };
  if (de) body.de = de;
  if (ate) body.ate = ate;

  const json = await callEdge(body);
  const raw = Array.isArray(json.meta) ? json.meta : [];

  const creativeIndex = new Map<string, number>();
  const creatives: Creative[] = [];
  const rows: MetricRow[] = [];

  for (const r of raw) {
    const emp = resolveEmp(r.Empreendimento, r.campaign);
    const thumb = r.thumbnail_url || "";
    const key = `${emp}||${r.ad_name}||${thumb}`;
    let cid = creativeIndex.get(key);
    if (cid === undefined) {
      cid = creatives.length;
      creativeIndex.set(key, cid);
      creatives.push({
        id: cid,
        emp,
        ad: r.ad_name || "Sem nome",
        adset: r.adset_name || "",
        campaign: r.campaign || "",
        thumb,
      });
    }

    rows.push({
      d: String(r.date).slice(0, 10),
      c: cid,
      ag: r.age || "Unknown",
      g: r.gender || "unknown",
      sp: num(r.spend),
      im: num(r.impressions),
      cl: num(r.clicks),
      rc: num(r.reach),
      en: num(r.actions_post_engagement),
      vv: num(r.video_thruplay_watched_actions_video_view),
      v25: num(r.video_p25_watched_actions_video_view),
      v50: num(r.video_p50_watched_actions_video_view),
      v75: num(r.video_p75_watched_actions_video_view),
      v100: num(r.video_p100_watched_actions_video_view),
      cn: num(r.actions_onsite_conversion_messaging_conversation_started_7d),
      ld:
        num(r.actions_offsite_conversion_fb_pixel_lead) +
        num(r.actions_onsite_conversion_lead_grouped),
    });
  }

  // O período efetivo é o que a Edge realmente aplicou (padrão = últimos 30 dias).
  let effDe = de ?? "";
  let effAte = ate ?? "";
  if (!effDe || !effAte) {
    let min = "9999-99-99";
    let max = "0000-00-00";
    for (const row of rows) {
      if (row.d < min) min = row.d;
      if (row.d > max) max = row.d;
    }
    if (rows.length) {
      effDe = effDe || min;
      effAte = effAte || max;
    }
  }

  return {
    rows,
    creatives,
    range: json.range ?? emptyRange,
    de: effDe,
    ate: effAte,
    updatedAt: new Date().toISOString(),
  };
}

// ---- Resumo: métricas diárias por empreendimento, todo o período ----

async function buildSummary(): Promise<SummaryResponse> {
  const json = await callEdge({ mode: "summary" });
  const raw = Array.isArray(json.meta) ? json.meta : [];

  const map = new Map<string, SummaryRow>();
  for (const r of raw) {
    const d = String(r.date).slice(0, 10);
    const emp = resolveEmp(r.Empreendimento, r.campaign);
    const key = `${d}||${emp}`;
    let s = map.get(key);
    if (!s) {
      s = { ...EMPTY_AGG, d, emp };
      map.set(key, s);
    }
    s.spend += num(r.spend);
    s.impressions += num(r.impressions);
    s.clicks += num(r.clicks);
    s.reach += num(r.reach);
    s.engagement += num(r.actions_post_engagement);
    s.videoViews += num(r.video_thruplay_watched_actions_video_view);
    s.v25 += num(r.video_p25_watched_actions_video_view);
    s.v50 += num(r.video_p50_watched_actions_video_view);
    s.v75 += num(r.video_p75_watched_actions_video_view);
    s.v100 += num(r.video_p100_watched_actions_video_view);
    s.conversations += num(
      r.actions_onsite_conversion_messaging_conversation_started_7d
    );
    s.leads +=
      num(r.actions_offsite_conversion_fb_pixel_lead) +
      num(r.actions_onsite_conversion_lead_grouped);
  }

  return {
    summary: [...map.values()],
    range: json.range ?? emptyRange,
    updatedAt: new Date().toISOString(),
  };
}

// ---- Cache em memória por chave (modo + período) ----

const cache = new Map<string, { data: unknown; ts: number }>();
const inflight = new Map<string, Promise<unknown>>();

function getCached<T>(key: string, build: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.ts < TTL_MS) return Promise.resolve(hit.data as T);

  let promise = inflight.get(key) as Promise<T> | undefined;
  if (!promise) {
    promise = build()
      .then((data) => {
        cache.set(key, { data, ts: Date.now() });
        return data;
      })
      .finally(() => {
        inflight.delete(key);
      });
    inflight.set(key, promise as Promise<unknown>);
  }
  return promise;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") === "summary" ? "summary" : "detail";

  try {
    if (mode === "summary") {
      const data = await getCached("summary", buildSummary);
      return NextResponse.json(data);
    }

    const de = searchParams.get("de") || undefined;
    const ate = searchParams.get("ate") || undefined;
    const key = `detail|${de ?? ""}|${ate ?? ""}`;
    const data = await getCached(key, () => buildDetail(de, ate));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar dados" },
      { status: 502 }
    );
  }
}
