// Linha de métrica compacta (chaves curtas para reduzir payload)
export interface MetricRow {
  d: string; // data YYYY-MM-DD
  c: number; // id do criativo (índice em creatives)
  ag: string; // faixa etária
  g: string; // gênero
  sp: number; // investimento (spend)
  im: number; // impressões
  cl: number; // cliques
  rc: number; // alcance (reach)
  en: number; // engajamento com a publicação
  vv: number; // video thruplay
  v25: number;
  v50: number;
  v75: number;
  v100: number;
  cn: number; // conversas iniciadas
  ld: number; // leads (pixel + formulário)
}

export interface Creative {
  id: number;
  emp: string; // chave do empreendimento
  ad: string; // nome do anúncio
  adset: string; // nome do conjunto
  campaign: string;
  thumb: string; // thumbnail_url
}

export interface DatasetResponse {
  rows: MetricRow[];
  creatives: Creative[];
  range: { min: string; max: string };
  updatedAt: string;
}

// Métricas agregadas calculadas
export interface Aggregates {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  engagement: number;
  videoViews: number;
  v25: number;
  v50: number;
  v75: number;
  v100: number;
  conversations: number;
  leads: number;
}
