import fetch from "node-fetch";

const FOOTBALL_KEY  = "ab7e687d7ff24053837db64af9b56453";
const SUPABASE_URL  = "https://odexmyskaespjusivjua.supabase.co";
const SUPABASE_KEY  = "sb_publishable_s9oIKQj9UXCPucjw1cmzlw_N3HqxH-Y";
const BDL_KEY       = "ee89e01a-4107-4947-a427-f508cb69fd7f";

const FOOTBALL_DAYS = 7;
const OUTROS_DAYS   = 14;

// ── FUTEBOL CONFIG ────────────────────────────────────────────────────────────

const COMPETICOES = [
  { code: "BSA", nome: "Brasileirao Serie A" },
  { code: "CLI", nome: "Copa Libertadores"   },
  { code: "CL",  nome: "Champions League"    },
  { code: "PL",  nome: "Premier League"      },
  { code: "PD",  nome: "La Liga"             },
];

const TIMES_PT = {
  "Botafogo FR": "Botafogo", "Fluminense FC": "Fluminense",
  "CR Vasco da Gama": "Vasco", "Sport Club Corinthians Paulista": "Corinthians",
  "Sao Paulo FC": "Sao Paulo", "Santos FC": "Santos",
  "Gremio FBPA": "Gremio", "Sport Club Internacional": "Internacional",
  "Cruzeiro EC": "Cruzeiro", "Atletico Mineiro": "Atletico-MG",
  "Club Athletico Paranaense": "Athletico-PR", "EC Bahia": "Bahia",
  "Fortaleza EC": "Fortaleza", "Mirassol FC": "Mirassol",
  "SE Palmeiras": "Palmeiras", "Coritiba FBC": "Coritiba",
  "EC Vitoria": "Vitoria", "Red Bull Bragantino": "Bragantino",
};

function traduzir(nome) { return TIMES_PT[nome] || nome; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getDateRange(daysAhead) {
  const start = new Date();
  const end   = new Date();
  end.setDate(end.getDate() + daysAhead);
  return {
    start: start.toISOString().split("T")[0],
    end:   end.toISOString().split("T")[0],
  };
}

// ── FUTEBOL ───────────────────────────────────────────────────────────────────

async function fetchJogos(comp) {
  process.stdout.write("  Buscando " + comp.nome + "... ");
  const { start, end } = getDateRange(FOOTBALL_DAYS);
  const url = "https://api.football-data.org/v4/competitions/" + comp.code +
    "/matches?status=SCHEDULED&dateFrom=" + start + "&dateTo=" + end;

  const res = await fetch(url, { headers: { "X-Auth-Token": FOOTBALL_KEY } });
  if (!res.ok) { console.log("Erro " + res.status); return []; }
  const data = await res.json();
  if (data.errorCode) { console.log("sem acesso."); return []; }

  const jogos = data.matches || [];
  console.log(jogos.length + " jogos.");

  return jogos.map(j => {
    const home     = traduzir(j.homeTeam.shortName || j.homeTeam.name);
    const away     = traduzir(j.awayTeam.shortName || j.awayTeam.name);
    const dataJogo = new Date(j.utcDate);
    return {
      id:             "jogo_fd_" + j.id,
      nome:           home + " X " + away,
      end_date:       dataJogo.toISOString(),
      event_date:     dataJogo.toISOString(),
      home_logo:      j.homeTeam.crest || null,
      away_logo:      j.awayTeam.crest || null,
      image_url:      j.homeTeam.crest || null,
      away_image_url: j.awayTeam.crest || null,
      status:         "active",
      category:       "esportes",
      volume:         0,
      yes_prob:       50,
    };
  });
}

// ── NBA ───────────────────────────────────────────────────────────────────────

async function fetchNBA() {
  process.stdout.write("  Buscando NBA... ");
  const { start, end } = getDateRange(OUTROS_DAYS);
  const url = "https://api.balldontlie.io/v1/games"
    + "?start_date=" + start
    + "&end_date=" + end
    + "&per_page=100";

  const res = await fetch(url, { headers: { Authorization: BDL_KEY } });
  if (!res.ok) { console.log("Erro " + res.status); return []; }
  const data = await res.json();
  const jogos = (data.data || []).filter(g => {
    const status = (g.status || "").toLowerCase();
    return status.includes("pm") || status.includes("am") || status.includes(":");
  });

  console.log(jogos.length + " jogos.");
  return jogos.map(g => {
    const home     = g.home_team.full_name;
    const away     = g.visitor_team.full_name;
    const dataJogo = new Date(g.datetime || g.date);
    return {
      id:         "nba_" + g.id,
      nome:       home + " X " + away,
      end_date:   dataJogo.toISOString(),
      event_date: g.datetime || g.date + "T00:00:00Z",
      home_logo:  null,
      away_logo:  null,
      status:     "active",
      category:   "basquete",
      volume:     0,
      yes_prob:   50,
    };
  });
}

// ── MMA/UFC ───────────────────────────────────────────────────────────────────
// ✅ CORRIGIDO: busca as lutas de cada evento e salva atletas em posicoes

async function fetchMMAFights(eventId) {
  // Busca as lutas individuais do evento para pegar os nomes dos atletas
  const url = "https://api.balldontlie.io/mma/v1/fights?event_id=" + eventId + "&per_page=50";
  const res = await fetch(url, { headers: { Authorization: BDL_KEY } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

async function fetchMMA() {
  process.stdout.write("  Buscando MMA/UFC... ");
  const ano = new Date().getFullYear();
  const url = "https://api.balldontlie.io/mma/v1/events?year=" + ano + "&per_page=100";

  const res = await fetch(url, { headers: { Authorization: BDL_KEY } });
  if (!res.ok) { console.log("Erro " + res.status); return { markets: [], posicoes: [] }; }
  const data = await res.json();
  const agora  = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + OUTROS_DAYS);

  const eventos = (data.data || []).filter(e => {
    const s = (e.status || "").toLowerCase();
    const d = new Date(e.date);
    return s === "scheduled" && d > agora && d <= limite;
  }).slice(0, 10);

  console.log(eventos.length + " eventos.");

  const markets  = [];
  const posicoes = [];

  for (const e of eventos) {
    const dataEvento = new Date(e.date);
    const marketId   = "mma_" + e.id;

    markets.push({
      id:         marketId,
      nome:       e.name,
      end_date:   dataEvento.toISOString(),
      event_date: dataEvento.toISOString(),
      home_logo:  null,
      away_logo:  null,
      status:     "active",
      category:   "luta",
      volume:     0,
      yes_prob:   50,
    });

    // ✅ Busca as lutas do evento para pegar nomes dos atletas
    const fights = await fetchMMAFights(e.id);
    await sleep(300); // respeita rate limit

    // Pega a luta principal (main event) — geralmente a primeira ou a de maior ordem
    const mainFight = fights[0];
    if (mainFight) {
      // ✅ nome do atleta A (time_casa = favorito/vermelho)
      const nomeA =
        mainFight.fighter1?.full_name ||
        mainFight.home_fighter?.full_name ||
        mainFight.red_corner?.full_name ||
        mainFight.athlete1?.full_name ||
        null;

      // ✅ nome do atleta B (time_fora = azul)
      const nomeB =
        mainFight.fighter2?.full_name ||
        mainFight.away_fighter?.full_name ||
        mainFight.blue_corner?.full_name ||
        mainFight.athlete2?.full_name ||
        null;

      if (nomeA || nomeB) {
        // Atualiza o nome do mercado para "Atleta A vs Atleta B"
        markets[markets.length - 1].nome = (nomeA || "?") + " vs " + (nomeB || "?");
      }

      posicoes.push(
        {
          mercado_id:     marketId,
          tipo:           "time_casa",
          nome_atleta:    nomeA || e.name,
          preco_unitario: 0.65,
          volume_total:   1000,
          volume_dispor:  1000,
          volume_compra:  0,
        },
        {
          mercado_id:     marketId,
          tipo:           "empate",
          nome_atleta:    null,
          preco_unitario: 0.20,
          volume_total:   1000,
          volume_dispor:  1000,
          volume_compra:  0,
        },
        {
          mercado_id:     marketId,
          tipo:           "time_fora",
          nome_atleta:    nomeB || e.name,
          preco_unitario: 0.15,
          volume_total:   1000,
          volume_dispor:  1000,
          volume_compra:  0,
        }
      );
    } else {
      // Sem lutas na API — cria posicoes sem nome de atleta
      posicoes.push(
        { mercado_id: marketId, tipo: "time_casa", nome_atleta: null, preco_unitario: 0.65, volume_total: 1000, volume_dispor: 1000, volume_compra: 0 },
        { mercado_id: marketId, tipo: "empate",    nome_atleta: null, preco_unitario: 0.20, volume_total: 1000, volume_dispor: 1000, volume_compra: 0 },
        { mercado_id: marketId, tipo: "time_fora", nome_atleta: null, preco_unitario: 0.15, volume_total: 1000, volume_dispor: 1000, volume_compra: 0 },
      );
    }
  }

  return { markets, posicoes };
}

// ── TÊNIS ─────────────────────────────────────────────────────────────────────

async function fetchTenis() {
  process.stdout.write("  Buscando Tenis (ATP/WTA)... ");
  const { start, end } = getDateRange(OUTROS_DAYS);

  const [resATP, resWTA] = await Promise.all([
    fetch("https://api.balldontlie.io/atp/v1/matches?start_date=" + start + "&end_date=" + end + "&per_page=25",
      { headers: { Authorization: BDL_KEY } }),
    fetch("https://api.balldontlie.io/wta/v1/matches?start_date=" + start + "&end_date=" + end + "&per_page=25",
      { headers: { Authorization: BDL_KEY } }),
  ]);

  const atpData = resATP.ok ? (await resATP.json()).data || [] : [];
  const wtaData = resWTA.ok ? (await resWTA.json()).data || [] : [];
  const todos   = [...atpData, ...wtaData];

  const futuros = todos.filter(m => {
    const s = (m.status || "").toLowerCase();
    return s === "scheduled" || s === "ns" || s === "" || s === "upcoming";
  });

  console.log(futuros.length + " partidas.");
  return futuros.slice(0, 15).map(m => {
    const p1       = m.player1?.full_name || m.home?.name || "Atleta 1";
    const p2       = m.player2?.full_name || m.away?.name || "Atleta 2";
    const dataJogo = new Date(m.datetime || m.date || start);
    return {
      id:         "tenis_" + m.id,
      nome:       p1 + " X " + p2,
      end_date:   dataJogo.toISOString(),
      event_date: dataJogo.toISOString(),
      home_logo:  null,
      away_logo:  null,
      status:     "active",
      category:   "tenis",
      volume:     0,
      yes_prob:   50,
    };
  });
}

// ── SALVAR MARKETS ────────────────────────────────────────────────────────────

async function salvar(markets) {
  if (!markets.length) { console.log("Nenhum mercado."); return; }
  console.log("\nSalvando " + markets.length + " markets...");

  for (let i = 0; i < markets.length; i += 50) {
    const lote = markets.slice(i, i + 50);
    const res = await fetch(SUPABASE_URL + "/rest/v1/markets", {
      method: "POST",
      headers: {
        "apikey":        SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates",
      },
      body: JSON.stringify(lote),
    });
    if (!res.ok) { const e = await res.text(); console.error("Erro lote " + i + ": " + e); }
  }
  console.log("✓ Markets salvos!");
}

// ── SALVAR POSICOES MMA ───────────────────────────────────────────────────────

async function salvarPosicoes(posicoes) {
  if (!posicoes.length) return;
  console.log("Salvando " + posicoes.length + " posicoes MMA...");

  for (let i = 0; i < posicoes.length; i += 50) {
    const lote = posicoes.slice(i, i + 50);
    const res = await fetch(SUPABASE_URL + "/rest/v1/posicoes", {
      method: "POST",
      headers: {
        "apikey":        SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates",
      },
      body: JSON.stringify(lote),
    });
    if (!res.ok) { const e = await res.text(); console.error("Erro posicoes: " + e); }
  }
  console.log("✓ Posicoes salvas!");
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log("=== Importador Unificado de Esportes ===");
  const todos = [];

  console.log("\n[Futebol — football-data.org] próximos " + FOOTBALL_DAYS + " dias");
  for (const comp of COMPETICOES) {
    todos.push(...await fetchJogos(comp));
    await sleep(1000);
  }

  console.log("\n[Outros Esportes — balldontlie.io] próximos " + OUTROS_DAYS + " dias");
  todos.push(...await fetchNBA());
  await sleep(500);

  // ✅ MMA agora retorna markets + posicoes separados
  const { markets: mmaMarkets, posicoes: mmaPosicoes } = await fetchMMA();
  todos.push(...mmaMarkets);
  await sleep(500);

  todos.push(...await fetchTenis());

  const unicos = Object.values(Object.fromEntries(todos.map(j => [j.id, j])));
  console.log("\nTotal: " + unicos.length + " eventos.");
  await salvar(unicos);

  // ✅ Salva atletas nas posicoes depois dos markets
  await salvarPosicoes(mmaPosicoes);

  console.log("\nFeito!");
})();
