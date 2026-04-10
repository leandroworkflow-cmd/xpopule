import { TrendingUp, Landmark, Clapperboard, CloudSun, Trophy } from "lucide-react";

export interface DBMarket {
  id: string;
  external_id: string | null;
  title: string;
  category: string;
  yes_price: number;
  no_price: number;
  volume: number;
  resolution_rule: string;
  end_date: string;
  status: string;
  image_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const categoryLabels: Record<string, string> = {
  economia: "Economia",
  politica: "Política",
  entretenimento: "Entretenimento",
  clima: "Clima",
  esportes: "Esportes",
};

export const categoryColors: Record<string, string> = {
  economia: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  politica: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  entretenimento: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  clima: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  esportes: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export const categoryIcons: Record<string, typeof TrendingUp> = {
  economia: TrendingUp,
  politica: Landmark,
  entretenimento: Clapperboard,
  clima: CloudSun,
  esportes: Trophy,
};
