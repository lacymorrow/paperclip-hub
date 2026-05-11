import { Suspense } from "react";
import { CategoryTabs } from "@/components/marketplace/category-tabs";
import { PluginCard } from "@/components/marketplace/plugin-card";
import { SearchBar } from "@/components/marketplace/search-bar";
import { SortSelect } from "@/components/marketplace/sort-select";
import { filterPlugins } from "@/data/plugins";
import { getPlugins } from "@/lib/registry";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Plugins — OpenCode Hub",
  description: "Discover community plugins for OpenCode. Auth providers, tools, and more.",
};

interface PluginsPageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

export default async function PluginsPage({ searchParams }: PluginsPageProps) {
  const [params, allPlugins] = await Promise.all([searchParams, getPlugins()]);
  const results = filterPlugins(allPlugins, {
    search: params.q,
    category: params.category,
    sort: params.sort,
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Browse Plugins</h1>
        <p className="mt-1 text-muted-foreground">
          {results.length} of {allPlugins.length} plugin{allPlugins.length !== 1 ? "s" : ""} in registry
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={<div className="h-10" />}>
          <CategoryTabs />
        </Suspense>
        <div className="flex items-center gap-3">
          <Suspense fallback={<div className="h-12 w-64" />}>
            <SearchBar className="w-64" />
          </Suspense>
          <Suspense fallback={<div className="h-10 w-36" />}>
            <SortSelect />
          </Suspense>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-lg font-medium">No plugins found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              href={`/plugins/${plugin.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
