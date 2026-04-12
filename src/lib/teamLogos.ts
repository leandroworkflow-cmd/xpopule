const TEAM_LOGOS: Record<string, string> = {
  cruzeiro: "https://media.api-sports.io/football/teams/212.png",
  atletico_mg: "https://media.api-sports.io/football/teams/152.png",
  america_mg: "https://media.api-sports.io/football/teams/160.png",
  palmeiras: "https://media.api-sports.io/football/teams/121.png",
  corinthians: "https://media.api-sports.io/football/teams/131.png",
  sao_paulo: "https://media.api-sports.io/football/teams/126.png",
  santos: "https://media.api-sports.io/football/teams/118.png",
  flamengo: "https://media.api-sports.io/football/teams/127.png",
  fluminense: "https://media.api-sports.io/football/teams/124.png",
  vasco: "https://media.api-sports.io/football/teams/123.png",
  botafogo: "https://media.api-sports.io/football/teams/120.png",
  gremio: "https://media.api-sports.io/football/teams/1062.png",
  internacional: "https://media.api-sports.io/football/teams/119.png",
  juventude: "https://media.api-sports.io/football/teams/3984.png",
  caxias: "https://media.api-sports.io/football/teams/3985.png",
  athletico_pr: "https://media.api-sports.io/football/teams/185.png",
  coritiba: "https://media.api-sports.io/football/teams/183.png",
  parana: "https://media.api-sports.io/football/teams/184.png",
  bahia: "https://media.api-sports.io/football/teams/122.png",
  vitoria: "https://media.api-sports.io/football/teams/161.png",
  fortaleza: "https://media.api-sports.io/football/teams/157.png",
  ceara: "https://media.api-sports.io/football/teams/156.png",
  sport: "https://media.api-sports.io/football/teams/151.png",
  nautico: "https://media.api-sports.io/football/teams/3990.png",
  goias: "https://media.api-sports.io/football/teams/129.png",
  atletico_go: "https://media.api-sports.io/football/teams/128.png",
  cuiaba: "https://media.api-sports.io/football/teams/3988.png",
  vila_nova: "https://media.api-sports.io/football/teams/3987.png",
  bragantino: "https://media.api-sports.io/football/teams/199.png",
  mirassol: "https://media.api-sports.io/football/teams/3989.png",
  ponte_preta: "https://media.api-sports.io/football/teams/130.png",
  guarani: "https://media.api-sports.io/football/teams/3992.png",
  ituano: "https://media.api-sports.io/football/teams/3993.png",
  novorizontino: "https://media.api-sports.io/football/teams/3994.png",
  chapecoense: "https://media.api-sports.io/football/teams/177.png",
  avai: "https://media.api-sports.io/football/teams/178.png",
  figueirense: "https://media.api-sports.io/football/teams/3995.png",
  criciuma: "https://media.api-sports.io/football/teams/176.png",
  sampaio_correa: "https://media.api-sports.io/football/teams/3996.png",
  abc: "https://media.api-sports.io/football/teams/3997.png",
  remo: "https://media.api-sports.io/football/teams/3998.png",
  paysandu: "https://media.api-sports.io/football/teams/3999.png",
  brazil: "https://media.api-sports.io/football/teams/6.png",
  argentina: "https://media.api-sports.io/football/teams/26.png",
  france: "https://media.api-sports.io/football/teams/2.png",
  england: "https://media.api-sports.io/football/teams/10.png",
};

const SYNONYMS: Record<string, string> = {
  atletico_mineiro: "atletico_mg",
  galo: "atletico_mg",
  flamengo_rj: "flamengo",
  paranaense: "athletico_pr",
  furacao: "athletico_pr",
  sao_paulo_fc: "sao_paulo",
  inter: "internacional",
  america_mineiro: "america_mg",
  red_bull_bragantino: "bragantino",
  atletico_goianiense: "atletico_go",
};

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/53/53283.png";

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

/**
 * Extracts two teams from a market title like "Flamengo x Corinthians".
 * Returns null if no match pattern is found.
 */
export function extractTeamsFromTitle(title: string): MatchTeams | null {
  // Try common separators: " x ", " vs ", " vs. ", " X "
  const separators = [/\s+x\s+/i, /\s+vs\.?\s+/i];
  for (const sep of separators) {
    const parts = title.split(sep);
    if (parts.length >= 2) {
      // Take last two meaningful parts (in case title has prefix text)
      const a = parts[0];
      const b = parts[1].split(/[:\-–—]/)[0]; // stop at score or dash
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
