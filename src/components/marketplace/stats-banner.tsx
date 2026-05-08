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
  <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" aria-label="Marketplace statistics">
    {STAT_ITEMS.map((stat) => (
      <div
        key={stat.label}
        className="flex items-center gap-3 rounded-xl border bg-card/50 p-3 backdrop-blur-sm sm:p-4"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
          <stat.icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight sm:text-2xl">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      </div>
    ))}
  </section>
);
