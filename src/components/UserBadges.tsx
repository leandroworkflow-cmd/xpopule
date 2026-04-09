import { Award, TrendingUp, Zap, Crown, Star, Target } from "lucide-react";

interface BadgeInfo {
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  minTrades: number;
}

const BADGES: BadgeInfo[] = [
  { name: "Novato", description: "Fez sua primeira previsão", icon: Star, color: "text-muted-foreground", bgColor: "bg-muted", minTrades: 1 },
  { name: "Investidor Iniciante", description: "5 previsões realizadas", icon: Target, color: "text-blue-400", bgColor: "bg-blue-500/15", minTrades: 5 },
  { name: "Analista", description: "15 previsões realizadas", icon: TrendingUp, color: "text-purple-400", bgColor: "bg-purple-500/15", minTrades: 15 },
  { name: "Mestre das Previsões", description: "50 previsões realizadas", icon: Zap, color: "text-warning", bgColor: "bg-warning/15", minTrades: 50 },
  { name: "Tubarão do Mercado X", description: "100+ previsões realizadas", icon: Crown, color: "text-yellow-400", bgColor: "bg-yellow-500/15", minTrades: 100 },
];

export function getUserBadge(tradeCount: number): BadgeInfo {
  let badge = BADGES[0];
  for (const b of BADGES) {
    if (tradeCount >= b.minTrades) badge = b;
  }
  return badge;
}

export function UserBadges({ tradeCount }: { tradeCount: number }) {
  const currentBadge = getUserBadge(tradeCount);
  const currentIdx = BADGES.indexOf(currentBadge);
  const nextBadge = BADGES[currentIdx + 1];
  const progress = nextBadge
    ? ((tradeCount - currentBadge.minTrades) / (nextBadge.minTrades - currentBadge.minTrades)) * 100
    : 100;

  return (
    <div className="gradient-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Seu Nível</h3>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className={`h-14 w-14 rounded-xl ${currentBadge.bgColor} flex items-center justify-center`}>
          <currentBadge.icon className={`h-7 w-7 ${currentBadge.color}`} />
        </div>
        <div>
          <p className={`font-bold text-lg ${currentBadge.color}`}>{currentBadge.name}</p>
          <p className="text-xs text-muted-foreground">{currentBadge.description}</p>
        </div>
      </div>

      {nextBadge && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{tradeCount} previsões</span>
            <span>Próximo: {nextBadge.name} ({nextBadge.minTrades})</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-5 gap-2">
        {BADGES.map((b, i) => {
          const unlocked = tradeCount >= b.minTrades;
          return (
            <div key={b.name} className="flex flex-col items-center gap-1" title={b.name}>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${unlocked ? b.bgColor : "bg-muted/50"}`}>
                <b.icon className={`h-5 w-5 ${unlocked ? b.color : "text-muted-foreground/30"}`} />
              </div>
              <span className={`text-[10px] text-center leading-tight ${unlocked ? "text-muted-foreground" : "text-muted-foreground/30"}`}>
                {b.name.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
