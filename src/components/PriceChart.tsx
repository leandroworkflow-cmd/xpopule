import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface PriceChartProps {
  marketId: string;
  yesPrice: number;
  noPrice: number;
}

// Generate simulated historical data based on current price
function generateHistory(currentPrice: number, days: number = 30) {
  const data = [];
  let price = currentPrice * 0.7 + Math.random() * currentPrice * 0.3;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Random walk towards current price
    const target = currentPrice;
    const drift = (target - price) * 0.05;
    const noise = (Math.random() - 0.5) * 8;
    price = Math.max(1, Math.min(99, price + drift + noise));

    if (i === 0) price = currentPrice;

    const total = price + (100 - price);
    data.push({
      date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      sim: Math.round(price),
      nao: Math.round(100 - price),
      simPct: Math.round((price / total) * 100),
    });
  }

  return data;
}

export function PriceChart({ marketId, yesPrice, noPrice }: PriceChartProps) {
  const data = useMemo(() => generateHistory(yesPrice), [marketId, yesPrice]);

  const total = yesPrice + noPrice;
  const currentPct = total > 0 ? Math.round((yesPrice / total) * 100) : 50;

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Sim</span>
          <span className="text-xs font-bold text-success">{currentPct}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-danger" />
          <span className="text-xs text-muted-foreground">Não</span>
          <span className="text-xs font-bold text-danger">{100 - currentPct}%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gradientSim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(215, 14%, 55%)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "hsl(215, 14%, 55%)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(220, 18%, 12%)",
              border: "1px solid hsl(220, 14%, 18%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(215, 14%, 55%)" }}
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === "simPct" ? "Sim" : "Não",
            ]}
          />
          <Area
            type="monotone"
            dataKey="simPct"
            stroke="hsl(152, 60%, 48%)"
            strokeWidth={2}
            fill="url(#gradientSim)"
            dot={false}
            activeDot={{ r: 4, fill: "hsl(152, 60%, 48%)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
