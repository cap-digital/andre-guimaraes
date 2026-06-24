import { unstable_cache } from "next/cache";
import { resolveEmp } from "@/lib/empreendimentos";
import { EMPTY_AGG } from "@/lib/metrics";
import type {
  Creative,
  DatasetResponse,
  MetricRow,
  SummaryResponse,
  SummaryRow,
} from "@/lib/types";

const EDGE_URL =
  "https://cqrpbiepyeypbkizwacu.supabase.co/functions/v1/Andre-Guimaraes";
const EDGE_KEY = "sb_publishable_YN9YKLw6sludrgf9T2i_1g_Dcm8dIiK";

// A Edge responde 504 quando o gateway estoura (~150s). Abortamos um pouco
// antes para conseguir tentar de novo dentro do mesmo request.
const EDGE_TIMEOUT_MS = 135_000;
const MAX_RETRIES = 2;

// Início do dataset (Apps Script). Usado como `de` do "Todo o período" e para
// montar o `range` que alimenta o seletor de datas no frontend.
const DATASET_START = "2026-01-01";

// Janela padrão quando nenhum período é selecionado.
const DEFAULT_DAYS = 30;

// Tag de cache: os dados mudam 1x/dia (windsor.ai às 9h). O cron diário
// invalida esta tag logo após a atualização para reaquecer com dados frescos.
export const DASHBOARD_TAG = "dashboard-data";

// Fallback: mesmo sem o cron, o cache se renova a cada 24h.
const CACHE_REVALIDATE_S = 60 * 60 * 24;

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

// ---- Utilitários de data (YYYY-MM-DD em UTC) ----

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// O seletor de datas precisa dos limites do dataset inteiro. A Edge nem sempre
// devolve `range`, então sintetizamos a partir do início conhecido até hoje.
function datasetRange(payloadRange?: {
  min: string;
  max: string;
}): { min: string; max: string } {
  if (payloadRange?.min && payloadRange?.max) return payloadRange;
  return { min: DATASET_START, max: todayISO() };
}

async function callEdge(
  body: Record<string, unknown>,
  attempt = 0
): Promise<EdgePayload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EDGE_TIMEOUT_MS);

  try {
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EDGE_KEY}`,
        apikey: EDGE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      // 5xx (inclui 504 de timeout) costuma ser transitório: tenta de novo.
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        return callEdge(body, attempt + 1);
      }
      throw new Error(`Edge function respondeu ${res.status}`);
    }

    return (await res.json()) as EdgePayload;
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    const network = err instanceof TypeError;
    if ((aborted || network) && attempt < MAX_RETRIES) {
      return callEdge(body, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Resolve o período efetivo: usa o selecionado ou cai no padrão (últimos N dias).
function resolvePeriod(de?: string, ate?: string): { de: string; ate: string } {
  const effAte = ate || todayISO();
  const effDe = de || addDaysISO(effAte, -(DEFAULT_DAYS - 1));
  return { de: effDe, ate: effAte };
}

// ---- Detalhe: linhas por criativo × idade × gênero, do período selecionado ----

async function buildDetail(de?: string, ate?: string): Promise<DatasetResponse> {
  const period = resolvePeriod(de, ate);
  const json = await callEdge({
    mode: "detail",
    de: period.de,
    ate: period.ate,
  });
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

  return {
    rows,
    creatives,
    range: datasetRange(json.range),
    de: period.de,
    ate: period.ate,
    updatedAt: new Date().toISOString(),
  };
}

// ---- Resumo: métricas diárias por empreendimento, todo o período ----
// Alimenta o comparativo de período anterior e os gráficos mensais, por isso
// pede o dataset inteiro (a Edge devolve já agregado).

async function buildSummary(): Promise<SummaryResponse> {
  const ate = todayISO();
  const json = await callEdge({ mode: "summary", de: DATASET_START, ate });
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
    range: datasetRange(json.range),
    updatedAt: new Date().toISOString(),
  };
}

// ---- Cache persistente (Vercel Data Cache, compartilhado entre instâncias) ----
// Sobrevive ao reciclo de instâncias serverless; o cron diário invalida a tag.

export function getDetail(
  de?: string,
  ate?: string
): Promise<DatasetResponse> {
  return unstable_cache(() => buildDetail(de, ate), ["detail", de ?? "", ate ?? ""], {
    revalidate: CACHE_REVALIDATE_S,
    tags: [DASHBOARD_TAG],
  })();
}

export const getSummary = unstable_cache(buildSummary, ["summary"], {
  revalidate: CACHE_REVALIDATE_S,
  tags: [DASHBOARD_TAG],
});
