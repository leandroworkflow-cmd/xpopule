import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MarketCard, MarketCardSkeleton } from "@/components/MarketCard";
import { TradingDrawer } from "@/components/TradingDrawer";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { DBMarket, categoryLabels } from "@/types/market";
import { useMarkets } from "@/hooks/useMarkets";
import { Input } from "@/components/ui/input";
import { Search, Flame, LayoutGrid, Landmark, Trophy, TrendingUp, Clapperboard, CloudSun } from "lucide-react";

const categoryTabs = [
  { key: null, label: "Trending", icon: Flame },
  { key: null, label: "Todos", icon: LayoutGrid },
  { key: "politica", label: "Política", icon: Landmark },
  { key: "esportes", label: "Esportes", icon: Trophy },
  { key: "economia", label: "Economia", icon: TrendingUp },
  { key: "entretenimento", label: "Cultura", icon: Clapperboard },
  { key: "clima", label: "Clima", icon: CloudSun },
];

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCat = searchParams.get("cat");
  const [activeTab, setActiveTab] = useState(urlCat || "Trending");
  const [selectedMarket, setSelectedMarket] = useState<DBMarket | null>(null);
  const [search, setSearch] = useState("");

  const category = categoryTabs.find(t => t.label === activeTab)?.key || null;
  const { data: markets, isLoading } = useMarkets(category);

  const filtered = useMemo(() => {
    if (!markets) return [];
    let result = markets;
    if (search) {
      result = result.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (activeTab === "Trending") {
      result = [...result].sort((a, b) => b.volume - a.volume);
    }
    return result;
  }, [markets, search, activeTab]);

  const handleTabClick = (tab: typeof categoryTabs[0]) => {
    setActiveTab(tab.label);
    if (tab.key) {
      setSearchParams({ cat: tab.key });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search bar - Kalshi style */}
      <div className="relative mb-5 max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Negocie qualquer evento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border h-10 text-sm"
        />
      </div>

      {/* Category tabs - Kalshi style horizontal */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {categoryTabs.map((tab) => {
          const isActive = activeTab === tab.label;
          const Icon = tab.icon;
          return (
            <button
              key={tab.label}
              onClick={() => handleTabClick(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                ${isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main content + sidebar */}
      <div className="flex gap-6">
        {/* Market grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">
              {activeTab === "Trending" ? "Em Alta" : categoryLabels[category || ""] || "Todos os Mercados"}
            </h2>
            {filtered.length > 0 && (
              <span className="text-xs text-muted-foreground">{filtered.length} mercados</span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <MarketCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
        </div>

        {/* Trending sidebar - desktop only */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <TrendingSidebar markets={markets || []} onSelect={setSelectedMarket} />
        </div>
      </div>

      <TradingDrawer
        market={selectedMarket}
        open={!!selectedMarket}
        onClose={() => setSelectedMarket(null)}
      />
    </div>
  );
};

export default Index;
