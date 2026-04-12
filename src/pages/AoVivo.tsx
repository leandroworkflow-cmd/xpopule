import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMarkets } from "@/hooks/useMarkets";
import { DBMarket, categoryLabels, categoryColors, categoryIcons } from "@/types/market";
import { TradingDrawer } from "@/components/TradingDrawer";
import { MarketCardSkeleton } from "@/components/MarketCard";
import { MatchList } from "@/components/MatchList";
import { Radio, TrendingUp, Calendar, Clock, Flame } from "lucide-react";

const AoVivo = () => {
  const { data: markets, isLoading } = useMarkets();
  const [selectedMarket, setSelectedMarket] = useState<DBMarket | null>(null);
  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Group markets: live today (end_date is today) and upcoming (future)
  const { liveMarkets, upcomingByCategory } = useMemo(() => {
    if (!markets) return { liveMarkets: [], upcomingByCategory: {} as Record<string, DBMarket[]> };

    const now = new Date();
    const live: DBMarket[] = [];
    const upcoming: Record<string, DBMarket[]> = {};

    for (const m of markets) {
      const endDate = new Date(m.end_date);
      // "Live" = end_date is today or market is still active and end_date hasn't passed
      if (endDate >= today && endDate < tomorrow) {
        live.push(m);
      } else if (endDate >= tomorrow) {
        if (!upcoming[m.category]) upcoming[m.category] = [];
        upcoming[m.category].push(m);
      }
    }

    // Sort live by volume descending
    live.sort((a, b) => b.volume - a.volume);

    return { liveMarkets: live, upcomingByCategory: upcoming };
  }, [markets]);

  const totalLive = liveMarkets.length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">AO VIVO</h1>
        </div>
        <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold px-2.5 py-1 rounded-full">
          {totalLive}
        </span>
      </div>

      {/* Live Events */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card animate-pulse p-5">
              <div className="h-5 w-32 rounded bg-muted/30 mb-3" />
              <div className="h-4 w-64 rounded bg-muted/30 mb-4" />
              <div className="flex gap-3">
                <div className="h-10 w-24 rounded-lg bg-muted/30" />
                <div className="h-10 w-24 rounded-lg bg-muted/30" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Match-style list for sport markets */}
          {liveMarkets.filter(m => m.category === "esportes").length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                ⚽ Partidas do Dia
              </h2>
              <MatchList
                markets={liveMarkets.filter(m => m.category === "esportes")}
                highlightIndices={[2]}
                onNavigate={(m) => navigate(`/mercado/${m.id}`)}
              />
            </div>
          )}

          {liveMarkets.length > 0 ? (
            <div className="space-y-3 mb-10">
              {liveMarkets.filter(m => m.category !== "esportes").map((market) => (
                <LiveEventCard
                  key={market.id}
                  market={market}
                  onTrade={setSelectedMarket}
                  onNavigate={() => navigate(`/mercado/${market.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-card p-10 text-center mb-10">
              <Radio className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">
                Nenhum evento ao vivo no momento.
              </p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Confira os próximos eventos abaixo.
              </p>
            </div>
          )}

          {/* Upcoming events grouped by category */}
          {Object.keys(upcomingByCategory).length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Próximos Eventos
              </h2>
              <div className="space-y-6">
                {Object.entries(upcomingByCategory).map(([cat, catMarkets]) => {
                  const catLabel = categoryLabels[cat] || cat;
                  const catColor = categoryColors[cat] || "bg-muted text-muted-foreground";
                  const CatIcon = categoryIcons[cat] || TrendingUp;
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${catColor}`}>
                          <CatIcon className="h-3.5 w-3.5" />
                          {catLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">{catMarkets.length} mercados</span>
                      </div>
                      <div className="space-y-2">
                        {catMarkets.slice(0, 5).map((market) => (
                          <UpcomingEventCard
                            key={market.id}
                            market={market}
                            onNavigate={() => navigate(`/mercado/${market.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <TradingDrawer
        market={selectedMarket}
        open={!!selectedMarket}
        onClose={() => setSelectedMarket(null)}
      />
    </div>
  );
};

function LiveEventCard({
  market,
  onTrade,
  onNavigate,
}: {
  market: DBMarket;
  onTrade: (m: DBMarket) => void;
  onNavigate: () => void;
}) {
  const catLabel = categoryLabels[market.category] || market.category;
  const catColor = categoryColors[market.category] || "bg-muted text-muted-foreground";
  const CatIcon = categoryIcons[market.category] || TrendingUp;
  const total = market.yes_price + market.no_price;
  const yesPct = total > 0 ? Math.round((market.yes_price / total) * 100) : 50;
  const noPct = 100 - yesPct;

  return (
    <div
      onClick={onNavigate}
      className="rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer group p-4"
    >
      {/* Top row: category + LIVE badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${catColor}`}>
            <CatIcon className="h-3 w-3" />
            {catLabel.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          LIVE
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground mb-3 group-hover:text-primary transition-colors capitalize">
        {market.title}
      </h3>

      {/* Options row */}
      <div className="flex items-center gap-3 mb-3">
        {/* YES */}
        <button
          onClick={(e) => { e.stopPropagation(); onTrade(market); }}
          className="flex-1 flex items-center justify-between h-11 rounded-lg px-4 text-sm font-bold bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-all"
        >
          <span>Sim</span>
          <span>{yesPct}%</span>
        </button>
        {/* NO */}
        <button
          onClick={(e) => { e.stopPropagation(); onTrade(market); }}
          className="flex-1 flex items-center justify-between h-11 rounded-lg px-4 text-sm font-bold bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-all"
        >
          <span>Não</span>
          <span>{noPct}%</span>
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          R$ {(market.volume * ((market.yes_price + market.no_price) / 2)).toLocaleString("pt-BR")} vol
        </span>
        <span className="flex items-center gap-1">
          <Flame className="h-3 w-3" />
          {market.volume} contratos
        </span>
      </div>
    </div>
  );
}

function UpcomingEventCard({
  market,
  onNavigate,
}: {
  market: DBMarket;
  onNavigate: () => void;
}) {
  const endDate = new Date(market.end_date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const total = market.yes_price + market.no_price;
  const yesPct = total > 0 ? Math.round((market.yes_price / total) * 100) : 50;

  return (
    <div
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/50 hover:border-primary/30 transition-all cursor-pointer p-3 group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate capitalize">
          {market.title}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
          <Clock className="h-3 w-3" />
          {endDate}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-bold text-success">{yesPct}%</span>
        <span className="text-[10px] text-muted-foreground ml-1">Sim</span>
      </div>
    </div>
  );
}

export default AoVivo;
