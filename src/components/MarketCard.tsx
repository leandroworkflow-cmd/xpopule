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

  const total = (market.yes_price || 50) + (market.no_price || 50);
  const yesPct = total > 0 ? Math.round(((market.yes_price || 50) / total) * 100) : 50;
  const noPct = 100 - yesPct;

  const title = (market as any).nome || market.title || "";
  const teams = extractTeamsFromTitle(title);
  const homeLogo = (market as any).home_logo || teams?.teamA?.logo;
  const awayLogo = (market as any).away_logo || teams?.teamB?.logo;
  const hasTeams = teams !== null || homeLogo;

  // Volumes por resultado
  const volHome = (market as any).volume_home || 0;
  const volDraw = (market as any).volume_draw || 0;
  const volAway = (market as any).volume_away || 0;

  const fmtVol = (v: number) => v === 0 ? "0 contr." : v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`;

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
        {(volHome + volDraw + volAway) > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {fmtVol(volHome + volDraw + volAway)} total
          </span>
        )}
      </div>

      {/* Teams vs display */}
      {hasTeams ? (
        <>
          <h3 className="font-semibold text-xs text-foreground px-4 pb-2 leading-snug line-clamp-2 text-center capitalize">
            {title}
          </h3>
          <div className="flex items-center justify-center gap-3 px-4 py-3">
            <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
              {homeLogo ? (
                <img src={homeLogo} alt={teams?.teamA?.name} className="h-12 w-12 object-contain" loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {teams?.teamA?.name?.slice(0, 3).toUpperCase()}
                </div>
              )}
              <span className="text-[11px] font-semibold text-foreground text-center truncate w-full capitalize">
                {teams?.teamA?.name}
              </span>
            </div>
            <span className="text-sm font-bold text-muted-foreground">VS</span>
            <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
              {awayLogo ? (
                <img src={awayLogo} alt={teams?.teamB?.name} className="h-12 w-12 object-contain" loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {teams?.teamB?.name?.slice(0, 3).toUpperCase()}
                </div>
              )}
              <span className="text-[11px] font-semibold text-foreground text-center truncate w-full capitalize">
                {teams?.teamB?.name}
              </span>
            </div>
          </div>

          {/* Botões de volume estilo peer-to-peer */}
          <div className="px-3 pb-3 mt-auto">
            <div className="flex gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); onClick(market); }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg bg-success/10 border border-success/30 hover:bg-success/20 transition-all"
              >
                <span className="text-[9px] text-muted-foreground truncate w-full text-center capitalize leading-tight">
                  {teams?.teamA?.name?.split(" ")[0] || "Time A"}
                </span>
                <span className="text-[11px] font-bold text-success">{fmtVol(volHome)}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onClick(market); }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted/50 transition-all"
              >
                <span className="text-[9px] text-muted-foreground text-center leading-tight">Empate</span>
                <span className="text-[11px] font-bold text-foreground">{fmtVol(volDraw)}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onClick(market); }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg bg-danger/10 border border-danger/30 hover:bg-danger/20 transition-all"
              >
                <span className="text-[9px] text-muted-foreground truncate w-full text-center capitalize leading-tight">
                  {teams?.teamB?.name?.split(" ")[0] || "Time B"}
                </span>
                <span className="text-[11px] font-bold text-danger">{fmtVol(volAway)}</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <h3 className="font-semibold text-sm text-foreground px-4 pb-2 leading-snug line-clamp-3 group-hover:text-primary transition-colors capitalize flex-1">
            {title}
          </h3>
          {market.image_url && (
            <div className="h-16 mx-4 rounded-lg overflow-hidden mb-3 bg-background/50">
              <img src={market.image_url} alt={title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
          <div className="px-4 pb-3 space-y-2 mt-auto">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <div className="h-1.5 rounded-full bg-success/40" style={{ width: `${Math.max(yesPct, 8)}%` }} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Sim</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onClick(market); }}
                className="min-w-[52px] h-8 rounded-md text-xs font-bold bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-all">
                {yesPct}%
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <div className="h-1.5 rounded-full bg-danger/40" style={{ width: `${Math.max(noPct, 8)}%` }} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Não</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onClick(market); }}
                className="min-w-[52px] h-8 rounded-md text-xs font-bold bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-all">
                {noPct}%
              </button>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          R$ {((volHome + volDraw + volAway) * 100).toLocaleString("pt-BR")} vol
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
      <div className="px-4 pt-4 pb-2"><div className="h-5 w-20 rounded-full bg-muted/30" /></div>
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
