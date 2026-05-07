import { stats } from "@/data/plugins";
import { ArrowDownToLine, Package, Star, Users } from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const STAT_ITEMS = [
  { label: "Plugins", value: stats.totalPlugins, icon: Package },
  { label: "Total Installs", value: formatNumber(stats.totalInstalls), icon: ArrowDownToLine },
  { label: "Publishers", value: stats.totalAuthors, icon: Users },
  { label: "Avg Rating", value: stats.avgRating, icon: Star },
];

export const StatsBanner = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    {STAT_ITEMS.map((stat) => (
      <div
        key={stat.label}
        className="flex items-center gap-3 rounded-xl border bg-card/50 p-4 backdrop-blur-sm"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <stat.icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      </div>
    ))}
  </div>
);
