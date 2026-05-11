import { Hero } from "@/components/marketplace/hero";
import { PluginCard } from "@/components/marketplace/plugin-card";
import { StatsBanner } from "@/components/marketplace/stats-banner";
import { CATEGORIES, CATEGORY_COLORS } from "@/data/plugins";
import { getPlugins } from "@/lib/registry";
import { Activity, ArrowRight, Brain, KeyRound, Link2, Package2, Wrench } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  auth: KeyRound,
  provider: Package2,
  tools: Wrench,
  integration: Link2,
  observability: Activity,
  memory: Brain,
};

export default async function HomePage() {
  const allPlugins = await getPlugins();

  const topPlugins = [...allPlugins]
    .sort((a, b) => b.installs - a.installs)
    .slice(0, 6);

  const recent = [...allPlugins]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 6);

  const categoryCounts = allPlugins.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <Hero />

      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-16">
        <StatsBanner plugins={allPlugins} />

        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Browse by Category</h2>
            <p className="text-sm text-muted-foreground mt-1">Find the right plugin for your workflow</p>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.filter((c) => c.value !== "all").map((cat) => {
              const Icon = CATEGORY_ICONS[cat.value] ?? Package2;
              const colorClass = CATEGORY_COLORS[cat.value] ?? "";
              return (
                <a
                  key={cat.value}
                  href={`/plugins?category=${cat.value}`}
                  className="group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass.split(" ")[0] || "bg-primary/10"}`}>
                    <Icon className={`h-5 w-5 ${colorClass.split(" ")[1] || "text-primary"}`} />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">{categoryCounts[cat.value] ?? 0} plugins</span>
                </a>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Popular Plugins</h2>
              <p className="text-sm text-muted-foreground mt-1">Most downloaded this week</p>
            </div>
            <a
              href="/plugins?sort=popular"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              View all <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topPlugins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} href={`/plugins/${plugin.slug}`} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Recently Added</h2>
              <p className="text-sm text-muted-foreground mt-1">New arrivals in the registry</p>
            </div>
            <a
              href="/plugins?sort=newest"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              View all <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} href={`/plugins/${plugin.slug}`} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Build a Plugin</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Extend Paperclip with custom auth providers, tools, and integrations.
            Submit it to the registry for the community to discover.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <a
              href="/docs/plugins"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Read the Docs
            </a>
            <a
              href="/submit"
              className="inline-flex items-center gap-2 rounded-full border bg-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Submit a Plugin
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
