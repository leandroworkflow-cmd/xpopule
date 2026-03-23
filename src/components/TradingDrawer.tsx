import { useState } from "react";
import { Market } from "@/data/markets";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { categoryLabels } from "@/data/markets";
import { Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const PAYOUT = 100;
const FEE_RATE = 0.01;
const QUICK_QUANTITIES = [1, 5, 10];

function calcFees(qty: number, pricePerContract: number) {
  const subtotal = qty * pricePerContract;
  const fee = subtotal * FEE_RATE;
  const totalCost = subtotal + fee;
  const potentialReturn = qty * PAYOUT;
  const netProfit = potentialReturn - totalCost;
  return { subtotal, fee, totalCost, potentialReturn, netProfit };
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface TradingDrawerProps {
  market: Market | null;
  open: boolean;
  onClose: () => void;
}

export function TradingDrawer({ market, open, onClose }: TradingDrawerProps) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [quantity, setQuantity] = useState("1");
  const { balance, user } = useAuth();

  if (!market) return null;

  // Price now represents R$ 1–99 (stored as 1–99 in yesPrice/noPrice)
  const price = side === "yes" ? market.yesPrice : market.noPrice;
  const qty = parseFloat(quantity) || 0;
  const fees = calcFees(qty, price);
  const isUp = market.history.length > 1 && market.history[market.history.length - 1].price > market.history[0].price;
  const insufficientBalance = user && fees.totalCost > balance;
  const invalidQty = qty < 0.1;

  const handleOrder = () => {
    if (invalidQty) {
      toast.error("Quantidade mínima: 0.1 contrato.");
      return;
    }
    if (!user) {
      toast.error("Faça login para negociar.");
      return;
    }
    if (insufficientBalance) {
      toast.error("Saldo insuficiente. Deposite via PIX para continuar.");
      return;
    }
    toast.success(
      `Ordem executada! Comprou ${fmt(qty)} contratos de "${side === "yes" ? "Sim" : "Não"}" por R$ ${fmt(fees.totalCost)}.`
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
                  formatter={(value: number) => [`R$ ${value},00`, "Preço"]}
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
                <div className="text-xs opacity-80">R$ {fmt(market.yesPrice)}</div>
              </div>
            </Button>
            <Button
              variant={side === "no" ? "danger" : "outline"}
              className={`h-14 text-base ${side === "no" ? "glow-danger" : ""}`}
              onClick={() => setSide("no")}
            >
              <div className="text-center">
                <div className="font-bold">Não</div>
                <div className="text-xs opacity-80">R$ {fmt(market.noPrice)}</div>
              </div>
            </Button>
          </div>

          {/* Quick quantity buttons */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Quantidade Rápida</label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_QUANTITIES.map((q) => (
                <Button
                  key={q}
                  variant={parseFloat(quantity) === q ? "secondary" : "outline"}
                  size="sm"
                  className="h-10 flex-col gap-0"
                  onClick={() => setQuantity(String(q))}
                >
                  <span className="font-bold">{q}x</span>
                  <span className="text-[10px] opacity-70">R$ {fmt(q * price)}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom quantity */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Quantidade Personalizada</label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-background border-border text-foreground text-lg h-12"
            />
            <p className="text-xs text-muted-foreground mt-1">Mínimo: 0.1 contrato (R$ {fmt(price * 0.1)})</p>
          </div>

          {/* Fee breakdown */}
          <div className="rounded-lg bg-background/50 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Investimento ({fmt(qty)}x R$ {fmt(price)})</span>
              <span className="text-foreground font-medium">R$ {fmt(fees.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de negociação (1%)</span>
              <span className="text-foreground">R$ {fmt(fees.fee)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground font-semibold">Custo Total</span>
              <span className="text-foreground font-bold">R$ {fmt(fees.totalCost)}</span>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Retorno Potencial</span>
                <span className="text-foreground font-medium">R$ {fmt(fees.potentialReturn)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lucro Líquido Estimado</span>
                <span className={`font-bold ${fees.netProfit >= 0 ? "text-success" : "text-danger"}`}>
                  R$ {fmt(fees.netProfit)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Cada contrato paga R$ {fmt(PAYOUT)} se estiver correto.
            </p>
          </div>

          {/* Insufficient balance warning */}
          {insufficientBalance && (
            <div className="rounded-lg border border-danger/50 bg-danger/10 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
              <p className="text-sm text-danger">
                Saldo insuficiente. Deposite via PIX para continuar.
              </p>
            </div>
          )}

          {/* Order button */}
          <Button
            variant={side === "yes" ? "success" : "danger"}
            className="w-full h-12 text-base font-bold"
            onClick={handleOrder}
            disabled={!!insufficientBalance || invalidQty}
          >
            Comprar {side === "yes" ? "Sim" : "Não"} — R$ {fmt(fees.totalCost)}
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