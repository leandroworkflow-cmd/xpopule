import { useState } from "react";
import { Market } from "@/data/markets";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { categoryLabels } from "@/data/markets";
import { Info } from "lucide-react";
import { toast } from "sonner";

interface TradingDrawerProps {
  market: Market | null;
  open: boolean;
  onClose: () => void;
}

export function TradingDrawer({ market, open, onClose }: TradingDrawerProps) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [quantity, setQuantity] = useState("10");

  if (!market) return null;

  const price = side === "yes" ? market.yesPrice : market.noPrice;
  const qty = parseInt(quantity) || 0;
  const cost = (qty * price) / 100;
  const maxProfit = qty - cost;
  const isUp = market.history.length > 1 && market.history[market.history.length - 1].price > market.history[0].price;

  const handleOrder = () => {
    if (qty <= 0) {
      toast.error("Insira uma quantidade válida.");
      return;
    }
    toast.success(
      `Ordem executada! Comprou ${qty} contratos de "${side === "yes" ? "Sim" : "Não"}" por R$ ${cost.toFixed(2)}.`
    );
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader>
          <Badge variant="secondary" className="w-fit text-xs">
            {categoryLabels[market.category]}
          </Badge>
          <SheetTitle className="text-foreground text-left text-lg leading-snug mt-2">
            {market.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Chart */}
          <div className="h-40 rounded-lg bg-background/50 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={market.history}>
                <defs>
                  <linearGradient id="tradeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isUp ? "hsl(152, 60%, 48%)" : "hsl(350, 65%, 55%)"} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={isUp ? "hsl(152, 60%, 48%)" : "hsl(350, 65%, 55%)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 14%, 55%)" }} axisLine={false} tickLine={false} interval={6} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(215, 14%, 55%)" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(215, 14%, 55%)" }}
                  formatter={(value: number) => [`${value}¢`, "Preço"]}
                />
                <Area type="monotone" dataKey="price" stroke={isUp ? "hsl(152, 60%, 48%)" : "hsl(350, 65%, 55%)"} strokeWidth={2} fill="url(#tradeGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Side selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={side === "yes" ? "success" : "outline"}
              className={`h-14 text-base ${side === "yes" ? "glow-success" : ""}`}
              onClick={() => setSide("yes")}
            >
              <div className="text-center">
                <div className="font-bold">Sim</div>
                <div className="text-xs opacity-80">{market.yesPrice}¢</div>
              </div>
            </Button>
            <Button
              variant={side === "no" ? "danger" : "outline"}
              className={`h-14 text-base ${side === "no" ? "glow-danger" : ""}`}
              onClick={() => setSide("no")}
            >
              <div className="text-center">
                <div className="font-bold">Não</div>
                <div className="text-xs opacity-80">{market.noPrice}¢</div>
              </div>
            </Button>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Quantidade de Contratos</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-background border-border text-foreground text-lg h-12"
            />
          </div>

          {/* Calculator */}
          <div className="rounded-lg bg-background/50 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Preço por contrato</span>
              <span className="text-foreground font-medium">R$ {(price / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custo Total</span>
              <span className="text-foreground font-bold">R$ {cost.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Lucro Máximo</span>
              <span className="text-success font-bold">R$ {maxProfit.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cada contrato paga R$ 1,00 se estiver correto.
            </p>
          </div>

          {/* Order button */}
          <Button
            variant={side === "yes" ? "success" : "danger"}
            className="w-full h-12 text-base font-bold"
            onClick={handleOrder}
          >
            Comprar {side === "yes" ? "Sim" : "Não"} — R$ {cost.toFixed(2)}
          </Button>

          {/* Rules */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Info className="h-4 w-4 text-primary" />
              Regras do Mercado
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{market.resolution}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Encerramento: {new Date(market.endDate).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
