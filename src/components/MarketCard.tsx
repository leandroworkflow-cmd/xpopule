import { useNavigate } from "react-router-dom";
import { DBMarket, categoryLabels, categoryColors, categoryIcons } from "@/types/market";
import { Calendar, TrendingUp } from "lucide-react";
import { extractTeamsFromTitle } from "@/lib/teamLogos";

interface MarketCardProps {
  market: DBMarket;
  onClick: (market: DBMarket) => void;
}

export function MarketCard({ market, onClick }: MarketCardProps) {
  const navigate = useNavigate();
  const catLabel = categoryLabels[market.category] || market.category;
  const catColor = categoryColors[market.category] || "bg-muted text-muted-foreground";
  const CatIcon = categoryIcons[market.category] || TrendingUp;
  const endDate = new Date(market.end_date).toLocaleDateString("pt-BR");

  const total = market.yes_price + market.no_price;
  const yesPct = total > 0 ? Math.round((market.yes_price / total) * 100) : 50;
  const noPct = 100 - yesPct;
  const yesMultiplier = market.yes_price > 0 ? (100 / market.yes_price).toFixed(1) : "—";
  const noMultiplier = market.no_price > 0 ? (100 / market.no_price).toFixed(1) : "—";

  const teams = extractTeamsFromTitle(market.title);

  return (
    <div
      onClick={() => navigate(`/mercado/${market.id}`)}
      className="rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer group flex flex-col"
    >
      {/* Header: category */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${catColor}`}>
          <CatIcon className="h-3 w-3" />
          {catLabel}
        </span>
        {market.volume > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto">{market.volume} contratos</span>
        )}
      </div>

      {/* Teams vs display */}
      {teams ? (
        <div className="flex items-center justify-center gap-3 px-4 py-3">
          <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
            <img
              src={teams.teamA.logo}
              alt={teams.teamA.name}
              className="h-10 w-10 object-contain"
              loading="lazy"
            />
            <span className="text-[11px] font-semibold text-foreground text-center truncate w-full capitalize">
              {teams.teamA.name}
            </span>
          </div>
          <span className="text-xs font-bold text-muted-foreground">VS</span>
          <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
            <img
              src={teams.teamB.logo}
              alt={teams.teamB.name}
              className="h-10 w-10 object-contain"
              loading="lazy"
            />
            <span className="text-[11px] font-semibold text-foreground text-center truncate w-full capitalize">
              {teams.teamB.name}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Title for non-match markets */}
          <h3 className="font-semibold text-sm text-foreground px-4 pb-3 leading-snug line-clamp-2 group-hover:text-primary transition-colors capitalize flex-1">
            {market.title}
          </h3>
          {market.image_url && (
            <div className="h-28 mx-4 rounded-lg overflow-hidden mb-3 bg-background/50">
              <img
                src={market.image_url}
                alt={market.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}
        </>
      )}

      {/* Title below teams (for match markets) */}
      {teams && (
        <h3 className="font-semibold text-xs text-muted-foreground px-4 pb-2 leading-snug line-clamp-1 text-center capitalize">
          {market.title}
        </h3>
      )}

      {/* Options - Kalshi style */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-success/40" style={{ width: `${Math.max(yesPct, 8)}%` }} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Sim</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{yesMultiplier}x</span>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(market); }}
            className="min-w-[52px] h-8 rounded-md text-xs font-bold bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-all"
          >
            {yesPct}%
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-danger/40" style={{ width: `${Math.max(noPct, 8)}%` }} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Não</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{noMultiplier}x</span>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(market); }}
            className="min-w-[52px] h-8 rounded-md text-xs font-bold bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-all"
          >
            {noPct}%
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          R$ {(market.volume * ((market.yes_price + market.no_price) / 2)).toLocaleString("pt-BR")} vol
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {endDate}
        </span>
      </div>
    </div>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card animate-pulse">
      <div className="px-4 pt-4 pb-2">
        <div className="h-5 w-20 rounded-full bg-muted/30" />
      </div>
      <div className="px-4 pb-3">
        <div className="h-4 w-full rounded bg-muted/30 mb-1.5" />
        <div className="h-4 w-2/3 rounded bg-muted/30" />
      </div>
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted/30" />
          <div className="h-8 w-14 rounded-md bg-muted/30" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted/30" />
          <div className="h-8 w-14 rounded-md bg-muted/30" />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40">
        <div className="h-3 w-20 rounded bg-muted/30" />
        <div className="h-3 w-16 rounded bg-muted/30" />
      </div>
    </div>
  );
}
