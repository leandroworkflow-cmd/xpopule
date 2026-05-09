import { useState, useMemo, useEffect } from "react";
import { MarketCardSkeleton } from "@/components/MarketCard";
import { TradingDrawer } from "@/components/TradingDrawer";
import { DBMarket } from "@/types/market";
import { useMarkets, useMarketPosicoes } from "@/hooks/useMarkets";
import { Input } from "@/components/ui/input";
import {
  Search, ChevronRight, ChevronLeft,
  Landmark, Trophy, TrendingUp, TrendingDown,
  Clapperboard, CloudSun, BarChart2, Globe,
} from "lucide-react";
import { extractTeamsFromTitle } from "@/lib/teamLogos";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

// ─── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "esportes",       label: "Esportiva",          icon: Trophy,       color: "text-orange-400" },
  { key: "politica",       label: "Política",            icon: Landmark,     color: "text-blue-400" },
  { key: "economia",       label: "Econômicas",          icon: TrendingUp,   color: "text-emerald-400" },
  { key: "mercado",        label: "Financeiros",         icon: BarChart2,    color: "text-violet-400" },
  { key: "mundo",          label: "Mundo",               icon: Globe,        color: "text-cyan-400" },
  { key: "entretenimento", label: "Cultura",             icon: Clapperboard, color: "text-pink-400" },
  { key: "clima",          label: "Clima",               icon: CloudSun,     color: "text-amber-400" },
];

const CAT_BAR = [
  "Tendência","Eleições","Política","Esportiva","Cultura",
  "Criptomoeda","Commodities","Clima","Econômicas","Menções",
  "Empresas","Financeiros","Tecnologia e Ciência",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function filterActive(markets: DBMarket[]): DBMarket[] {
  const now = new Date();
  return markets.filter((m) => {
    const end = new Date((m as any).end_date || (m as any).event_date || "");
    return isNaN(end.getTime()) || end >= now;
  });
}

function getMarketInfo(market: DBMarket) {
  const title    = (market as any).nome || market.title || "";
  const category = (market as any).category || "";
  const isSport  = category === "esportes";
  const teams    = isSport ? extractTeamsFromTitle(title) : null;
  const labelA   = (market as any).time_casa || (isSport ? teams?.teamA?.name : null) || "Sim";
  const labelB   = (market as any).time_fora || (isSport ? teams?.teamB?.name : null) || "Não";
  const homeLogo = isSport ? ((market as any).home_logo || teams?.teamA?.logo) : null;
  const awayLogo = isSport ? ((market as any).away_logo || teams?.teamB?.logo) : null;
  const yesProb  = Math.round((market.yes_price ?? 0.5) * 100);
  const noProb   = 100 - yesProb;
  const endDate  = (market as any).end_date;
  const dateLabel = endDate
    ? new Date(endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;
  return { title, labelA, labelB, homeLogo, awayLogo, yesProb, noProb, dateLabel, isSport };
}

function fmtVol(v: number | null | undefined) {
  const n = Number(v) || 0;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0)          return `$${n.toLocaleString("pt-BR")}`;
  return "—";
}

// ─── Price History hook ────────────────────────────────────────────────────────

type PricePoint = { minute: number; prob_home: number; prob_away: number };

function usePriceHistory(marketId: string | null) {
  const [data, setData]       = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!marketId) { setData([]); return; }
    setLoading(true);
    supabase
      .from("price_history")
      .select("minute, prob_home, prob_away")
      .eq("market_id", marketId)
      .order("minute", { ascending: true })
      .then(({ data: rows }) => {
        setData((rows as PricePoint[]) || []);
        setLoading(false);
      });
  }, [marketId]);

  return { data, loading };
}

// ─── PriceChart ────────────────────────────────────────────────────────────────

function PriceChart({ marketId, labelA, labelB }: { marketId: string; labelA: string; labelB: string }) {
  const { data, loading } = usePriceHistory(marketId);

  const chartData = useMemo(() => {
    if (data.length > 0)
      return data.map((d) => ({
        name: `${d.minute}min`,
        home: Number(d.prob_home),
        away: Number(d.prob_away),
      }));
    // fallback mockado enquanto não há dados
    return [0, 15, 30, 45, 60, 75, 90].map((m, i) => {
      const base = [50, 52, 54, 50, 55, 57, 59];
      return { name: `${m}min`, home: base[i], away: 100 - base[i] };
    });
  }, [data]);

  if (loading)
    return (
      <div className="h-[110px] flex items-center justify-center text-xs text-muted-foreground">
        Carregando gráfico...
      </div>
    );

  return (
    <div className="px-4 pt-3 pb-3">
      {/* Legenda */}
      <div className="flex items-center gap-4 justify-end mb-1">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-4 h-0.5 bg-emerald-400 rounded" />
          {labelA}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-4 border-t-2 border-dashed border-red-400" />
          {labelB}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={chartData} margin={{ top: 2, right: 6, left: -28, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: "#666" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: "#666" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              fontSize: 11,
              color: "#e0e0e0",
            }}
            labelStyle={{ color: "#888", marginBottom: 2 }}
            formatter={(value: number, name: string) => [
              `${Number(value).toFixed(1)}%`,
              name === "home" ? labelA : labelB,
            ]}
          />
          <Line type="monotone" dataKey="home" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="away" stroke="#f87171" strokeWidth={2} dot={false} strokeDasharray="5 3" activeDot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── FeaturedCard ──────────────────────────────────────────────────────────────

function FeaturedCard({
  markets,
  onSelect,
}: {
  markets: DBMarket[];
  onSelect: (m: DBMarket) => void;
}) {
  const [idx, setIdx] = useState(0);

  // reset ao trocar de lista
  useEffect(() => setIdx(0), [markets]);

  if (!markets.length) return null;

  const featured = markets[idx];
  const { title, labelA, labelB, homeLogo, awayLogo, yesProb, noProb, dateLabel } =
    getMarketInfo(featured);
  const yesOdds  = yesProb > 0 ? (100 / yesProb).toFixed(2) : "—";
  const noOdds   = noProb  > 0 ? (100 / noProb).toFixed(2)  : "—";

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">

      {/* ── Topo: badge + navegação ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            ● {featured.category || "Esportes"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {dateLabel && <span className="text-xs text-muted-foreground">{dateLabel}</span>}
          <button
            onClick={() => setIdx((i) => (i - 1 + markets.length) % markets.length)}
            className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted-foreground min-w-[50px] text-center">
            {idx + 1} de {markets.length}
          </span>
          <button
            onClick={() => setIdx((i) => (i + 1) % markets.length)}
            className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Título ── */}
      <div className="px-5 pt-4 pb-1">
        <h2 className="text-xl font-bold text-foreground leading-snug">{title}</h2>
      </div>

      {/* ── Times + probabilidades ── */}
      <div className="px-5 py-3">
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <span className="flex-1">Mercado</span>
          <span className="w-14 text-center mr-3">Paga fora</span>
          <span className="w-16 text-center">Probabilidades</span>
        </div>

        {/* Time A */}
        <div className="flex items-center py-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {homeLogo ? (
              <img src={homeLogo} alt={labelA} className="h-7 w-7 rounded-full object-contain bg-muted shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                {labelA.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-foreground truncate">{labelA}</span>
          </div>
          <span className="text-xs text-muted-foreground w-14 text-center mr-3">{yesOdds}x</span>
          <button onClick={() => onSelect(featured)}
            className="w-16 h-8 rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors shrink-0">
            {yesProb}%
          </button>
        </div>

        {/* Time B */}
        <div className="flex items-center py-2 border-t border-border/30">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {awayLogo ? (
              <img src={awayLogo} alt={labelB} className="h-7 w-7 rounded-full object-contain bg-muted shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                {labelB.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-foreground underline decoration-red-400 underline-offset-2 truncate">
              {labelB}
            </span>
          </div>
          <span className="text-xs text-muted-foreground w-14 text-center mr-3">{noOdds}x</span>
          <button onClick={() => onSelect(featured)}
            className="w-16 h-8 rounded-lg text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors shrink-0">
            {noProb}%
          </button>
        </div>
      </div>

      {/* ── Volume ── */}
      <div className="px-5 pb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{fmtVol(featured.volume || 0)} vol</span>
        <span>Espalhe e Total</span>
      </div>

      {/* ── Gráfico price_history ── */}
      <div className="border-t border-border/30 mt-2">
        <PriceChart marketId={featured.id} labelA={labelA} labelB={labelB} />
      </div>

      {/* ── Footer pills ── */}
      <div className="border-t border-border/30 grid grid-cols-3 divide-x divide-border/30">
        {[
          { icon: "📋", title: "Mercados sobre monopólios",  sub: "Como os mercados justos protegem os consumidores" },
          { icon: "🛡️", title: "Negociação Responsável",     sub: "Ferramentas e dicas para negociar de forma inteligente" },
          { icon: "🔍", title: "Integridade Mercadológica",  sub: "Saiba como o Kalshi impede o insider trading" },
        ].map((p) => (
          <div key={p.title} className="flex items-start gap-2 px-4 py-3 hover:bg-accent/30 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-sm shrink-0 mt-0.5">{p.icon}</div>
            <div>
              <div className="text-[11px] font-semibold text-foreground leading-tight">{p.title}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{p.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── CategoryGrid (4 cards por categoria, estilo Kalshi) ──────────────────────

function CategoryMiniCard({ market, onSelect }: { market: DBMarket; onSelect: (m: DBMarket) => void }) {
  const { title, yesProb, noProb, dateLabel } = getMarketInfo(market);
  const imageUrl = (market as any).image_url;
  const yesOdds  = yesProb > 0 ? (100 / yesProb).toFixed(2) : "—";
  const noOdds   = noProb  > 0 ? (100 / noProb).toFixed(2)  : "—";

  // Pega até 2 opções do nome (dividindo por " x " ou " vs ")
  const parts = title.split(/ x | vs /i);
  const optA  = parts[0]?.trim().split(/[:\-–—]/)[0].trim() || "Sim";
  const optB  = parts[1]?.trim().split(/[:\-–—]/)[0].trim() || "Não";
  const probA = yesProb;
  const probB = noProb;
  const oddsA = yesOdds;
  const oddsB = noOdds;

  return (
    <div
      onClick={() => onSelect(market)}
      className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:bg-accent/30 transition-colors flex flex-col gap-3"
    >
      {/* Header com ícone/imagem + categoria */}
      <div className="flex items-center gap-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-8 h-8 rounded-lg object-cover bg-muted shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-muted-foreground">{title.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
          {(market as any).category || ""}
        </span>
        {dateLabel && <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{dateLabel}</span>}
      </div>

      {/* Título */}
      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{title}</p>

      {/* Opções */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground truncate mr-2">{optA}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground">{oddsA}x</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">{probA}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/30 pt-1.5">
          <span className="text-xs text-foreground truncate mr-2 underline decoration-red-400 underline-offset-2">{optB}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground">{oddsB}x</span>
            <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg">{probB}%</span>
          </div>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto pt-1 border-t border-border/20">
        <span>{fmtVol((market as any).volume)} vol</span>
        <span className="text-primary hover:underline">Ver mercado →</span>
      </div>
    </div>
  );
}

function CategoryGrid({
  cat,
  onSelect,
}: {
  cat: { key: string; label: string; icon: React.ElementType; color: string; markets: DBMarket[] };
  onSelect: (m: DBMarket) => void;
}) {
  const top4 = cat.markets.slice(0, 4);
  if (!top4.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <cat.icon className={`h-4 w-4 ${cat.color}`} />
          <h2 className="text-base font-bold text-foreground">{cat.label}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{cat.markets.length}</span>
        </div>
        <span className="text-xs text-primary cursor-pointer hover:underline flex items-center gap-0.5">
          Ver todos <ChevronRight className="h-3 w-3" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {top4.map((m) => (
          <CategoryMiniCard key={m.id} market={m} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ markets }: { markets: DBMarket[] }) {
  const trending = useMemo(() => [...markets].sort((a, b) => b.volume - a.volume).slice(0, 5), [markets]);
  const recent   = useMemo(() => [...markets].reverse().slice(0, 4), [markets]);

  return (
    <div className="flex flex-col gap-3">
      {/* Playoffs */}
      <div className="rounded-xl border border-emerald-500/20 overflow-hidden" style={{ background: "linear-gradient(135deg,#0f2a1a,#111827)" }}>
        <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-semibold text-foreground">Basquete Pro Playoffs</span>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-400" />
        </div>
      </div>

      {/* KPIs */}
      <div className="rounded-xl border border-violet-500/20 overflow-hidden" style={{ background: "linear-gradient(135deg,#0f0f2a,#111827)" }}>
        <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="text-sm font-semibold text-foreground">Empresa KPIs</span>
          </div>
          <ChevronRight className="h-4 w-4 text-violet-400" />
        </div>
      </div>

      {/* Tendência */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-sm font-bold text-foreground">Tendência</span>
          <span className="text-xs text-primary cursor-pointer hover:underline">› ver mais</span>
        </div>
        <div className="divide-y divide-border/30">
          {trending.map((m, i) => {
            const p = Math.round((m.yes_price ?? 0.5) * 100);
            const d = Math.floor(Math.random() * 8) - 4;
            return (
              <div key={m.id} className="flex items-start gap-2 px-4 py-2.5 hover:bg-accent/30 cursor-pointer">
                <span className="text-xs text-muted-foreground w-4 shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-snug line-clamp-2">
                    {(m as any).nome || m.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.category || ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">{p}%</p>
                  <p className={`text-[10px] ${d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {d >= 0 ? "▲" : "▼"} {Math.abs(d)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mais Recentes */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-sm font-bold text-foreground">Mais Recentes</span>
          <span className="text-xs text-primary cursor-pointer hover:underline">› ver mais</span>
        </div>
        <div className="divide-y divide-border/30">
          {recent.map((m, i) => {
            const p = Math.round((m.yes_price ?? 0.5) * 100);
            return (
              <div key={m.id} className="flex items-start gap-2 px-4 py-2.5 hover:bg-accent/30 cursor-pointer">
                <span className="text-xs text-muted-foreground w-4 shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-snug line-clamp-2">
                    {(m as any).nome || m.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.status || "ativo"}</p>
                </div>
                <p className="text-xs font-bold text-foreground shrink-0">{p}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Page principal ────────────────────────────────────────────────────────────

const Index = () => {
  const [selectedMarket, setSelectedMarket] = useState<DBMarket | null>(null);
  const [search, setSearch]                 = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [activeCatBar, setActiveCatBar]     = useState("Tendência");

  const { data: allMarkets, isLoading }    = useMarkets(null);
  const { data: posicoes = [] }            = useMarketPosicoes(selectedMarket?.id ?? "");

  const activeMarkets = useMemo(() => {
    if (!allMarkets) return [];
    return filterActive(allMarkets);
  }, [allMarkets]);

  const sportsMarkets = useMemo(() =>
    activeMarkets.filter((m) => m.category === "esportes").sort((a, b) => b.volume - a.volume),
    [activeMarkets]);

  const otherCategories = useMemo(() =>
    CATEGORIES.filter((c) => c.key !== "esportes").map((cat) => ({
      ...cat,
      markets: activeMarkets
        .filter((m) => m.category === cat.key)
        .sort((a, b) => b.volume - a.volume),
    })).filter((c) => c.markets.length > 0),
    [activeMarkets]);

  const displayMarkets = useMemo(() => {
    let base = activeMarkets;
    if (activeCategory !== "todos")
      base = base.filter((m) => m.category === activeCategory);
    if (search)
      base = base.filter((m) =>
        ((m as any).nome || m.title || "").toLowerCase().includes(search.toLowerCase())
      );
    return base.sort((a, b) => b.volume - a.volume);
  }, [activeMarkets, activeCategory, search]);

  const isSearching = !!search || activeCategory !== "todos";

  return (
    <div className="min-h-screen bg-background">
      {/* ── Category bar (sticky) ── */}
      <div className="border-b border-border/50 bg-card/60 sticky top-0 z-20 backdrop-blur-sm">
        <div
          className="max-w-6xl mx-auto px-4 flex overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {CAT_BAR.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCatBar(c)}
              className={`shrink-0 text-xs px-3 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeCatBar === c
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">
        {/* ── Search + pills ── */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border h-10 text-sm rounded-xl"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setActiveCategory("todos")}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                activeCategory === "todos"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <cat.icon className={`h-3 w-3 ${activeCategory === cat.key ? "text-primary-foreground" : cat.color}`} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid principal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
          <div>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => <MarketCardSkeleton key={i} />)}
              </div>
            ) : isSearching ? (
              displayMarkets.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhum mercado encontrado.</p>
                </div>
              ) : (
                <FeaturedCard markets={displayMarkets} onSelect={setSelectedMarket} />
              )
            ) : (
              <div className="flex flex-col gap-8">
                {/* Esportes — card carrossel */}
                {sportsMarkets.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-4 w-4 text-orange-400" />
                      <h2 className="text-base font-bold text-foreground">Esportiva</h2>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{sportsMarkets.length}</span>
                    </div>
                    <FeaturedCard markets={sportsMarkets} onSelect={setSelectedMarket} />
                  </div>
                )}

                {/* Outras categorias — grade 2x2 com image_url */}
                {otherCategories.map((cat) => (
                  <CategoryGrid key={cat.key} cat={cat} onSelect={setSelectedMarket} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <Sidebar markets={activeMarkets} />
          </div>
        </div>
      </div>

      <TradingDrawer
        market={selectedMarket}
        open={!!selectedMarket}
        onClose={() => setSelectedMarket(null)}
        posicoes={posicoes}
      />
    </div>
  );
};

export default Index;
