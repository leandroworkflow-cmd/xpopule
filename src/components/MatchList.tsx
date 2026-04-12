import { extractTeamsFromTitle, type MatchTeams } from "@/lib/teamLogos";
import { DBMarket } from "@/types/market";

const SHORTS: Record<string, string> = {
  cruzeiro: "CRU", atletico_mg: "CAM", america_mg: "AME", palmeiras: "PAL",
  corinthians: "COR", sao_paulo: "SAO", santos: "SAN", flamengo: "FLA",
  fluminense: "FLU", vasco: "VAS", botafogo: "BOT", gremio: "GRE",
  internacional: "INT", juventude: "JUV", caxias: "CAX", athletico_pr: "CAP",
  coritiba: "CFC", parana: "PRC", bahia: "BAH", vitoria: "VIT",
  fortaleza: "FOR", ceara: "CEA", sport: "SPT", nautico: "NAU",
  goias: "GOI", atletico_go: "ACG", cuiaba: "CUI", vila_nova: "VNO",
  bragantino: "RBB", mirassol: "MIR", ponte_preta: "PON", guarani: "GUA",
  ituano: "ITU", novorizontino: "NOV", chapecoense: "CHA", avai: "AVA",
  figueirense: "FIG", criciuma: "CRI", sampaio_correa: "SAM", abc: "ABC",
  remo: "REM", paysandu: "PAY", brazil: "BRA", argentina: "ARG",
  france: "FRA", england: "ENG",
};

function toShort(key: string): string {
  return SHORTS[key] || key.slice(0, 3).toUpperCase();
}

function getDayLabel(date: Date): string {
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return days[date.getDay()];
}

interface MatchListProps {
  markets: DBMarket[];
  highlightIndices?: number[];
  onNavigate?: (market: DBMarket) => void;
}

export function MatchList({ markets, highlightIndices = [], onNavigate }: MatchListProps) {
  const matchMarkets = markets
    .map((m) => ({ market: m, teams: extractTeamsFromTitle(m.title) }))
    .filter((x): x is { market: DBMarket; teams: MatchTeams } => x.teams !== null);

  if (matchMarkets.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
      {matchMarkets.map(({ market, teams }, idx) => {
        const endDate = new Date(market.end_date);
        const dateStr = endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const dayLabel = getDayLabel(endDate);
        const timeStr = endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const showHighlight = highlightIndices.includes(idx);
        const shortA = toShort(teams.teamA.key);
        const shortB = toShort(teams.teamB.key);

        return (
          <div
            key={market.id}
            onClick={() => onNavigate?.(market)}
            className={`cursor-pointer hover:bg-muted/40 transition-colors ${idx > 0 ? "border-t border-border/40" : ""}`}
          >
            {/* Stadium + Date row */}
            <div className="flex items-center justify-center gap-3 pt-4 pb-2 px-4">
              <span className="text-[13px] text-muted-foreground font-medium">
                {dateStr} • {dayLabel} • {timeStr}
              </span>
            </div>

            {/* Teams confrontation — exact sport app style */}
            <div className="flex items-center justify-center px-4 pb-4 gap-0">
              {/* Team A: short + logo side by side */}
              <div className="flex items-center gap-3 justify-end min-w-[120px]">
                <span className="text-base font-extrabold text-foreground tracking-wider">
                  {shortA}
                </span>
                <img
                  src={teams.teamA.logo}
                  alt={teams.teamA.name}
                  className="h-11 w-11 object-contain flex-shrink-0"
                  loading="lazy"
                />
              </div>

              {/* X separator */}
              <span className="text-sm font-bold text-muted-foreground mx-5 select-none">
                x
              </span>

              {/* Team B: logo + short side by side */}
              <div className="flex items-center gap-3 justify-start min-w-[120px]">
                <img
                  src={teams.teamB.logo}
                  alt={teams.teamB.name}
                  className="h-11 w-11 object-contain flex-shrink-0"
                  loading="lazy"
                />
                <span className="text-base font-extrabold text-foreground tracking-wider">
                  {shortB}
                </span>
              </div>
            </div>

            {/* Highlight badge */}
            {showHighlight && (
              <div className="pb-3 text-center">
                <span className="text-[11px] font-bold tracking-widest text-emerald-500 uppercase">
                  Fique por dentro
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
