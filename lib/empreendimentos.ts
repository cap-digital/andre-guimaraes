// Mapeamento campanha (Meta Ads) -> empreendimento
export const CAMPAIGN_TO_EMP: Record<string, string> = {
  "[QUARTIER] [LEAD AD]": "QUARTIER",
  "[ART STUDIO] [LEAD AD]": "ART STUDIO",
  "[CADASTROS] [NOUVELLE]": "NOUVELLE BOSSA",
  "NOUVELLE BLUES | CADASTRO": "NOUVELLE BLUES",
  "[BRISA MARINA] [LEAD AD]": "BRISA MARINA",
  "ART TANCREDO | CADASTRO": "ART TANCREDO",
};

export interface Empreendimento {
  key: string;
  nome: string;
  cor: string;
  iniciais: string;
}

// Ordem e cores de cada empreendimento (harmonizadas com a marca)
export const EMPREENDIMENTOS: Empreendimento[] = [
  { key: "ART STUDIO", nome: "Art Studio", cor: "#175A97", iniciais: "AS" },
  { key: "ART TANCREDO", nome: "Art Tancredo", cor: "#10AFE0", iniciais: "AT" },
  { key: "BRISA MARINA", nome: "Brisa Marina", cor: "#2BB6A3", iniciais: "BM" },
  { key: "NOUVELLE BLUES", nome: "Nouvelle Blues", cor: "#6772D4", iniciais: "NB" },
  { key: "NOUVELLE BOSSA", nome: "Nouvelle Bossa", cor: "#9B6FD4", iniciais: "NO" },
  { key: "QUARTIER", nome: "Quartier", cor: "#E0942F", iniciais: "QU" },
];

export const EMP_MAP: Record<string, Empreendimento> = Object.fromEntries(
  EMPREENDIMENTOS.map((e) => [e.key, e])
);

export function empNome(key: string): string {
  return EMP_MAP[key]?.nome ?? key;
}

export function empCor(key: string): string {
  return EMP_MAP[key]?.cor ?? "#175A97";
}

// Resolve a chave do empreendimento: usa a coluna "Empreendimento" quando
// disponível (ex.: "Nouvelle Bossa") e recorre à campanha como fallback.
export function resolveEmp(coluna: string | undefined, campaign: string): string {
  const c = (coluna || "").trim();
  if (c) {
    const key = c.toUpperCase();
    if (EMP_MAP[key]) return key;
    for (const e of EMPREENDIMENTOS) {
      if (key.includes(e.key)) return e.key;
    }
  }
  return mapCampaignToEmp(campaign);
}

export function mapCampaignToEmp(campaign: string): string {
  if (CAMPAIGN_TO_EMP[campaign]) return CAMPAIGN_TO_EMP[campaign];
  const upper = (campaign || "").toUpperCase();
  for (const e of EMPREENDIMENTOS) {
    if (upper.includes(e.key)) return e.key;
  }
  if (upper.includes("NOUVELLE")) return "NOUVELLE BOSSA";
  return "OUTROS";
}
