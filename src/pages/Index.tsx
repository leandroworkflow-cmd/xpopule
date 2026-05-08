import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MarketCard, MarketCardSkeleton } from "@/components/MarketCard";
import { TradingDrawer } from "@/components/TradingDrawer";
import { DBMarket } from "@/types/market";
import { useMarkets, useMarketPosicoes } from "@/hooks/useMarkets";
import { Input } from "@/components/ui/input";
import { Search, Flame, ChevronRight, ChevronLeft, Landmark, Trophy, TrendingUp, Clapperboard, CloudSun } from "lucide-react";
import { extractTeamsFromTitle } from "@/lib/teamLogos";

const CATEGORIES = [
  { key: "esportes", label: "Esportes", icon: Trophy },
  { key: "economia", label: "Economia", icon: TrendingUp },
  { key: "politica", label: "Política", icon: Landmark },
  { key: "entretenimento", label: "Cultura", icon: Clapperboard },
  { key: "clima", label: "Clima", icon: CloudSun },
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
  const volHome = (market as any).volume_home || 0;
  const volDraw = (market as any).volume_draw || 0;
  const volAway = (market as any).volume_away || 0;
  const totalVol = volHome + volDraw + volAway;
  const volumeLabel = totalVol > 0 ? `R$ ${(totalVol * 100).toLocaleString("pt-BR")} vol` : market.volume ? `$${(market.volume / 1_000_000).toFixed(1)}M vol` : null;
  const homeLogo = (market as any).home_logo || teams?.teamA?.logo;
  const awayLogo = (market as any).away_logo || teams?.teamB?.logo;

  return (
    <div onClick={() => onClick(market)} className="cursor-pointer rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors mb-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-orange-500">
          <Flame className="h-3.5 w-3.5" />Em destaque
        </span>
        {market.category && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">{market.category}</span>}
      </div>
      {isEsporte && (homeLogo || awayLogo) ? (
        <div className="flex items-center gap-4 mb-4">
          <div className="flex flex-col items-center gap-1 flex-1">
            {homeLogo ? <img src={homeLogo} alt={labelA} className="h-12 w-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{labelA.slice(0, 3).toUpperCase()}</div>}
            <span className="text-xs font-semibold text-foreground text-center capitalize">{labelA}</span>
          </div>
          <span className="text-sm font-bold text-muted-foreground">VS</span>
          <div className="flex flex-col items-center gap-1 flex-1">
            {awayLogo ? <img src={awayLogo} alt={labelB} className="h-12 w-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{labelB.slice(0, 3).toUpperCase()}</div>}
            <span className="text-xs font-semibold text-foreground text-center capitalize">{labelB}</span>
          </div>
        </div>
      ) : (
        <h3 className="text-lg font-semibold text-foreground mb-4 leading-snug">{title}</h3>
      )}
      <div className="flex flex-col gap-2.5 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground w-24 truncate capitalize">{labelA}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${yesProb}%` }} /></div>
          <span className="text-sm font-semibold text-foreground w-10 text-right">{yesProb}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground w-24 truncate capitalize">{labelB}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-muted-foreground/40 rounded-full transition-all" style={{ width: `${noProb}%` }} /></div>
          <span className="text-sm font-medium text-muted-foreground w-10 text-right">{noProb}%</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        {volumeLabel && <span className="text-xs text-muted-foreground">{volumeLabel}</span>}
        <button onClick={(e) => { e.stopPropagation(); onClick(market); }} className="ml-auto text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity">Negociar</button>
      </div>
    </div>
  );
}

function CarouselSection({ title, icon: Icon, markets, onSelect, categoryKey, featured = false }: { title: string; icon: React.ElementType; markets: DBMarket[]; onSelect: (m: DBMarket) => void; categoryKey: string; featured?: boolean; }) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  if (markets.length === 0) return null;
  const scroll = (dir: "left" | "right") => { if (!scrollRef.current) return; scrollRef.current.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" }); };
  const heroMarket = featured ? markets[0] : null;
  const carouselMarkets = featured ? markets.slice(1) : markets;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{markets.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {carouselMarkets.length > 0 && (<><button onClick={() => scroll("left")} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button><button onClick={() => scroll("right")} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button></>)}
          <button onClick={() => navigate(`/?cat=${categoryKey}`)} className="text-xs text-primary hover:underline flex items-center gap-1 ml-1">Ver todos <ChevronRight className="h-3 w-3" /></button>
        </div>
      </div>
      {heroMarket && <FeaturedCard market={heroMarket} onClick={onSelect} />}
      {carouselMarkets.length > 0 && (
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {carouselMarkets.map((market) => (<div key={market.id} className="flex-shrink-0 w-72"><MarketCard market={market} onClick={onSelect} /></div>))}
        </div>
      )}
    </div>
  );
}

function TrendingSection({ markets, onSelect }: { markets: DBMarket[]; onSelect: (m: DBMarket) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (markets.length === 0) return null;
  const scroll = (dir: "left" | "right") => { if (!scrollRef.current) return; scrollRef.current.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" }); };
  const [hero, ...rest] = markets;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <h2 className="text-base font-bold text-foreground">Em Alta</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{markets.length}</span>
        </div>
        {rest.length > 0 && (<div className="flex items-center gap-2"><button onClick={() => scroll("left")} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button><button onClick={() => scroll("right")} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button></div>)}
      </div>
      <FeaturedCard market={hero} onClick={onSelect} />
      {rest.length > 0 && (<div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>{rest.map((market) => (<div key={market.id} className="flex-shrink-0 w-72"><MarketCard market={market} onClick={onSelect} /></div>))}</div>)}
    </div>
  );
}

const Index = () => {
  const [selectedMarket, setSelectedMarket] = useState<DBMarket | null>(null);
  const [search, setSearch] = useState("");
  const { data: allMarkets, isLoading } = useMarkets(null);
  const { data: posicoes = [] } = useMarketPosicoes(selectedMarket?.id ?? "");
  const activeMarkets = useMemo(() => { if (!allMarkets) return []; return filterActive(allMarkets); }, [allMarkets]);
  const filtered = useMemo(() => { if (!search) return activeMarkets; return activeMarkets.filter((m) => ((m as any).nome || m.title || "").toLowerCase().includes(search.toLowerCase())); }, [activeMarkets, search]);
  const byCategory = useMemo(() => { const result: Record<string, DBMarket[]> = {}; for (const cat of CATEGORIES) { result[cat.key] = activeMarkets.filter((m) => m.category === cat.key).sort((a, b) => b.volume - a.volume); } return result; }, [activeMarkets]);
  const trending = useMemo(() => [...activeMarkets].sort((a, b) => b.volume - a.volume).slice(0, 10), [activeMarkets]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="relative mb-6 max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Negocie qualquer evento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border h-10 text-sm" />
      </div>
      {search ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Resultados para "{search}"</h2>
            <span className="text-xs text-muted-foreground">{filtered.length} mercados</span>
          </div>
          {isLoading ? (<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <MarketCardSkeleton key={i} />)}</div>) : filtered.length === 0 ? (<div className="text-center py-16 text-muted-foreground">Nenhum mercado encontrado.</div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((m) => <MarketCard key={m.id} market={m} onClick={setSelectedMarket} />)}</div>)}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <MarketCardSkeleton key={i} />)}</div>
      ) : (
        <>
          <TrendingSection markets={trending} onSelect={setSelectedMarket} />
          {CATEGORIES.map((cat) => (<CarouselSection key={cat.key} title={cat.label} icon={cat.icon} markets={byCategory[cat.key] || []} onSelect={setSelectedMarket} categoryKey={cat.key} featured />))}
        </>
      )}
      <TradingDrawer market={selectedMarket} open={!!selectedMarket} onClose={() => setSelectedMarket(null)} posicoes={posicoes} />
    </div>
  );
};

export default Index;
