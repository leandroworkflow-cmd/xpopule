import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { markets, MarketCategory, categoryLabels } from "@/data/markets";
import { MarketCard } from "@/components/MarketCard";
import { TradingDrawer } from "@/components/TradingDrawer";
import { Market } from "@/data/markets";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Index = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("cat") as MarketCategory | null;
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = markets;
    if (category) result = result.filter((m) => m.category === category);
    if (search) result = result.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [category, search]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {category ? categoryLabels[category] : "Mercados em Destaque"}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((market) => (
          <MarketCard key={market.id} market={market} onClick={setSelectedMarket} />
        ))}
      </div>

      {filtered.length === 0 && (
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
