import { NextResponse } from "next/server";
import { resolveEmp } from "@/lib/empreendimentos";
import type { Creative, DatasetResponse, MetricRow } from "@/lib/types";

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

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

let cache: { data: DatasetResponse; ts: number } | null = null;
let inflight: Promise<DatasetResponse> | null = null;

async function buildDataset(): Promise<DatasetResponse> {
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EDGE_KEY}`,
      apikey: EDGE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Functions" }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Edge function respondeu ${res.status}`);
  }

  const json = (await res.json()) as { meta?: RawRow[] };
  const raw = Array.isArray(json.meta) ? json.meta : [];

  const creativeIndex = new Map<string, number>();
  const creatives: Creative[] = [];
  const rows: MetricRow[] = [];

  let minDate = "9999-99-99";
  let maxDate = "0000-00-00";

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

    const d = String(r.date).slice(0, 10);
    if (d < minDate) minDate = d;
    if (d > maxDate) maxDate = d;

    rows.push({
      d,
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

  return {
    rows,
    creatives,
    range: { min: minDate, max: maxDate },
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < TTL_MS) {
      return NextResponse.json(cache.data);
    }
    if (!inflight) {
      inflight = buildDataset()
        .then((data) => {
          cache = { data, ts: Date.now() };
          return data;
        })
        .finally(() => {
          inflight = null;
        });
    }
    const data = await inflight;
    return NextResponse.json(data);
  } catch (err) {
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar dados" },
      { status: 502 }
    );
  }
}
