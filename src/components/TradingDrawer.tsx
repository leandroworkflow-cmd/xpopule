import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DBMarket, categoryLabels } from "@/types/market";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  market: DBMarket | null;
  open: boolean;
  onClose: () => void;
}

export function TradingDrawer({ market, open, onClose }: TradingDrawerProps) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const { balance, user } = useAuth();
  const navigate = useNavigate();

  if (!market) return null;
  const price = side === "yes" ? market.yes_price : market.no_price;
  const qty = parseFloat(quantity) || 0;
  const fees = calcFees(qty, price);
  const insufficientBalance = user && fees.totalCost > balance;
  const invalidQty = qty < 0.1;
  const catLabel = categoryLabels[market.category] || market.category;

  const [loading, setLoading] = useState(false);

  const handleOrder = async () => {
    if (invalidQty) {
      toast.error("Quantidade mínima: 0.1 contrato.");
      return;
    }
    if (!user) {
      toast.info("Faça login para negociar.");
      onClose();
      navigate(`/login?redirect=${encodeURIComponent(`/mercado/${market.id}`)}`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { amount: fees.totalCost },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("URL de pagamento não retornada.");

      // Redirect to Stripe Checkout (PIX)
      window.location.assign(data.url);
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Erro ao criar sessão de pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader>
          <Badge variant="secondary" className="w-fit text-xs">
            {catLabel}
          </Badge>
          <SheetTitle className="text-foreground text-left text-lg leading-snug mt-2 capitalize">
            {market.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Side selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={side === "yes" ? "success" : "outline"}
              className={`h-14 text-base ${side === "yes" ? "glow-success" : ""}`}
              onClick={() => setSide("yes")}
            >
              <div className="text-center">
                <div className="font-bold">Sim</div>
                <div className="text-xs opacity-80">R$ {fmt(market.yes_price)}</div>
              </div>
            </Button>
            <Button
              variant={side === "no" ? "danger" : "outline"}
              className={`h-14 text-base ${side === "no" ? "glow-danger" : ""}`}
              onClick={() => setSide("no")}
            >
              <div className="text-center">
                <div className="font-bold">Não</div>
                <div className="text-xs opacity-80">R$ {fmt(market.no_price)}</div>
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
            <p className="text-xs text-muted-foreground leading-relaxed">{market.resolution_rule}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Encerramento: {new Date(market.end_date).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
