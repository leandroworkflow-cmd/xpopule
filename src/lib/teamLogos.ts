const TEAM_LOGOS: Record<string, string> = {
  flamengo: "/escudos/flamengo.png",
  palmeiras: "/escudos/palmeiras.png",
  corinthians: "/escudos/corinthians.png",
  fluminense: "/escudos/fluminense.png",
  botafogo: "/escudos/botafogo.png",
  vasco: "/escudos/vasco.png",
  internacional: "/escudos/internacional.png",
  gremio: "/escudos/gremio.png",
  atletico_mg: "/escudos/atletico_mg.png",
  cruzeiro: "/escudos/cruzeiro.png",
  santos: "/escudos/santos.png",
  sao_paulo: "/escudos/sao_paulo.png",
  bahia: "/escudos/bahia.png",
  athletico_pr: "/escudos/athletico_pr.png",
  coritiba: "/escudos/coritiba.png",
  fortaleza: "/escudos/fortaleza.png",
  bragantino: "/escudos/bragantino.png",
  chapecoense: "/escudos/chapecoense.png",
  criciuma: "/escudos/criciuma.png",
  vitoria: "/escudos/vitoria.png",
  mirassol: "/escudos/mirassol.png",
  remo: "/escudos/remo.png",
  juventude: "/escudos/juventude.png",
  america_mg: "/escudos/america_mg.png",
  goias: "/escudos/goias.png",
  cuiaba: "/escudos/cuiaba.png",
  atletico_go: "/escudos/atletico_go.png",
  sport: "/escudos/sport.png",
  ceara: "/escudos/ceara.png",
  avai: "/escudos/avai.png",
};

const SYNONYMS: Record<string, string> = {
  atletico_mineiro: "atletico_mg",
  galo: "atletico_mg",
  flamengo_rj: "flamengo",
  paranaense: "athletico_pr",
  furacao: "athletico_pr",
  athletico_pr: "athletico_pr",
  sao_paulo_fc: "sao_paulo",
  inter: "internacional",
  america_mineiro: "america_mg",
  red_bull_bragantino: "bragantino",
  atletico_goianiense: "atletico_go",
  atletico: "atletico_mg",
};

const DEFAULT_LOGO = "";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function resolveTeamKey(raw: string): string {
  const key = normalize(raw);
  return SYNONYMS[key] || key;
}

export interface TeamInfo {
  key: string;
  name: string;
  logo: string;
}

export interface MatchTeams {
  teamA: TeamInfo;
  teamB: TeamInfo;
}

function buildTeamInfo(rawName: string): TeamInfo {
  const key = resolveTeamKey(rawName);
  const logo = TEAM_LOGOS[key] || DEFAULT_LOGO;
  return { key, name: rawName.trim(), logo };
}

export function extractTeamsFromTitle(title: string): MatchTeams | null {
  const separators = [/\s+x\s+/i, /\s+vs\.?\s+/i];
  for (const sep of separators) {
    const parts = title.split(sep);
    if (parts.length >= 2) {
      const a = parts[0];
      const b = parts[1].split(/[:\-–—]/)[0];
      return {
        teamA: buildTeamInfo(a),
        teamB: buildTeamInfo(b),
      };
    }
  }
  return null;
}

export function getTeamLogo(teamName: string): string {
  const key = resolveTeamKey(teamName);
  return TEAM_LOGOS[key] || DEFAULT_LOGO;
}
