const TEAM_LOGOS: Record<string, string> = {
  sao_paulo: "/api/logo?url=https://media.api-sports.io/football/teams/126.png",
  flamengo: "/api/logo?url=https://media.api-sports.io/football/teams/127.png",
  palmeiras: "/api/logo?url=https://media.api-sports.io/football/teams/121.png",
  corinthians: "/api/logo?url=https://media.api-sports.io/football/teams/131.png",
  fluminense: "/api/logo?url=https://media.api-sports.io/football/teams/124.png",
  botafogo: "/api/logo?url=https://media.api-sports.io/football/teams/120.png",
  vasco: "/api/logo?url=https://media.api-sports.io/football/teams/123.png",
  internacional: "/api/logo?url=https://media.api-sports.io/football/teams/119.png",
  gremio: "/api/logo?url=https://media.api-sports.io/football/teams/1062.png",
  atletico_mg: "/api/logo?url=https://media.api-sports.io/football/teams/152.png",
  cruzeiro: "/api/logo?url=https://media.api-sports.io/football/teams/212.png",
  santos: "/api/logo?url=https://media.api-sports.io/football/teams/118.png",
  bahia: "/api/logo?url=https://media.api-sports.io/football/teams/122.png",
  athletico_pr: "/api/logo?url=https://media.api-sports.io/football/teams/185.png",
  coritiba: "/api/logo?url=https://media.api-sports.io/football/teams/183.png",
  fortaleza: "/api/logo?url=https://media.api-sports.io/football/teams/157.png",
  ceara: "/api/logo?url=https://media.api-sports.io/football/teams/156.png",
  goias: "/api/logo?url=https://media.api-sports.io/football/teams/129.png",
  bragantino: "/api/logo?url=https://media.api-sports.io/football/teams/199.png",
  america_mg: "/api/logo?url=https://media.api-sports.io/football/teams/160.png",
  cuiaba: "/api/logo?url=https://media.api-sports.io/football/teams/3988.png",
  juventude: "/api/logo?url=https://media.api-sports.io/football/teams/3984.png",
  chapecoense: "/api/logo?url=https://media.api-sports.io/football/teams/177.png",
  avai: "/api/logo?url=https://media.api-sports.io/football/teams/178.png",
  criciuma: "/api/logo?url=https://media.api-sports.io/football/teams/176.png",
  vitoria: "/api/logo?url=https://media.api-sports.io/football/teams/161.png",
  sport: "/api/logo?url=https://media.api-sports.io/football/teams/151.png",
  remo: "/api/logo?url=https://media.api-sports.io/football/teams/3998.png",
  mirassol: "/api/logo?url=https://media.api-sports.io/football/teams/3989.png",
  atletico_go: "/api/logo?url=https://media.api-sports.io/football/teams/128.png",
  nautico: "/api/logo?url=https://media.api-sports.io/football/teams/3990.png",
  ponte_preta: "/api/logo?url=https://media.api-sports.io/football/teams/130.png",
  guarani: "/api/logo?url=https://media.api-sports.io/football/teams/3992.png",
  paysandu: "/api/logo?url=https://media.api-sports.io/football/teams/3999.png",
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

const DEFAULT_LOGO = "/api/logo?url=https://media.api-sports.io/football/teams/33.png";

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
