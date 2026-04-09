import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, TrendingUp, Crown, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserBadge } from "@/components/UserBadges";

interface LeaderEntry {
  user_id: string;
  email: string;
  total_profit: number;
  trade_count: number;
}

const Leaderboard = () => {
  const { data: leaders, isLoading } = useQuery({
    queryKey: ["leaderboard-weekly"],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("user_id, amount, type")
        .gte("created_at", weekAgo.toISOString());

      if (error) throw error;

      const userMap = new Map<string, { profit: number; trades: number }>();
      for (const tx of transactions || []) {
        const entry = userMap.get(tx.user_id) || { profit: 0, trades: 0 };
        if (tx.type === "trade") {
          entry.profit += Number(tx.amount);
          entry.trades += 1;
        } else if (tx.type === "payout") {
          entry.profit += Number(tx.amount);
        }
        userMap.set(tx.user_id, entry);
      }

      const userIds = [...userMap.keys()];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const emailMap = new Map<string, string>();
      for (const p of profiles || []) {
        emailMap.set(p.id, p.email || "Anônimo");
      }

      // Get trade counts for badges
      const { data: allTx } = await supabase
        .from("transactions")
        .select("user_id")
        .eq("type", "trade")
        .in("user_id", userIds);

      const totalTradeMap = new Map<string, number>();
      for (const t of allTx || []) {
        totalTradeMap.set(t.user_id, (totalTradeMap.get(t.user_id) || 0) + 1);
      }

      const result: LeaderEntry[] = userIds.map((uid) => ({
        user_id: uid,
        email: emailMap.get(uid) || "Anônimo",
        total_profit: userMap.get(uid)!.profit,
        trade_count: totalTradeMap.get(uid) || 0,
      }));

      result.sort((a, b) => b.total_profit - a.total_profit);
      return result.slice(0, 10);
    },
  });

  const rankIcon = (i: number) => {
    if (i === 0) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (i === 1) return <Medal className="h-5 w-5 text-gray-300" />;
    if (i === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{i + 1}</span>;
  };

  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@");
    if (!domain) return email;
    return `${name.slice(0, 3)}***@${domain}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-warning/15 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ranking Semanal</h1>
          <p className="text-sm text-muted-foreground">Top 10 preditores com mais lucro na semana</p>
        </div>
      </div>

      {/* Podium top 3 */}
      {!isLoading && leaders && leaders.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 0, 2].map((idx) => {
            const l = leaders[idx];
            if (!l) return null;
            const badge = getUserBadge(l.trade_count);
            const isFirst = idx === 0;
            return (
              <div
                key={l.user_id}
                className={`gradient-card rounded-xl border border-border p-4 text-center ${isFirst ? "ring-1 ring-yellow-500/30 -mt-2" : ""}`}
              >
                <div className="flex justify-center mb-2">{rankIcon(idx)}</div>
                <div className={`h-10 w-10 mx-auto rounded-lg ${badge.bgColor} flex items-center justify-center mb-2`}>
                  <badge.icon className={`h-5 w-5 ${badge.color}`} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{maskEmail(l.email)}</p>
                <p className={`font-bold text-lg mt-1 ${l.total_profit >= 0 ? "text-success" : "text-danger"}`}>
                  {l.total_profit >= 0 ? "+" : ""}R$ {l.total_profit.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">{badge.name}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of list */}
      <div className="gradient-card rounded-xl border border-border divide-y divide-border">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : !leaders || leaders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Flame className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Nenhuma atividade nesta semana ainda.
          </div>
        ) : (
          leaders.map((l, i) => {
            const badge = getUserBadge(l.trade_count);
            return (
              <div key={l.user_id} className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors">
                <div className="w-8 flex justify-center">{rankIcon(i)}</div>
                <div className={`h-8 w-8 rounded-lg ${badge.bgColor} flex items-center justify-center shrink-0`}>
                  <badge.icon className={`h-4 w-4 ${badge.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{maskEmail(l.email)}</p>
                  <p className="text-[10px] text-muted-foreground">{badge.name} · {l.trade_count} previsões</p>
                </div>
                <div className={`font-bold text-sm ${l.total_profit >= 0 ? "text-success" : "text-danger"}`}>
                  {l.total_profit >= 0 ? "+" : ""}R$ {l.total_profit.toFixed(2)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
