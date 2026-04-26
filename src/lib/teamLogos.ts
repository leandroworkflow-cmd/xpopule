const TEAM_LOGOS: Record<string, string> = {
  sao_paulo: "https://a.espncdn.com/i/teamlogos/soccer/500/126.png",
  flamengo: "https://a.espncdn.com/i/teamlogos/soccer/500/127.png",
  palmeiras: "https://a.espncdn.com/i/teamlogos/soccer/500/121.png",
  corinthians: "https://a.espncdn.com/i/teamlogos/soccer/500/131.png",
  fluminense: "https://a.espncdn.com/i/teamlogos/soccer/500/124.png",
  botafogo: "https://a.espncdn.com/i/teamlogos/soccer/500/120.png",
  vasco: "https://a.espncdn.com/i/teamlogos/soccer/500/123.png",
  internacional: "https://a.espncdn.com/i/teamlogos/soccer/500/119.png",
  gremio: "https://a.espncdn.com/i/teamlogos/soccer/500/6244.png",
  atletico_mg: "https://a.espncdn.com/i/teamlogos/soccer/500/1075.png",
  cruzeiro: "https://a.espncdn.com/i/teamlogos/soccer/500/128.png",
  santos: "https://a.espncdn.com/i/teamlogos/soccer/500/118.png",
  bahia: "https://a.espncdn.com/i/teamlogos/soccer/500/122.png",
  athletico_pr: "https://a.espncdn.com/i/teamlogos/soccer/500/6448.png",
  coritiba: "https://a.espncdn.com/i/teamlogos/soccer/500/183.png",
  fortaleza: "https://a.espncdn.com/i/teamlogos/soccer/500/6435.png",
  ceara: "https://a.espncdn.com/i/teamlogos/soccer/500/6437.png",
  goias: "https://a.espncdn.com/i/teamlogos/soccer/500/6438.png",
  bragantino: "https://a.espncdn.com/i/teamlogos/soccer/500/6459.png",
  america_mg: "https://a.espncdn.com/i/teamlogos/soccer/500/6434.png",
  cuiaba: "https://a.espncdn.com/i/teamlogos/soccer/500/20935.png",
  juventude: "https://a.espncdn.com/i/teamlogos/soccer/500/6033.png",
  chapecoense: "https://a.espncdn.com/i/teamlogos/soccer/500/6444.png",
  avai: "https://a.espncdn.com/i/teamlogos/soccer/500/6441.png",
  criciuma: "https://a.espncdn.com/i/teamlogos/soccer/500/6449.png",
  vitoria: "https://a.espncdn.com/i/teamlogos/soccer/500/6440.png",
  sport: "https://a.espncdn.com/i/teamlogos/soccer/500/6448.png",
  remo: "https://a.espncdn.com/i/teamlogos/soccer/500/6454.png",
  mirassol: "https://a.espncdn.com/i/teamlogos/soccer/500/31234.png",
  atletico_go: "https://a.espncdn.com/i/teamlogos/soccer/500/20936.png",
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

const DEFAULT_LOGO = "https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png";

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
