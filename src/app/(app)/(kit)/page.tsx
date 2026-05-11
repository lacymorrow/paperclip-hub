import { Hero } from "@/components/marketplace/hero";
import { PluginCard } from "@/components/marketplace/plugin-card";
import { StatsBanner } from "@/components/marketplace/stats-banner";
import { getPlugins } from "@/lib/registry";
import { ArrowRight } from "lucide-react";

export default async function HomePage() {
  const allPlugins = await getPlugins();

  const topPlugins = [...allPlugins]
    .sort((a, b) => b.installs - a.installs)
    .slice(0, 6);

  const recent = [...allPlugins]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      <Hero />

      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-16">
        <StatsBanner plugins={allPlugins} />

        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Popular Plugins</h2>
              <p className="text-sm text-muted-foreground mt-1">Most downloaded this week</p>
            </div>
            <a
              href="/plugins"
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} href={`/plugins/${plugin.slug}`} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Build a Plugin</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Extend OpenCode with custom auth providers, tools, and integrations.
            Submit it to the registry for the community to discover.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
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
