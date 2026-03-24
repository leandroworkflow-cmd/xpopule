import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MarketCard, MarketCardSkeleton } from "@/components/MarketCard";
import { TradingDrawer } from "@/components/TradingDrawer";
import { DBMarket, categoryLabels } from "@/types/market";
import { useMarkets } from "@/hooks/useMarkets";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Index = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("cat");
  const [selectedMarket, setSelectedMarket] = useState<DBMarket | null>(null);
  const [search, setSearch] = useState("");

  const { data: markets, isLoading } = useMarkets(category);

  const filtered = useMemo(() => {
    if (!markets) return [];
    if (!search) return markets;
    return markets.filter((m) =>
      m.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [markets, search]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {category && categoryLabels[category]
            ? categoryLabels[category]
            : "Mercados em Destaque"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Negocie contratos baseados em eventos do mundo real.
        </p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar mercados..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((market) => (
            <MarketCard key={market.id} market={market} onClick={setSelectedMarket} />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          Nenhum mercado encontrado.
        </div>
      )}

      <TradingDrawer
        market={selectedMarket}
        open={!!selectedMarket}
        onClose={() => setSelectedMarket(null)}
      />
    </div>
  );
};

export default Index;
