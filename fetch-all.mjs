import fetch from "node-fetch";

const FOOTBALL_KEY = "ab7e687d7ff24053837db64af9b56453";
const SUPABASE_URL = "https://odexmyskaespjusivjua.supabase.co";
const SUPABASE_KEY = "sb_publishable_s9oIKQj9UXCPucjw1cmzlw_N3HqxH-Y";
const SPORTSDB_KEY = "123";
const DAYS_AHEAD   = 14;

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

// ── OUTROS ESPORTES CONFIG ────────────────────────────────────────────────────

const OUTROS_ESPORTES = [
  { name: "Basketball", label: "Basquete",     category: "basquete" },
  { name: "Fighting",   label: "Boxe/MMA/UFC", category: "luta"     },
  { name: "Tennis",     label: "Tenis",        category: "tenis"    },
  { name: "Volleyball", label: "Volei",        category: "volei"    },
];

// ── UTILS ─────────────────────────────────────────────────────────────────────

function traduzir(nome) { return TIMES_PT[nome] || nome; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function nextDates(n) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

// ── FUTEBOL ───────────────────────────────────────────────────────────────────

async function fetchJogos(comp) {
  console.log("  Buscando " + comp.nome + "...");
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/" + comp.code + "/matches?status=SCHEDULED",
    { headers: { "X-Auth-Token": FOOTBALL_KEY } }
  );
  if (!res.ok) { console.warn("  Erro " + res.status + " para " + comp.nome); return []; }
  const data = await res.json();
  const jogos = (data.matches || []).filter(j => new Date(j.utcDate) > hoje);
  console.log("  " + jogos.length + " jogos futuros.");
  return jogos.map(j => {
    const home     = traduzir(j.homeTeam.name);
    const away     = traduzir(j.awayTeam.name);
    const dataJogo = new Date(j.utcDate);
    const endDate  = new Date(dataJogo.getTime() - 60 * 60 * 1000);
    return {
      id:         "jogo_fd_" + j.id,
      nome:       home + " x " + away,
      end_date:   endDate.toISOString().split("T")[0],
      event_date: dataJogo.toISOString(),
      home_logo:  j.homeTeam.crest || null,
      away_logo:  j.awayTeam.crest || null,
      status:     "active",
      category:   "esportes",
      volume:     0,
      yes_prob:   50,
    };
  });
}

// ── OUTROS ESPORTES ───────────────────────────────────────────────────────────

async function fetchEsporte(sport) {
  process.stdout.write("  Buscando " + sport.label + "... ");
  const base   = "https://www.thesportsdb.com/api/v1/json/" + SPORTSDB_KEY;
  const dates  = nextDates(DAYS_AHEAD);
  const vistos = new Set();
  const eventos = [];

  for (const date of dates) {
    try {
      const res = await fetch(
        base + "/eventsday.php?d=" + date + "&s=" + encodeURIComponent(sport.name)
      );
      if (!res.ok) { await sleep(2200); continue; }
      const data = await res.json();

      for (const ev of (data?.events || [])) {
        if (vistos.has(ev.idEvent)) continue;

        // Pega só eventos não iniciados (NS) ou sem placar ainda
        const naoiniciado = ev.strStatus === "NS" || ev.strStatus === "" || ev.strStatus === null;
        const semPlacar   = ev.intHomeScore === null && ev.intAwayScore === null;
        if (naoiniciado === false && semPlacar === false) continue;

        vistos.add(ev.idEvent);

        const iso = ev.strTime
          ? ev.dateEvent + "T" + ev.strTime + ":00Z"
          : ev.dateEvent + "T00:00:00Z";
        const endDate = new Date(new Date(iso).getTime() - 60 * 60 * 1000);

        eventos.push({
          id:         "sdb_" + ev.idEvent,
          nome:       ev.strEvent,
          end_date:   endDate.toISOString().split("T")[0],
          event_date: iso,
          home_logo:  ev.strHomeTeamBadge || ev.strThumb || null,
          away_logo:  ev.strAwayTeamBadge || null,
          status:     "active",
          category:   sport.category,
          volume:     0,
          yes_prob:   50,
        });
      }
    } catch (_) {}
    await sleep(2200);
  }

  console.log(eventos.length + " eventos.");
  return eventos;
}

// ── SALVAR NO SUPABASE ────────────────────────────────────────────────────────

async function salvar(markets) {
  if (!markets.length) { console.log("Nenhum mercado."); return; }
  console.log("Salvando " + markets.length + " markets...");

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

  console.log("Salvo!");
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log("=== Importador Unificado de Esportes ===");
  const todos = [];

  console.log("\n[Futebol — football-data.org]");
  for (const comp of COMPETICOES) {
    const jogos = await fetchJogos(comp);
    todos.push(...jogos);
    await sleep(1000);
  }

  console.log("\n[Outros Esportes — TheSportsDB]");
  for (const sport of OUTROS_ESPORTES) {
    const eventos = await fetchEsporte(sport);
    todos.push(...eventos);
  }

  const unicos = Object.values(Object.fromEntries(todos.map(j => [j.id, j])));
  console.log("\nTotal: " + unicos.length + " eventos.");
  await salvar(unicos);
  console.log("Feito!");
})();
