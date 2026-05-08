import { Hero } from "@/components/marketplace/hero";
import { PluginCard } from "@/components/marketplace/plugin-card";
import { StatsBanner } from "@/components/marketplace/stats-banner";
import { plugins } from "@/data/plugins";
import { siteConfig } from "@/config/site-config";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: `${siteConfig.title} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.title} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    type: "website",
    url: siteConfig.url,
    images: [{ url: `${siteConfig.url}/og?title=${encodeURIComponent(siteConfig.tagline)}&description=${encodeURIComponent(siteConfig.description)}`, width: 1200, height: 628, alt: siteConfig.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.title} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
};

const featured = plugins.filter((p) => p.featured);
const recent = [...plugins].sort(
  (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
).slice(0, 4);

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />

      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-12 sm:py-12 sm:space-y-16">
        <StatsBanner />

        <section aria-labelledby="featured-heading">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="featured-heading" className="text-xl font-bold tracking-tight sm:text-2xl">Featured Plugins</h2>
              <p className="text-sm text-muted-foreground mt-1">Hand-picked by the Paperclip team</p>
            </div>
            <a
              href="/plugins"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
            >
              View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} href={`/plugins/${plugin.slug}`} />
            ))}
          </div>
        </section>

        <section aria-labelledby="recent-heading">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="recent-heading" className="text-xl font-bold tracking-tight sm:text-2xl">Recently Updated</h2>
              <p className="text-sm text-muted-foreground mt-1">Latest activity in the ecosystem</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} href={`/plugins/${plugin.slug}`} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center sm:p-12" aria-labelledby="build-heading">
          <h2 id="build-heading" className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">Build a Plugin</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Extend Paperclip with custom connectors, automations, and UI extensions.
            Ship it to the hub for the community to use.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="/docs/plugins"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
            >
              Read the Docs
            </a>
            <a
              href="/submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border bg-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
            >
              Publish a Plugin
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
