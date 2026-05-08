import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MarketCardSkeleton } from "@/components/MarketCard";
import { TradingDrawer } from "@/components/TradingDrawer";
import { DBMarket } from "@/types/market";
import { useMarkets, useMarketPosicoes } from "@/hooks/useMarkets";
import { Input } from "@/components/ui/input";
import { Search, Flame, ChevronRight, Landmark, Trophy, TrendingUp, TrendingDown, Clapperboard, CloudSun, BarChart2, Globe } from "lucide-react";
import { extractTeamsFromTitle } from "@/lib/teamLogos";

const CATEGORIES = [
  { key: "esportes", label: "Esportes", icon: Trophy, color: "text-orange-400" },
  { key: "politica", label: "Política", icon: Landmark, color: "text-blue-400" },
  { key: "economia", label: "Economia", icon: TrendingUp, color: "text-emerald-400" },
  { key: "mercado", label: "Mercado Financeiro", icon: BarChart2, color: "text-violet-400" },
  { key: "mundo", label: "Mundo", icon: Globe, color: "text-cyan-400" },
  { key: "entretenimento", label: "Cultura", icon: Clapperboard, color: "text-pink-400" },
  { key: "clima", label: "Clima", icon: CloudSun, color: "text-amber-400" },
];

function filterActive(markets: DBMarket[]): DBMarket[] {
  const now = new Date();
  return markets.filter((m) => {
    const end = new Date((m as any).end_date || (m as any).event_date || "");
    return isNaN(end.getTime()) || end >= now;
  });
}

function FeaturedCard({ market, onClick }: { market: DBMarket; onClick: (m: DBMarket) => void }) {
  const title = (market as any).nome || market.title || "";
  const timeCasa = (market as any).time_casa || null;
  const timeFora = (market as any).time_fora || null;
  const teams = extractTeamsFromTitle(title);
  const labelA = timeCasa || teams?.teamA?.name || "Sim";
  const labelB = timeFora || teams?.teamB?.name || "Não";
  const isEsporte = !!timeCasa || !!teams;
  const yesProb = Math.round((market.yes_price ?? 0.5) * 100);
  const noProb = 100 - yesProb;
  const homeLogo = (market as any).home_logo || teams?.teamA?.logo;
  const awayLogo = (market as any).away_logo || teams?.teamB?.logo;
  const endDate = (market as any).end_date;
  const dateLabel = endDate ? new Date(endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : null;

  return (
    <div onClick={() => onClick(market)} className="cursor-pointer w-full rounded-2xl border border-border bg-card hover:border-primary/30 transition-all mb-2 group overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full">
            <Flame className="h-3 w-3" />Em destaque
          </span>
          {market.category && <span className="text-xs text-muted-foreground capitalize">{market.category}</span>}
        </div>
        {dateLabel && <span className="text-xs text-muted-foreground">{dateLabel}</span>}
      </div>
      <div className="flex items-stretch divide-x divide-border/40">
        <div className="flex-1 px-5 py-4">
          {isEsporte && (homeLogo || awayLogo) ? (
            <div className="flex items-center gap-4 mb-4">
              <div className="flex flex-col items-center gap-1.5">
                {homeLogo ? <img src={homeLogo} alt={labelA} className="h-12 w-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{labelA.slice(0, 3).toUpperCase()}</div>}
                <span className="text-xs font-semibold text-foreground">{labelA}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium px-2">VS</span>
              <div className="flex flex-col items-center gap-1.5">
                {awayLogo ? <img src={awayLogo} alt={labelB} className="h-12 w-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{labelB.slice(0, 3).toUpperCase()}</div>}
                <span className="text-xs font-semibold text-foreground">{labelB}</span>
              </div>
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-foreground mb-4 leading-snug group-hover:text-primary transition-colors">{title}</h3>
          )}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground w-24 truncate capitalize">{labelA}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${yesProb}%` }} /></div>
              <span className="text-sm font-bold text-emerald-400 w-9 text-right">{yesProb}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground w-24 truncate capitalize">{labelB}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-muted-foreground/40 rounded-full" style={{ width: `${noProb}%` }} /></div>
              <span className="text-sm font-medium text-muted-foreground w-9 text-right">{noProb}%</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between px-5 py-4 min-w-[140px]">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Probabilidade</p>
            <p className="text-3xl font-bold text-emerald-400">{yesProb}%</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{labelA}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClick(market); }} className="w-full text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity mt-4">
            Prever →
          </button>
        </div>
      </div>
    </div>
  );
}

function CompactRow({ market, rank, onClick }: { market: DBMarket; rank: number; onClick: (m: DBMarket) => void }) {
  const title = (market as any).nome || market.title || "";
  const yesProb = Math.round((market.yes_price ?? 0.5) * 100);
  const trend = (market as any).price_change ?? 0;
  return (
    <div onClick={() => onClick(market)} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors group">
      <span className="text-xs text-muted-foreground w-5 text-center font-medium shrink-0">{rank}</span>
      <span className="flex-1 text-sm text-foreground truncate group-hover:text-primary transition-colors">{title}</span>
      {trend !== 0 && (
        <span className={`text-xs font-medium flex items-center gap-0.5 shrink-0 ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(trend)}%
        </span>
      )}
      <span className="shrink-0 text-xs font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full min-w-[44px] text-center">{yesProb}%</span>
    </div>
  );
}

function CategoryPills({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-8" style={{ scrollbarWidth: "none" }}>
      <button onClick={() => onChange("todos")} className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full border transition-all ${active === "todos" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>Todos</button>
      {CATEGORIES.map((cat) => (
        <button key={cat.key} onClick={() => onChange(cat.key)} className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border transition-all ${active === cat.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
          <cat.icon className={`h-3 w-3 ${active === cat.key ? "text-primary-foreground" : cat.color}`} />
          {cat.label}
        </button>
      ))}
    </div>
  );
}

function CategorySection({ cat, markets, onSelect }: { cat: typeof CATEGORIES[0]; markets: DBMarket[]; onSelect: (m: DBMarket) => void }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  if (markets.length === 0) return null;
  const [hero, ...rest] = markets;
  const compact = showAll ? rest : rest.slice(0, 5);
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <cat.icon className={`h-4 w-4 ${cat.color}`} />
          <h2 className="text-base font-bold text-foreground">{cat.label}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{markets.length}</span>
        </div>
        <button onClick={() => navigate(`/?cat=${cat.key}`)} className="text-xs text-primary hover:underline flex items-center gap-0.5">Ver todos <ChevronRight className="h-3 w-3" /></button>
      </div>
      <FeaturedCard market={hero} onClick={onSelect} />
      {compact.length > 0 && (
        <div className="mt-1 rounded-xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden">
          {compact.map((m, i) => <CompactRow key={m.id} market={m} rank={i + 2} onClick={onSelect} />)}
          {rest.length > 5 && (
            <button onClick={() => setShowAll((v) => !v)} className="w-full text-xs text-muted-foreground hover:text-foreground py-2.5 text-center transition-colors">
              {showAll ? "Ver menos" : `Ver mais ${rest.length - 5} mercados`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const Index = () => {
  const [selectedMarket, setSelectedMarket] = useState<DBMarket | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const { data: allMarkets, isLoading } = useMarkets(null);
  const { data: posicoes = [] } = useMarketPosicoes(selectedMarket?.id ?? "");

  const activeMarkets = useMemo(() => { if (!allMarkets) return []; return filterActive(allMarkets); }, [allMarkets]);
  const filtered = useMemo(() => {
    let base = activeMarkets;
    if (activeCategory !== "todos") base = base.filter((m) => m.category === activeCategory);
    if (search) base = base.filter((m) => ((m as any).nome || m.title || "").toLowerCase().includes(search.toLowerCase()));
    return base;
  }, [activeMarkets, search, activeCategory]);
  const byCategory = useMemo(() => {
    const result: Record<string, DBMarket[]> = {};
    for (const cat of CATEGORIES) { result[cat.key] = activeMarkets.filter((m) => m.category === cat.key).sort((a, b) => b.volume - a.volume); }
    return result;
  }, [activeMarkets]);
  const trending = useMemo(() => [...activeMarkets].sort((a, b) => b.volume - a.volume).slice(0, 8), [activeMarkets]);
  const isSearching = !!search || activeCategory !== "todos";

  return (
    <div className="max-w-5xl mx-auto">
      {!isSearching && (
        <div className="mb-8 pt-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Mercado de Previsões</h1>
          <p className="text-sm text-muted-foreground">Preveja eventos reais. Ganhe com o conhecimento.</p>
        </div>
      )}
      <div className="relative mb-5 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar eventos, times, eleições..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border h-11 text-sm rounded-xl" />
      </div>
      <CategoryPills active={activeCategory} onChange={setActiveCategory} />
      {isSearching ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">{search ? `Resultados para "${search}"` : CATEGORIES.find((c) => c.key === activeCategory)?.label}</h2>
            <span className="text-xs text-muted-foreground">{filtered.length} mercados</span>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <MarketCardSkeleton key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground"><Globe className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>Nenhum mercado encontrado.</p></div>
          ) : (
            <>
              {filtered[0] && <FeaturedCard market={filtered[0]} onClick={setSelectedMarket} />}
              {filtered.length > 1 && (
                <div className="mt-1 rounded-xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden">
                  {filtered.slice(1).map((m, i) => <CompactRow key={m.id} market={m} rank={i + 2} onClick={setSelectedMarket} />)}
                </div>
              )}
            </>
          )}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <MarketCardSkeleton key={i} />)}</div>
      ) : (
        <>
          {trending.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4 text-orange-400" />
                <h2 className="text-base font-bold text-foreground">Em Alta</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{trending.length}</span>
              </div>
              <FeaturedCard market={trending[0]} onClick={setSelectedMarket} />
              {trending.length > 1 && (
                <div className="mt-1 rounded-xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden">
                  {trending.slice(1).map((m, i) => <CompactRow key={m.id} market={m} rank={i + 2} onClick={setSelectedMarket} />)}
                </div>
              )}
            </div>
          )}
          {CATEGORIES.map((cat) => <CategorySection key={cat.key} cat={cat} markets={byCategory[cat.key] || []} onSelect={setSelectedMarket} />)}
        </>
      )}
      <TradingDrawer market={selectedMarket} open={!!selectedMarket} onClose={() => setSelectedMarket(null)} posicoes={posicoes} />
    </div>
  );
};

export default Index;
