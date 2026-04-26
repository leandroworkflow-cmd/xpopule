const TEAM_LOGOS: Record<string, string> = {
  cruzeiro: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Cruzeiro_Esporte_Clube_-_Escudo.svg/200px-Cruzeiro_Esporte_Clube_-_Escudo.svg.png",
  atletico_mg: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Atletico_mineiro_galo.png/200px-Atletico_mineiro_galo.png",
  america_mg: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Am%C3%A9rica_Futebol_Clube_%28MG%29_logo.svg/200px-Am%C3%A9rica_Futebol_Clube_%28MG%29_logo.svg.png",
  palmeiras: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Palmeiras_logo.svg/200px-Palmeiras_logo.svg.png",
  corinthians: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sport_Club_Corinthians_Paulista.png/200px-Sport_Club_Corinthians_Paulista.png",
  sao_paulo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg/200px-Brasao_do_Sao_Paulo_Futebol_Clube.svg.png",
  santos: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Santos_FC_logo.svg/200px-Santos_FC_logo.svg.png",
  flamengo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Flamengo_braz_logo.svg/200px-Flamengo_braz_logo.svg.png",
  fluminense: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Fluminense_fc_logo.svg/200px-Fluminense_fc_logo.svg.png",
  vasco: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/CR_Vasco_da_Gama_logo.svg/200px-CR_Vasco_da_Gama_logo.svg.png",
  botafogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Botafogo_star_logo.svg/200px-Botafogo_star_logo.svg.png",
  gremio: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Gr%C3%AAmio_Foot-Ball_Porto_Alegrense_logo.svg/200px-Gr%C3%AAmio_Foot-Ball_Porto_Alegrense_logo.svg.png",
  internacional: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Escudo_do_Sport_Club_Internacional.svg/200px-Escudo_do_Sport_Club_Internacional.svg.png",
  juventude: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Esporte_Clube_Juventude_logo.svg/200px-Esporte_Clube_Juventude_logo.svg.png",
  athletico_pr: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Athletico_Paranaense_logo.svg/200px-Athletico_Paranaense_logo.svg.png",
  coritiba: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Coritiba_Foot_Ball_Club_logo.svg/200px-Coritiba_Foot_Ball_Club_logo.svg.png",
  bahia: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Esporte_Clube_Bahia_logo.svg/200px-Esporte_Clube_Bahia_logo.svg.png",
  vitoria: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Esporte_Clube_Vit%C3%B3ria_logo.svg/200px-Esporte_Clube_Vit%C3%B3ria_logo.svg.png",
  fortaleza: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Fortaleza_EC_logo.svg/200px-Fortaleza_EC_logo.svg.png",
  ceara: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Cear%C3%A1_Sporting_Club_logo.svg/200px-Cear%C3%A1_Sporting_Club_logo.svg.png",
  sport: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Sport_Club_do_Recife_logo.svg/200px-Sport_Club_do_Recife_logo.svg.png",
  goias: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Goi%C3%A1s_Esporte_Clube_logo.svg/200px-Goi%C3%A1s_Esporte_Clube_logo.svg.png",
  atletico_go: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Atl%C3%A9tico_Goianiense_logo.svg/200px-Atl%C3%A9tico_Goianiense_logo.svg.png",
  cuiaba: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Cuiab%C3%A1_Esporte_Clube_logo.svg/200px-Cuiab%C3%A1_Esporte_Clube_logo.svg.png",
  bragantino: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Red_Bull_Bragantino_logo.svg/200px-Red_Bull_Bragantino_logo.svg.png",
  chapecoense: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Associa%C3%A7%C3%A3o_Chapecoense_de_Futebol_logo.svg/200px-Associa%C3%A7%C3%A3o_Chapecoense_de_Futebol_logo.svg.png",
  avai: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Ava%C3%AD_Futebol_Clube_logo.svg/200px-Ava%C3%AD_Futebol_Clube_logo.svg.png",
  criciuma: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Cricium%C3%A3_Esporte_Clube_logo.svg/200px-Cricium%C3%A3_Esporte_Clube_logo.svg.png",
  mirassol: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Mirassol_Futebol_Clube_logo.svg/200px-Mirassol_Futebol_Clube_logo.svg.png",
  remo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Clube_do_Remo_logo.svg/200px-Clube_do_Remo_logo.svg.png",
  paysandu: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Paysandu_Sport_Club_logo.svg/200px-Paysandu_Sport_Club_logo.svg.png",
  nautico: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Clube_N%C3%A1utico_Capibaribe_logo.svg/200px-Clube_N%C3%A1utico_Capibaribe_logo.svg.png",
  ponte_preta: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Associa%C3%A7%C3%A3o_Atletica_Ponte_Preta_logo.svg/200px-Associa%C3%A7%C3%A3o_Atletica_Ponte_Preta_logo.svg.png",
  guarani: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Guarani_FC_logo.svg/200px-Guarani_FC_logo.svg.png",
  brazil: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_Brazil.svg/200px-Flag_of_Brazil.svg.png",
  argentina: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/24px-Flag_of_Argentina.svg.png/200px-24px-Flag_of_Argentina.svg.png",
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
  atletico_pr: "athletico_pr",
  atletico: "atletico_mg",
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
