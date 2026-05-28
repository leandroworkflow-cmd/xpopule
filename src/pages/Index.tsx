import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MarketCardSkeleton } from "@/components/MarketCard";
import { TradingDrawer } from "@/components/TradingDrawer";
import { DBMarket } from "@/types/market";
import { useMarkets, useMarketPosicoes } from "@/hooks/useMarkets";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Search, ChevronRight, ChevronLeft,
  Landmark, Trophy, TrendingUp,
  Clapperboard, CloudSun, BarChart2, Globe,
} from "lucide-react";
import { extractTeamsFromTitle } from "@/lib/teamLogos";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

const CATEGORIES = [
  { key: "esportes",       label: "Esportiva",   icon: Trophy,       color: "text-orange-400" },
  { key: "politica",       label: "Política",    icon: Landmark,     color: "text-blue-400" },
  { key: "economia",       label: "Econômicas",  icon: TrendingUp,   color: "text-emerald-400" },
  { key: "mercado",        label: "Financeiros", icon: BarChart2,    color: "text-violet-400" },
  { key: "mundo",          label: "Mundo",       icon: Globe,        color: "text-cyan-400" },
  { key: "entretenimento", label: "Cultura",     icon: Clapperboard, color: "text-pink-400" },
  { key: "clima",          label: "Clima",       icon: CloudSun,     color: "text-amber-400" },
];

const CAT_BAR = [
  "Tendência","Eleições","Política","Esportiva","Cultura",
  "Criptomoeda","Commodities","Clima","Econômicas","Menções",
  "Empresas","Financeiros","Tecnologia e Ciência",
];

function useOpcoesMercado(marketId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["opcoes_mercado", marketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opcoes_mercado")
        .select("*")
        .eq("market_id", marketId)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled,
  });
}

function filterActive(markets: DBMarket[]): DBMarket[] {
  const now = new Date();
  return markets.filter((m) => {
    const end = new Date((m as any).end_date || (m as any).event_date || "");
    if (isNaN(end.getTime())) return true;
    const isSport = ["esportes", "basquete", "luta", "volei", "tenis"].includes((m as any).category);
    const bufferMs = isSport ? 2 * 60 * 60 * 1000 : 0;
    return end.getTime() + bufferMs >= now.getTime();
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

// ── AnimatedPriceChart ────────────────────────────────────────────────────────

interface ChartPoint { name: string; home: number; away: number; }

function seedFromId(id: string): number {
  return id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function createOscillator(seed: number, startProb: number) {
  let t     = seed % 1000;
  let prob  = startProb;
  let trend = Math.sin(seed) * 0.3;
  return function next(isBump = false, bumpDir = 1): number {
    t += 1;
    if (isBump) {
      const bumpSize = 3 + Math.random() * 5;
      prob += bumpDir * bumpSize;
    } else {
      const slow    = Math.sin(t * 0.08 + seed) * 1.8;
      const fast    = Math.sin(t * 0.31 + seed * 2.1) * 0.9;
      trend        += (Math.random() - 0.505) * 0.04;
      trend         = Math.max(-0.6, Math.min(0.6, trend));
      const meanRev = (startProb - prob) * 0.018;
      prob         += slow * 0.12 + fast * 0.08 + trend + meanRev;
    }
    prob = Math.max(15, Math.min(85, prob));
    return Math.round(prob * 10) / 10;
  };
}

function buildInitialHistory(seed: number, startProb: number): ChartPoint[] {
  const osc = createOscillator(seed, startProb);
  return Array.from({ length: 20 }, (_, i) => {
    const home = osc();
    return { name: `${20 - i}m`, home, away: Math.round((100 - home) * 10) / 10 };
  }).reverse();
}

function calcDomain(points: ChartPoint[]): [number, number] {
  if (!points.length) return [20, 80];
  const vals = points.flatMap((p) => [p.home, p.away]);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const pad  = Math.max(6, (max - min) * 0.3);
  return [
    Math.max(0,   Math.floor(min - pad)),
    Math.min(100, Math.ceil(max  + pad)),
  ];
}

function CustomChartTooltip({ active, payload, labelA, labelB }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, padding: "6px 10px", fontSize: 11, color: "#e0e0e0" }}>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.stroke, marginBottom: 2 }}>
          {p.dataKey === "home" ? labelA : labelB}: <b>{Number(p.value).toFixed(1)}%</b>
        </div>
      ))}
    </div>
  );
}

function BuyNotification({ label, prob, side }: { label: string; prob: number; side: "home" | "away" }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  const color = side === "home" ? "#10b981" : "#f87171";
  return (
    <div style={{
      position: "absolute", top: 6, right: 8, zIndex: 10,
      background: "#111", border: `1px solid ${color}40`,
      borderRadius: 8, padding: "4px 8px", fontSize: 10,
      color, display: "flex", alignItems: "center", gap: 4,
      animation: "fadeInOut 2.8s ease forwards",
      pointerEvents: "none",
    }}>
      <span>↑</span>
      <span>Alguém comprou <b>{label}</b> → {prob.toFixed(1)}%</span>
    </div>
  );
}

function AnimatedPriceChart({
  marketId, labelA, labelB, initialProb = 50, onProbChange,
}: {
  marketId: string;
  labelA: string;
  labelB: string;
  initialProb?: number;
  onProbChange?: (home: number, away: number) => void; // ← novo callback
}) {
  const [points, setPoints]     = useState<ChartPoint[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notification, setNotification] = useState<{ label: string; prob: number; side: "home" | "away" } | null>(null);
  const oscRef       = useRef<((isBump?: boolean, bumpDir?: number) => number) | null>(null);
  const tickRef      = useRef<number>(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const bumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Notifica o pai sempre que os pontos mudam ──────────────────────────────
  useEffect(() => {
    if (!points.length) return;
    const last = points[points.length - 1];
    onProbChange?.(last.home, last.away);
  }, [points, onProbChange]);

  useEffect(() => {
    if (!marketId) return;
    setLoading(true);
    supabase
      .from("price_history")
      .select("minute, prob_home, prob_away")
      .eq("market_id", marketId)
      .order("minute", { ascending: true })
      .then(({ data }) => {
        const seed = seedFromId(marketId);
        if (data && data.length >= 3) {
          const real: ChartPoint[] = data.map((d) => ({
            name: `${d.minute}m`,
            home: Number(d.prob_home),
            away: Number(d.prob_away),
          }));
          const lastHome = real[real.length - 1]?.home ?? initialProb;
          oscRef.current  = createOscillator(seed, lastHome);
          tickRef.current = data.length;
          setPoints(real.slice(-20));
        } else {
          oscRef.current  = createOscillator(seed, initialProb);
          tickRef.current = 20;
          setPoints(buildInitialHistory(seed, initialProb));
        }
        setLoading(false);
      });
    return () => {
      if (timerRef.current)    clearInterval(timerRef.current);
      if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    };
  }, [marketId, initialProb]);

  const tick = useCallback(() => {
    if (!oscRef.current) return;
    const home = oscRef.current();
    const away = Math.round((100 - home) * 10) / 10;
    tickRef.current += 1;
    setPoints((prev) => [...prev, { name: `${tickRef.current}m`, home, away }].slice(-25));
  }, []);

  const scheduleBump = useCallback(() => {
    const delay = 8000 + Math.random() * 14000;
    bumpTimerRef.current = setTimeout(() => {
      if (!oscRef.current) { scheduleBump(); return; }
      const bumpDir  = Math.random() < 0.6 ? 1 : -1;
      const side     = bumpDir > 0 ? "home" : "away";
      const newHome  = oscRef.current(true, bumpDir);
      const newAway  = Math.round((100 - newHome) * 10) / 10;
      tickRef.current += 1;
      setPoints((prev) => [...prev, { name: `${tickRef.current}m`, home: newHome, away: newAway }].slice(-25));
      setNotification({ label: side === "home" ? labelA : labelB, prob: side === "home" ? newHome : newAway, side });
      setTimeout(() => setNotification(null), 3200);
      scheduleBump();
    }, delay);
  }, [labelA, labelB]);

  useEffect(() => {
    if (loading) return;
    timerRef.current = setInterval(tick, 3000);
    scheduleBump();
    return () => {
      if (timerRef.current)    clearInterval(timerRef.current);
      if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    };
  }, [loading, tick, scheduleBump]);

  if (loading) {
    return <div className="h-[130px] flex items-center justify-center text-xs text-muted-foreground">Carregando gráfico...</div>;
  }

  const [domMin, domMax] = calcDomain(points);
  const lastHome = points[points.length - 1]?.home ?? 50;
  const lastAway = points[points.length - 1]?.away ?? 50;

  return (
    <div className="px-2 pt-3 pb-2 relative">
      {notification && (
        <BuyNotification label={notification.label} prob={notification.prob} side={notification.side} />
      )}

      <div className="flex items-center gap-3 justify-start mb-1 px-2">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-3 h-0.5 bg-emerald-400 rounded" />
          {labelA}
          <span className="font-bold text-emerald-400 ml-0.5">{lastHome.toFixed(1)}%</span>
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-3 border-t-2 border-dashed border-red-400" />
          {labelB}
          <span className="font-bold text-red-400 ml-0.5">{lastAway.toFixed(1)}%</span>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={points} margin={{ top: 4, right: 48, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 8, fill: "#444" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            orientation="right"
            domain={[domMin, domMax]}
            tick={{ fontSize: 9, fill: "#555" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            tickCount={5}
            width={38}
          />
          <ReferenceLine
            y={Math.round((domMin + domMax) / 2)}
            stroke="#2a2a2a"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <Tooltip
            content={<CustomChartTooltip labelA={labelA} labelB={labelB} />}
            cursor={{ stroke: "#333", strokeWidth: 1 }}
          />
          <Line
            type="monotoneX"
            dataKey="home"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "#10b981" }}
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
          <Line
            type="monotoneX"
            dataKey="away"
            stroke="#f87171"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 3"
            activeDot={{ r: 3, fill: "#f87171" }}
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>

      <style>{`
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: translateY(-4px); }
          15%  { opacity: 1; transform: translateY(0); }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function FeaturedCard({ markets, onSelect }: { markets: DBMarket[]; onSelect: (m: DBMarket) => void }) {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  useEffect(() => setIdx(0), [markets]);
  if (!markets.length) return null;

  const featured = markets[idx];
  const { title, labelA, labelB, homeLogo, awayLogo, yesProb, noProb } = getMarketInfo(featured);
  const yesOdds = yesProb > 0 ? (100 / yesProb).toFixed(2) : "—";
  const noOdds  = noProb  > 0 ? (100 / noProb).toFixed(2)  : "—";

  const eventDate      = (featured as any).event_date;
  const now            = new Date();
  const eventDt        = eventDate ? new Date(eventDate) : null;
  const isToday        = eventDt ? eventDt.toDateString() === now.toDateString() : false;
  const isLive         = eventDt ? (eventDt <= now && now <= new Date(eventDt.getTime() + 2 * 60 * 60 * 1000)) : false;
  const eventDateLabel = eventDt ? eventDt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : null;
  const eventTimeLabel = eventDt ? eventDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden ${isLive ? "border-red-500/50" : "border-border"}`}>
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2 flex-wrap">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider border border-red-500/30">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>AO VIVO
            </span>
          ) : isToday ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider border border-orange-500/30">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" /></span>HOJE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider">● {featured.category || "Esportes"}</span>
          )}
          {eventDateLabel && eventTimeLabel && (
            <span className="text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded-full">📅 {eventDateLabel} · ⏰ {eventTimeLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIdx((i) => (i - 1 + markets.length) % markets.length)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <span className="text-xs text-muted-foreground min-w-[50px] text-center">{idx + 1} de {markets.length}</span>
          <button onClick={() => setIdx((i) => (i + 1) % markets.length)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="px-5 pt-4 pb-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/mercado/${featured.id}`)}>
        <h2 className="text-lg font-bold text-foreground leading-snug hover:text-primary transition-colors">{title}</h2>
      </div>
      <div className="flex flex-col md:flex-row items-stretch border-t border-border/30">
        <div className="flex flex-col justify-between px-4 py-3 w-full md:w-[300px] md:shrink-0">
          <div className="flex items-center text-xs text-muted-foreground mb-3">
            <span className="flex-1">Mercado</span>
            <span className="w-14 text-center mr-3">Paga fora</span>
            <span className="w-16 text-center">Probabilidades</span>
          </div>
          <div className="flex items-center py-2">
            <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/mercado/${featured.id}`)}>
              {homeLogo
                ? <img src={homeLogo} alt={labelA} className="h-8 w-8 rounded-full object-contain bg-muted shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">{labelA.slice(0, 2).toUpperCase()}</div>}
              <span className="text-sm font-medium text-foreground truncate">{labelA}</span>
            </div>
            <span className="text-xs text-muted-foreground w-14 text-center mr-3">{yesOdds}x</span>
            <button onClick={() => onSelect(featured)} className="w-16 h-8 rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors shrink-0">{yesProb}%</button>
          </div>
          <div className="flex items-center py-2 border-t border-border/30">
            <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/mercado/${featured.id}`)}>
              {awayLogo
                ? <img src={awayLogo} alt={labelB} className="h-8 w-8 rounded-full object-contain bg-muted shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">{labelB.slice(0, 2).toUpperCase()}</div>}
              <span className="text-sm font-medium text-foreground underline decoration-red-400 underline-offset-2 truncate">{labelB}</span>
            </div>
            <span className="text-xs text-muted-foreground w-14 text-center mr-3">{noOdds}x</span>
            <button onClick={() => onSelect(featured)} className="w-16 h-8 rounded-lg text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors shrink-0">{noProb}%</button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 mt-1 border-t border-border/20">
            <span>{fmtVol(featured.volume || 0)} vol</span>
            <span>Espalhe e Total</span>
          </div>
        </div>
        <div className="flex-1 border-l border-border/30 min-w-0">
          <AnimatedPriceChart marketId={featured.id} labelA={labelA} labelB={labelB} initialProb={yesProb} />
        </div>
      </div>
      <div className="border-t border-border/30 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/30">
        {[
          { icon: "📋", title: "Mercados sobre monopólios",  sub: "Como os mercados justos protegem os consumidores" },
          { icon: "🛡️", title: "Negociação Responsável",     sub: "Ferramentas e dicas para negociar de forma inteligente" },
          { icon: "🔍", title: "Integridade Mercadológica",  sub: "Saiba como o Kalshi impede o insider trading" },
        ].map((p) => (
          <div key={p.title} className="flex items-start gap-2 px-4 py-3 hover:bg-yellow-500/5 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-sm shrink-0 mt-0.5">{p.icon}</div>
            <div><div className="text-[11px] font-semibold text-yellow-400 leading-tight">{p.title}</div><div className="text-[10px] text-muted-foreground mt-0.5">{p.sub}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SPORT_ICONS: Record<string, string> = {
  basquete: "🏀", luta: "🥊", volei: "🏐", tenis: "🎾",
};

const SPORT_COLORS: Record<string, string> = {
  basquete: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  luta:     "text-red-400 bg-red-500/10 border-red-500/20",
  volei:    "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  tenis:    "text-lime-400 bg-lime-500/10 border-lime-500/20",
};

function OtherSportsFeaturedCard({ markets, onSelect }: { markets: DBMarket[]; onSelect: (m: DBMarket) => void }) {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  useEffect(() => setIdx(0), [markets]);
  if (!markets.length) return null;

  const featured   = markets[idx];
  const title      = (featured as any).nome || featured.title || "";
  const category   = featured.category || "";
  const icon       = SPORT_ICONS[category] || "🏆";
  const colorCls   = SPORT_COLORS[category] || "text-violet-400 bg-violet-500/10 border-violet-500/20";
  const eventDate  = (featured as any).event_date || (featured as any).end_date || "";
  const endDateObj = new Date(eventDate);
  const now        = new Date();
  const isToday    = endDateObj.toDateString() === now.toDateString();
  const isLive     = !isNaN(endDateObj.getTime()) && endDateObj <= now && now <= new Date(endDateObj.getTime() + 3 * 60 * 60 * 1000);
  const dateLabel  = !isNaN(endDateObj.getTime()) ? endDateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";
  const timeLabel  = !isNaN(endDateObj.getTime()) ? endDateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";

  const parts  = title.split(/ x | vs /i);
  const teamA  = parts[0]?.trim() || "Time A";
  const teamB  = parts[1]?.trim() || "Time B";

  const yesProb = Math.round(((featured as any).yes_prob ?? 50));
  const noProb  = 100 - yesProb;
  const yesOdds = yesProb > 0 ? (100 / yesProb).toFixed(2) : "—";
  const noOdds  = noProb  > 0 ? (100 / noProb).toFixed(2)  : "—";

  // ── Estado live das probabilidades sincronizado com o gráfico ──────────────
  const [liveProb, setLiveProb] = useState({ home: yesProb, away: noProb });

  // Reseta quando o card muda (usuário clica nas setas)
  useEffect(() => {
    setLiveProb({ home: yesProb, away: noProb });
  }, [featured.id, yesProb, noProb]);

  // Callback estável para receber updates do gráfico
  const handleProbChange = useCallback((home: number, away: number) => {
    setLiveProb({ home, away });
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden ${isLive ? "border-red-500/50" : "border-violet-500/20"}`}>
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2 flex-wrap">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider border border-red-500/30">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>AO VIVO
            </span>
          ) : isToday ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider border border-orange-500/30">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" /></span>HOJE
            </span>
          ) : null}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${colorCls}`}>
            {icon} {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
          <span className="text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded-full">📅 {dateLabel} · ⏰ {timeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIdx((i) => (i - 1 + markets.length) % markets.length)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <span className="text-xs text-muted-foreground min-w-[50px] text-center">{idx + 1} de {markets.length}</span>
          <button onClick={() => setIdx((i) => (i + 1) % markets.length)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="px-5 pt-4 pb-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/mercado/${featured.id}`)}>
        <h2 className="text-lg font-bold text-foreground leading-snug hover:text-primary transition-colors">{title}</h2>
      </div>
      <div className="flex flex-col md:flex-row items-stretch border-t border-border/30">
        <div className="flex flex-col justify-between px-4 py-3 w-full md:w-[300px] md:shrink-0">
          <div className="flex items-center text-xs text-muted-foreground mb-3">
            <span className="flex-1">Mercado</span>
            <span className="w-14 text-center mr-3">Paga fora</span>
            <span className="w-16 text-center">Probabilidades</span>
          </div>
          <div className="flex items-center py-2">
            <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/mercado/${featured.id}`)}>
              <div className="shrink-0 h-16 w-11 rounded-xl bg-blue-950 border-2 border-white/80 overflow-hidden flex items-center justify-center shadow-md">
                <img src="/silhueta1.png" alt={teamA} className="h-full w-full object-cover" />
              </div>
              <span className="text-sm font-medium text-foreground truncate">{teamA}</span>
            </div>
            <span className="text-xs text-muted-foreground w-14 text-center mr-3">{yesOdds}x</span>
            {/* ← Agora usa liveProb.home em vez de yesProb estático */}
            <button onClick={() => onSelect(featured)} className="w-16 h-8 rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors shrink-0">
              {liveProb.home.toFixed(1)}%
            </button>
          </div>
          <div className="flex items-center py-2 border-t border-border/30">
            <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/mercado/${featured.id}`)}>
              <div className="shrink-0 h-16 w-11 rounded-xl bg-purple-950 border-2 border-white/80 overflow-hidden flex items-center justify-center shadow-md">
                <img src="/silhueta2.png" alt={teamB} className="h-full w-full object-cover" />
              </div>
              <span className="text-sm font-medium text-foreground underline decoration-red-400 underline-offset-2 truncate">{teamB}</span>
            </div>
            <span className="text-xs text-muted-foreground w-14 text-center mr-3">{noOdds}x</span>
            {/* ← Agora usa liveProb.away em vez de noProb estático */}
            <button onClick={() => onSelect(featured)} className="w-16 h-8 rounded-lg text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors shrink-0">
              {liveProb.away.toFixed(1)}%
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 mt-1 border-t border-border/20">
            <span>{fmtVol((featured as any).volume || 0)} vol</span>
            <span>Espalhe e Total</span>
          </div>
        </div>
        <div className="flex-1 border-l border-border/30 min-w-0 flex flex-col">
          {/* ← Passa o callback onProbChange para o gráfico */}
          <AnimatedPriceChart
            marketId={featured.id}
            labelA={teamA}
            labelB={teamB}
            initialProb={yesProb}
            onProbChange={handleProbChange}
          />
          <div className="flex-1 border-t border-border/30 p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Próximos jogos</p>
            <div className="flex flex-col gap-2">
              {markets.slice(0, 3).map((m, i) => {
                const t  = (m as any).nome || m.title || "";
                const d  = new Date((m as any).end_date || "");
                const dl = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                const tl = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                const ico = SPORT_ICONS[m.category] || "🏆";
                const isCurrent = i === idx;
                return (
                  <div key={m.id} onClick={() => setIdx(i)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${isCurrent ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/40 border border-transparent"}`}>
                    <span className="text-base shrink-0">{ico}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>{t}</p>
                      <p className="text-[10px] text-muted-foreground">{dl} · {tl}</p>
                    </div>
                    {isCurrent && <span className="text-[9px] font-bold text-primary shrink-0">● ativo</span>}
                  </div>
                );
              })}
              {markets.length > 3 && <p className="text-[10px] text-muted-foreground text-center pt-1">+{markets.length - 3} jogos</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border/30 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/30">
        {[
          { icon: "📋", title: "Mercados sobre monopólios",  sub: "Como os mercados justos protegem os consumidores" },
          { icon: "🛡️", title: "Negociação Responsável",     sub: "Ferramentas e dicas para negociar de forma inteligente" },
          { icon: "🔍", title: "Integridade Mercadológica",  sub: "Saiba como o Kalshi impede o insider trading" },
        ].map((p) => (
          <div key={p.title} className="flex items-start gap-2 px-4 py-3 hover:bg-yellow-500/5 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-sm shrink-0 mt-0.5">{p.icon}</div>
            <div><div className="text-[11px] font-semibold text-yellow-400 leading-tight">{p.title}</div><div className="text-[10px] text-muted-foreground mt-0.5">{p.sub}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryMiniCard({ market, onSelect }: { market: DBMarket; onSelect: (m: DBMarket) => void }) {
  const navigate    = useNavigate();
  const { title, yesProb, noProb, dateLabel } = getMarketInfo(market);
  const imageUrl    = (market as any).image_url;
  const tipoMercado = (market as any).tipo_mercado || "binario";
  const yesOdds     = yesProb > 0 ? (100 / yesProb).toFixed(2) : "—";
  const noOdds      = noProb  > 0 ? (100 / noProb).toFixed(2)  : "—";
  const isMulti     = tipoMercado === "multiplo" || tipoMercado === "periodo";
  const { data: opcoes = [] } = useOpcoesMercado(market.id, isMulti);

  if (tipoMercado === "multiplo") {
    return (
      <div onClick={() => navigate(`/mercado/${market.id}`)} className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:bg-accent/30 transition-colors flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{(market as any).category || ""}</span>
          {dateLabel && <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{dateLabel}</span>}
        </div>
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{title}</p>
        <div className="flex flex-col gap-2">
          {(opcoes as any[]).slice(0, 3).map((op) => (
            <div key={op.id} className="flex items-center gap-3 py-2 px-2 rounded-lg bg-muted/20 border border-border/30 hover:border-primary/30 transition-all">
              {op.foto_url ? <img src={op.foto_url} alt={op.label} className="h-12 w-12 rounded-lg object-cover border-2 border-border/40 shrink-0" onError={(e) => { const t = e.target as HTMLImageElement; t.style.display="none"; const s = t.nextElementSibling as HTMLElement; if(s) s.style.display="flex"; }} /> : null}
              <div className="h-12 w-12 rounded-lg bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-sm font-bold text-primary shrink-0" style={{ display: op.foto_url ? "none" : "flex" }}>{op.label.slice(0,1).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{op.label}</p>
                {op.descricao && <p className="text-[10px] text-muted-foreground truncate">{op.descricao}</p>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); onSelect(market); }} className="text-sm font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors shrink-0">{op.probabilidade}%</button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto pt-1 border-t border-border/20">
          <span>{fmtVol((market as any).volume)} vol</span>
          <span className="text-primary hover:underline">Ver mercado →</span>
        </div>
      </div>
    );
  }

  if (tipoMercado === "periodo") {
    const maxProb = Math.max(...(opcoes as any[]).map((o) => Number(o.probabilidade) || 0), 0);
    return (
      <div onClick={() => navigate(`/mercado/${market.id}`)} className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:bg-accent/30 transition-colors flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {imageUrl && <img src={imageUrl} alt={title} className="w-8 h-8 rounded-lg object-cover bg-muted shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{(market as any).category || ""}</span>
          {dateLabel && <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{dateLabel}</span>}
        </div>
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{title}</p>
        <div className="flex flex-col gap-1.5">
          {(opcoes as any[]).slice(0, 3).map((op) => {
            const prob = Number(op.probabilidade) || 0;
            const isLeading = prob === maxProb;
            return (
              <div key={op.id} className={`flex items-center justify-between py-1.5 px-2 rounded-lg border transition-all ${isLeading ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border/40"}`}>
                <span className="text-xs text-foreground truncate flex-1">{op.label}</span>
                <button onClick={(e) => { e.stopPropagation(); onSelect(market); }} className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ml-2 ${isLeading ? "text-primary bg-primary/10 border border-primary/20" : "text-muted-foreground bg-muted/30 border border-border/40"}`}>{prob}%</button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto pt-1 border-t border-border/20">
          <span>{fmtVol((market as any).volume)} vol</span>
          <span className="text-primary hover:underline">Ver mercado →</span>
        </div>
      </div>
    );
  }

  const parts = title.split(/ x | vs /i);
  const optA  = parts[0]?.trim().split(/[:\-–—]/)[0].trim() || "Sim";
  const optB  = parts[1]?.trim().split(/[:\-–—]/)[0].trim() || "Não";

  return (
    <div onClick={() => navigate(`/mercado/${market.id}`)} className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:bg-accent/30 transition-colors flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {imageUrl ? <img src={imageUrl} alt={title} className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0"><span className="text-xs font-bold text-muted-foreground">{title.slice(0,2).toUpperCase()}</span></div>}
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{(market as any).category || ""}</span>
        {dateLabel && <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{dateLabel}</span>}
      </div>
      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{title}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground truncate mr-2">{optA}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground">{yesOdds}x</span>
            <button onClick={(e) => { e.stopPropagation(); onSelect(market); }} className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg hover:bg-emerald-500/20 transition-colors">{yesProb}%</button>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/30 pt-1.5">
          <span className="text-xs text-foreground truncate mr-2 underline decoration-red-400 underline-offset-2">{optB}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground">{noOdds}x</span>
            <button onClick={(e) => { e.stopPropagation(); onSelect(market); }} className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg hover:bg-red-500/20 transition-colors">{noProb}%</button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto pt-1 border-t border-border/20">
        <span>{fmtVol((market as any).volume)} vol</span>
        <span className="text-primary hover:underline">Ver mercado →</span>
      </div>
    </div>
  );
}

function CategoryGrid({ cat, onSelect }: { cat: { key: string; label: string; icon: React.ElementType; color: string; markets: DBMarket[] }; onSelect: (m: DBMarket) => void }) {
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
        <span className="text-xs text-primary cursor-pointer hover:underline flex items-center gap-0.5">Ver todos <ChevronRight className="h-3 w-3" /></span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {top4.map((m) => <CategoryMiniCard key={m.id} market={m} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

function UFCSidebarCard() {
  const navigate = useNavigate();
  const { data: ufcMarket } = useQuery({
    queryKey: ["ufc_next_sidebar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("markets").select("id, nome, end_date, yes_prob").eq("category", "luta").eq("status", "active").order("end_date", { ascending: true }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: espnData } = useQuery({
    queryKey: ["ufc_espn"],
    queryFn: async () => { const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard"); return res.json(); },
    staleTime: 1000 * 60 * 10,
  });
  const espnEvent = espnData?.events?.[0];
  const eventName = espnEvent?.name || "";
  const eventDate = espnEvent?.date ? new Date(espnEvent.date) : null;
  const isValid   = eventDate && !isNaN(eventDate.getTime());
  const dateStr   = isValid ? eventDate!.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";
  const timeStr   = isValid ? eventDate!.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";
  const venue     = espnEvent?.venues?.[0]?.fullName || "";
  const competitions = espnEvent?.competitions || [];
  const mainEvent = competitions[competitions.length - 1];
  const compA = mainEvent?.competitors?.[0];
  const compB = mainEvent?.competitors?.[1];
  const idA = compA?.id || ""; const idB = compB?.id || "";
  const nameA = compA?.athlete?.shortName || "—"; const nameB = compB?.athlete?.shortName || "—";
  const photoA = idA ? `https://a.espncdn.com/i/headshots/mma/players/full/${idA}.png` : "";
  const photoB = idB ? `https://a.espncdn.com/i/headshots/mma/players/full/${idB}.png` : "";
  const ufc_logo = "https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png";
  if (!espnEvent && !ufcMarket) return null;
  return (
    <div className="rounded-xl border border-red-500/30 bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-red-500/5">
        <img src={ufc_logo} alt="UFC" className="h-5 w-5 object-contain" />
        <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Próximo UFC</span>
        <span className="ml-auto text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">Em breve</span>
      </div>
      <div className="px-4 pt-3 pb-1">
        <p className="text-[11px] font-bold text-foreground text-center leading-snug line-clamp-2">{eventName || (ufcMarket as any)?.nome}</p>
        {venue && <p className="text-[9px] text-muted-foreground text-center mt-0.5">📍 {venue}</p>}
      </div>
      <div className="flex items-end justify-center gap-2 px-4 pt-2 pb-1">
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="h-20 w-16 rounded-xl overflow-hidden bg-muted border-2 border-white/20 shadow-md">
            <img src={photoA} alt={nameA} className="h-full w-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = "/silhueta1.png"; }} />
          </div>
          <span className="text-[9px] font-semibold text-foreground text-center truncate w-full">{nameA}</span>
        </div>
        <span className="text-sm font-black text-red-400 shrink-0 mb-6">VS</span>
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="h-20 w-16 rounded-xl overflow-hidden bg-muted border-2 border-white/20 shadow-md">
            <img src={photoB} alt={nameB} className="h-full w-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = "/silhueta2.png"; }} />
          </div>
          <span className="text-[9px] font-semibold text-foreground text-center truncate w-full">{nameB}</span>
        </div>
      </div>
      <div className="px-4 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>📅 {dateStr}</span><span>⏰ {timeStr}</span>
        </div>
        <button onClick={() => ufcMarket && navigate(`/mercado/${ufcMarket.id}`)} className="w-full py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">Ver mercado →</button>
      </div>
    </div>
  );
}

function Sidebar({ markets }: { markets: DBMarket[] }) {
  const trending = useMemo(() => [...markets].sort((a, b) => b.volume - a.volume).slice(0, 5), [markets]);
  const recent   = useMemo(() => [...markets].reverse().slice(0, 4), [markets]);
  return (
    <div className="flex flex-col gap-3">
      <UFCSidebarCard />
      <div className="rounded-xl border border-emerald-500/20 overflow-hidden" style={{ background: "linear-gradient(135deg,#0f2a1a,#111827)" }}>
        <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2"><span className="text-lg">🏆</span><span className="text-sm font-semibold text-foreground">Basquete Pro Playoffs</span></div>
          <ChevronRight className="h-4 w-4 text-emerald-400" />
        </div>
      </div>
      <div className="rounded-xl border border-violet-500/20 overflow-hidden" style={{ background: "linear-gradient(135deg,#0f0f2a,#111827)" }}>
        <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2"><span className="text-lg">📊</span><span className="text-sm font-semibold text-foreground">Empresa KPIs</span></div>
          <ChevronRight className="h-4 w-4 text-violet-400" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-sm font-bold text-foreground">Tendência</span>
          <span className="text-xs text-primary cursor-pointer hover:underline">ver mais</span>
        </div>
        <div className="divide-y divide-border/30">
          {trending.map((m, i) => {
            const p = Math.round((m.yes_price ?? 0.5) * 100);
            const d = Math.floor(Math.random() * 8) - 4;
            return (
              <div key={m.id} className="flex items-start gap-2 px-4 py-2.5 hover:bg-accent/30 cursor-pointer">
                <span className="text-xs text-muted-foreground w-4 shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-snug line-clamp-2">{(m as any).nome || m.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.category || ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">{p}%</p>
                  <p className={`text-[10px] ${d >= 0 ? "text-emerald-400" : "text-red-400"}`}>{d >= 0 ? "▲" : "▼"} {Math.abs(d)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-sm font-bold text-foreground">Mais Recentes</span>
          <span className="text-xs text-primary cursor-pointer hover:underline">ver mais</span>
        </div>
        <div className="divide-y divide-border/30">
          {recent.map((m, i) => {
            const p = Math.round((m.yes_price ?? 0.5) * 100);
            return (
              <div key={m.id} className="flex items-start gap-2 px-4 py-2.5 hover:bg-accent/30 cursor-pointer">
                <span className="text-xs text-muted-foreground w-4 shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-snug line-clamp-2">{(m as any).nome || m.title}</p>
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

const Index = () => {
  const [selectedMarket, setSelectedMarket] = useState<DBMarket | null>(null);
  const [search, setSearch]                 = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [activeCatBar, setActiveCatBar]     = useState("Tendência");
  const { data: allMarkets, isLoading } = useMarkets(null);
  const { data: posicoes = [] }         = useMarketPosicoes(selectedMarket?.id ?? "");
  const activeMarkets   = useMemo(() => { if (!allMarkets) return []; return filterActive(allMarkets); }, [allMarkets]);
  const sportsMarkets   = useMemo(() => activeMarkets.filter((m) => m.category === "esportes").sort((a, b) => b.volume - a.volume), [activeMarkets]);
  const otherCategories = useMemo(() => CATEGORIES.filter((c) => c.key !== "esportes").map((cat) => ({ ...cat, markets: activeMarkets.filter((m) => m.category === cat.key).sort((a, b) => b.volume - a.volume) })).filter((c) => c.markets.length > 0), [activeMarkets]);
  const otherSportsMarkets = useMemo(() => {
    const now = new Date(); const limite = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return activeMarkets.filter((m) => ["basquete", "luta", "volei", "tenis"].includes(m.category)).filter((m) => { const d = new Date((m as any).end_date || (m as any).event_date || ""); return !isNaN(d.getTime()) && d >= now && d <= limite; }).sort((a, b) => new Date((a as any).end_date || "").getTime() - new Date((b as any).end_date || "").getTime());
  }, [activeMarkets]);
  const displayMarkets = useMemo(() => {
    let base = activeMarkets;
    if (activeCategory !== "todos") base = base.filter((m) => m.category === activeCategory);
    if (search) base = base.filter((m) => ((m as any).nome || m.title || "").toLowerCase().includes(search.toLowerCase()));
    return base.sort((a, b) => b.volume - a.volume);
  }, [activeMarkets, activeCategory, search]);
  const isSearching = !!search || activeCategory !== "todos";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/60 sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {CAT_BAR.map((c) => (
            <button key={c} onClick={() => setActiveCatBar(c)} className={`shrink-0 text-xs px-3 py-3 border-b-2 transition-all whitespace-nowrap ${activeCatBar === c ? "border-primary text-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar eventos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border h-10 text-sm rounded-xl" />
          </div>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <button onClick={() => setActiveCategory("todos")} className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${activeCategory === "todos" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>Todos</button>
            {CATEGORIES.map((cat) => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${activeCategory === cat.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                <cat.icon className={`h-3 w-3 ${activeCategory === cat.key ? "text-primary-foreground" : cat.color}`} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
          <div>
            {isLoading ? (
              <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <MarketCardSkeleton key={i} />)}</div>
            ) : isSearching ? (
              displayMarkets.length === 0
                ? <div className="text-center py-20 text-muted-foreground"><Globe className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>Nenhum mercado encontrado.</p></div>
                : <FeaturedCard markets={displayMarkets} onSelect={setSelectedMarket} />
            ) : (
              <div className="flex flex-col gap-8">
                {otherSportsMarkets.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-4 w-4 text-violet-400" />
                      <h2 className="text-base font-bold text-foreground">Outras Modalidades</h2>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{otherSportsMarkets.length}</span>
                      <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full ml-1">próximos 3 dias</span>
                    </div>
                    <OtherSportsFeaturedCard markets={otherSportsMarkets} onSelect={setSelectedMarket} />
                  </div>
                )}
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
                {otherCategories.map((cat) => <CategoryGrid key={cat.key} cat={cat} onSelect={setSelectedMarket} />)}
              </div>
            )}
          </div>
          <div className="hidden lg:block"><Sidebar markets={activeMarkets} /></div>
        </div>
      </div>
      <TradingDrawer market={selectedMarket} open={!!selectedMarket} onClose={() => setSelectedMarket(null)} posicoes={posicoes} />
    </div>
  );
};

export default Index;
