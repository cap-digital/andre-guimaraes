import type { Aggregates, MetricRow } from "./types";

export const EMPTY_AGG: Aggregates = {
  spend: 0,
  impressions: 0,
  clicks: 0,
  reach: 0,
  engagement: 0,
  videoViews: 0,
  v25: 0,
  v50: 0,
  v75: 0,
  v100: 0,
  conversations: 0,
  leads: 0,
};

export function sumRows(rows: MetricRow[]): Aggregates {
  const a: Aggregates = { ...EMPTY_AGG };
  for (const r of rows) {
    a.spend += r.sp;
    a.impressions += r.im;
    a.clicks += r.cl;
    a.reach += r.rc;
    a.engagement += r.en;
    a.videoViews += r.vv;
    a.v25 += r.v25;
    a.v50 += r.v50;
    a.v75 += r.v75;
    a.v100 += r.v100;
    a.conversations += r.cn;
    a.leads += r.ld;
  }
  return a;
}

// Soma um agregado em outro (usado com SummaryRow, que estende Aggregates)
export function addAggregates(a: Aggregates, b: Aggregates): Aggregates {
  a.spend += b.spend;
  a.impressions += b.impressions;
  a.clicks += b.clicks;
  a.reach += b.reach;
  a.engagement += b.engagement;
  a.videoViews += b.videoViews;
  a.v25 += b.v25;
  a.v50 += b.v50;
  a.v75 += b.v75;
  a.v100 += b.v100;
  a.conversations += b.conversations;
  a.leads += b.leads;
  return a;
}

export function addAgg(a: Aggregates, r: MetricRow): Aggregates {
  a.spend += r.sp;
  a.impressions += r.im;
  a.clicks += r.cl;
  a.reach += r.rc;
  a.engagement += r.en;
  a.videoViews += r.vv;
  a.v25 += r.v25;
  a.v50 += r.v50;
  a.v75 += r.v75;
  a.v100 += r.v100;
  a.conversations += r.cn;
  a.leads += r.ld;
  return a;
}

// Custos e taxas derivados
export const cpm = (a: Aggregates) =>
  a.impressions ? (a.spend / a.impressions) * 1000 : 0;
export const cpc = (a: Aggregates) => (a.clicks ? a.spend / a.clicks : 0);
export const ctr = (a: Aggregates) =>
  a.impressions ? (a.clicks / a.impressions) * 100 : 0;
export const cpv = (a: Aggregates) =>
  a.videoViews ? a.spend / a.videoViews : 0;
export const cpl = (a: Aggregates) => (a.leads ? a.spend / a.leads : 0);
export const cpe = (a: Aggregates) =>
  a.engagement ? a.spend / a.engagement : 0;
export const frequency = (a: Aggregates) => (a.reach ? a.impressions / a.reach : 0);
export const taxaConversao = (a: Aggregates) =>
  a.clicks ? (a.leads / a.clicks) * 100 : 0;
export const taxaRetencaoVideo = (a: Aggregates) =>
  a.videoViews ? (a.v100 / a.videoViews) * 100 : 0;
