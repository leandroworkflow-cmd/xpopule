import { extractTeamsFromTitle, type MatchTeams } from "@/lib/teamLogos";
import { DBMarket } from "@/types/market";

/** Short name (3-letter abbreviation) from team name */
function toShort(name: string): string {
  // Common abbreviations
  const SHORTS: Record<string, string> = {
    cruzeiro: "CRU",
    atletico_mg: "CAM",
    america_mg: "AME",
    palmeiras: "PAL",
    corinthians: "COR",
    sao_paulo: "SAO",
    santos: "SAN",
    flamengo: "FLA",
    fluminense: "FLU",
    vasco: "VAS",
    botafogo: "BOT",
    gremio: "GRE",
    internacional: "INT",
    juventude: "JUV",
    caxias: "CAX",
    athletico_pr: "CAP",
    coritiba: "CFC",
    parana: "PRC",
    bahia: "BAH",
    vitoria: "VIT",
    fortaleza: "FOR",
    ceara: "CEA",
    sport: "SPT",
    nautico: "NAU",
    goias: "GOI",
    atletico_go: "ACG",
    cuiaba: "CUI",
    vila_nova: "VNO",
    bragantino: "RBB",
    mirassol: "MIR",
    ponte_preta: "PON",
    guarani: "GUA",
    ituano: "ITU",
    novorizontino: "NOV",
    chapecoense: "CHA",
    avai: "AVA",
    figueirense: "FIG",
    criciuma: "CRI",
    sampaio_correa: "SAM",
    abc: "ABC",
    remo: "REM",
    paysandu: "PAY",
    brazil: "BRA",
    argentina: "ARG",
    france: "FRA",
    england: "ENG",
  };
  return SHORTS[name] || name.slice(0, 3).toUpperCase();
}

function getDayLabel(date: Date): string {
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return days[date.getDay()];
}

interface MatchListProps {
  markets: DBMarket[];
  /** Indices of markets that show "FIQUE POR DENTRO" highlight */
  highlightIndices?: number[];
  onNavigate?: (market: DBMarket) => void;
}

export function MatchList({ markets, highlightIndices = [], onNavigate }: MatchListProps) {
  // Filter only markets that have two teams
  const matchMarkets = markets
    .map((m) => ({ market: m, teams: extractTeamsFromTitle(m.title) }))
    .filter((x): x is { market: DBMarket; teams: MatchTeams } => x.teams !== null);

  if (matchMarkets.length === 0) return null;

  return (
    <div className="bg-background rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
      {matchMarkets.map(({ market, teams }, idx) => {
        const endDate = new Date(market.end_date);
        const dateStr = endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const dayLabel = getDayLabel(endDate);
        const timeStr = endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const showHighlight = highlightIndices.includes(idx);

        return (
          <div
            key={market.id}
            onClick={() => onNavigate?.(market)}
            className="px-4 py-5 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            {/* Stadium + Date */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
              <span className="font-medium text-foreground/80">—</span>
              <span>{dateStr} • {dayLabel} • {timeStr}</span>
              <span className="font-medium text-foreground/80">—</span>
            </div>

            {/* Teams row */}
            <div className="flex items-center justify-center gap-6">
              {/* Team A */}
              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <span className="text-sm font-bold text-foreground tracking-wide">
                  {toShort(teams.teamA.key)}
                </span>
                <img
                  src={teams.teamA.logo}
                  alt={teams.teamA.name}
                  className="h-12 w-12 object-contain"
                  loading="lazy"
                />
              </div>

              {/* Separator */}
              <span className="text-lg font-bold text-muted-foreground">x</span>

              {/* Team B */}
              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <img
                  src={teams.teamB.logo}
                  alt={teams.teamB.name}
                  className="h-12 w-12 object-contain"
                  loading="lazy"
                />
                <span className="text-sm font-bold text-foreground tracking-wide">
                  {toShort(teams.teamB.key)}
                </span>
              </div>
            </div>

            {/* Highlight badge */}
            {showHighlight && (
              <p className="text-center text-xs font-bold text-emerald-500 mt-3 tracking-wide">
                FIQUE POR DENTRO
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
