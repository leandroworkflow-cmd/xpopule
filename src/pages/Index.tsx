import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MarketCardSkeleton } from "@/components/MarketCard";
import { TradingDrawer } from "@/components/TradingDrawer";
import { DBMarket } from "@/types/market";
import { useMarkets, useMarketPosicoes } from "@/hooks/useMarkets";
import { Input } from "@/components/ui/input";
import { Search, Flame, ChevronRight, ChevronLeft, Landmark, Trophy, TrendingUp, TrendingDown, Clapperboard, CloudSun, BarChart2, Globe } from "lucide-react";
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

function getMarketInfo(market: DBMarket) {
  const title = (market as any).nome || market.title || "";
  const timeCasa = (market as any).time_casa || null;
  const timeFora = (market as any).time_fora || null;
  const teams = extractTeamsFromTitle(title);
  const labelA = timeCasa || teams?.teamA?.name || "Sim";
  const labelB = timeFora || teams?.teamB?.name || "Não";
  const homeLogo = (market as any).home_logo || teams?.teamA?.logo;
  const awayLogo = (market as any).away_logo || teams?.teamB?.logo;
  const yesProb = Math.round((market.yes_price ?? 0.5) * 100);
  const noProb = 100 - yesProb;
  const endDate = (market as any).end_date;
  const dateLabel = endDate ? new Date(endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : null;
  return { title, labelA, labelB, homeLogo, awayLogo, yesProb, noProb, dateLabel };
}

function FeaturedSection({ markets, onSelect, sectionLabel, sectionIcon: Icon, sectionColor, categoryKey }: { markets: DBMarket[]; onSelect: (m: DBMarket) => void; sectionLabel: string; sectionIcon: React.ElementType; sectionColor: string; categoryKey: string; }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  if (markets.length === 0) return null;
  const featured = markets[idx];
  const { title, labelA, labelB, homeLogo, awayLogo, yesProb, noProb, dateLabel } = getMarketInfo(featured);
  const compact = markets.filter((_, i) => i !== idx).slice(0, 6);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${sectionColor}`} />
          <h2 className="text-base font-bold text-foreground">{sectionLabel}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{markets.length}</span>
        </div>
        <button onClick={() => navigate(`/?cat=${categoryKey}`)} className="text-xs text-primary hover:underline flex items-center gap-0.5">Ver todos <ChevronRight className="h-3 w-3" /></button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full"><Flame className="h-3 w-3" />Em destaque</span>
            {featured.category && <span className="text-xs text-muted-foreground capitalize">{featured.category}</span>}
          </div>
          <div className="flex items-center gap-2">
            {dateLabel && <span className="text-xs text-muted-foreground mr-1">{dateLabel}</span>}
            <button onClick={() => setIdx((i) => (i - 1 + markets.length) % markets.length)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <span className="text-xs text-muted-foreground min-w-[40px] text-center">{idx + 1} de {markets.length}</span>
            <button onClick={() => setIdx((i) => (i + 1) % markets.length)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="flex items-stretch divide-x divide-border/40 cursor-pointer hover:bg-accent/20 transition-colors" onClick={() => onSelect(featured)}>
          <div className="flex-1 px-5 py-5">
            <div className="flex items-center gap-6 mb-5">
              <div className="flex flex-col items-center gap-2 flex-1">
                {homeLogo ? <img src={homeLogo} alt={labelA} className="h-14 w-14 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{labelA.slice(0, 3).toUpperCase()}</div>}
                <span className="text-xs font-semibold text-foreground text-center">{labelA}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">VS</span>
              <div className="flex flex-col items-center gap-2 flex-1">
                {awayLogo ? <img src={awayLogo} alt={labelB} className="h-14 w-14 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{labelB.slice(0, 3).toUpperCase()}</div>}
                <span className="text-xs font-semibold text-foreground text-center">{labelB}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); onSelect(featured); }} className="flex-1 flex items-center justify-between bg-muted/60 hover:bg-emerald-500/10 border border-border hover:border-emerald-500/40 rounded-xl px-4 py-2.5 transition-colors">
                <span className="text-sm font-medium text-foreground capitalize truncate mr-2">{labelA}</span>
                <span className="text-sm font-bold text-emerald-400 shrink-0">{yesProb}%</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); onSelect(featured); }} className="flex-1 flex items-center justify-between bg-muted/60 hover:bg-muted border border-border rounded-xl px-4 py-2.5 transition-colors">
                <span className="text-sm font-medium text-foreground capitalize truncate mr-2">{labelB}</span>
                <span className="text-sm font-bold text-muted-foreground shrink-0">{noProb}%</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center px-6 py-5 min-w-[130px] gap-1">
            <p className="text-xs text-muted-foreground">Probabilidade</p>
            <p className="text-4xl font-bold text-emerald-400">{yesProb}%</p>
            <p className="text-xs text-muted-foreground capitalize text-center">{labelA}</p>
            <button onClick={(e) => { e.stopPropagation(); onSelect(featured); }} className="mt-3 text-xs font-semibold bg-primary text-primary-foreground px-5 py-2 rounded-xl hover:opacity-90 transition-opacity w-full">Prever →</button>
          </div>
        </div>

        {compact.length > 0 && (
          <div className="border-t border-border/40 divide-y divide-border/40">
            {compact.map((m, i) => {
              const info = getMarketInfo(m);
              const trend = (m as any).price_change ?? 0;
              return (
                <div key={m.id} onClick={() => onSelect(m)} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 cursor-pointer transition-colors group">
                  <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{i + 2}</span>
                  <div className="flex items-center shrink-0">
                    {info.homeLogo && <img src={info.homeLogo} alt={info.labelA} className="h-5 w-5 object-contain rounded-full bg-muted" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    {info.awayLogo && <img src={info.awayLogo} alt={info.labelB} className="h-5 w-5 object-contain rounded-full bg-muted -ml-1.5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                  </div>
                  <span className="flex-1 text-sm text-foreground truncate group-hover:text-primary transition-colors">{info.title}</span>
                  {trend !== 0 && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 shrink-0 ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(trend)}%
                    </span>
                  )}
                  <span className="shrink-0 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full min-w-[44px] text-center">{info.yesProb}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryPills({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-8" style={{ scrollbarWidth: "none" }}>
      <button onClick={() => onChange("todos")} className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full border transition-all ${active === "todos" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>Todos</button>
      {CATEGORIES.map((cat) => (
        <button key={cat.key} onClick={() => onChange(cat.key)} className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border transition-all ${active === cat.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
          <cat.icon className={`h-3 w-3 ${active === cat.key ? "text-primary-foreground" : cat.color}`} />{cat.label}
        </button>
      ))}
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
  const trending = useMemo(() => [...activeMarkets].sort((a, b) => b.volume - a.volume).slice(0, 10), [activeMarkets]);
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
            <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <MarketCardSkeleton key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground"><Globe className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>Nenhum mercado encontrado.</p></div>
          ) : (
            <FeaturedSection markets={filtered} onSelect={setSelectedMarket} sectionLabel={CATEGORIES.find((c) => c.key === activeCategory)?.label ?? "Resultados"} sectionIcon={CATEGORIES.find((c) => c.key === activeCategory)?.icon ?? Globe} sectionColor={CATEGORIES.find((c) => c.key === activeCategory)?.color ?? "text-primary"} categoryKey={activeCategory} />
          )}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <MarketCardSkeleton key={i} />)}</div>
      ) : (
        <>
          {trending.length > 0 && <FeaturedSection markets={trending} onSelect={setSelectedMarket} sectionLabel="Em Alta" sectionIcon={Flame} sectionColor="text-orange-400" categoryKey="todos" />}
          {CATEGORIES.map((cat) => byCategory[cat.key]?.length > 0 ? (
            <FeaturedSection key={cat.key} markets={byCategory[cat.key]} onSelect={setSelectedMarket} sectionLabel={cat.label} sectionIcon={cat.icon} sectionColor={cat.color} categoryKey={cat.key} />
          ) : null)}
        </>
      )}
      <TradingDrawer market={selectedMarket} open={!!selectedMarket} onClose={() => setSelectedMarket(null)} posicoes={posicoes} />
    </div>
  );
};

export default Index;
