import { Suspense } from "react";
import { CategoryTabs } from "@/components/marketplace/category-tabs";
import { PluginCard } from "@/components/marketplace/plugin-card";
import { PluginGridSkeleton } from "@/components/marketplace/plugin-card-skeleton";
import { SearchBar } from "@/components/marketplace/search-bar";
import { SortSelect } from "@/components/marketplace/sort-select";
import { Skeleton } from "@/components/ui/skeleton";
import { filterPlugins } from "@/data/plugins";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Plugins — Paperclip Hub",
  description: "Discover plugins for Paperclip. Connectors, automations, workspace tools, and UI extensions built by the community.",
};

interface PluginsPageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

export default async function PluginsPage({ searchParams }: PluginsPageProps) {
  const params = await searchParams;
  const results = filterPlugins({
    search: params.q,
    category: params.category,
    sort: params.sort,
  });

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Browse Plugins</h1>
        <p className="mt-1 text-muted-foreground">
          {results.length} plugin{results.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={<div className="flex gap-1 flex-wrap"><Skeleton className="h-9 w-16 rounded-full" /><Skeleton className="h-9 w-24 rounded-full" /><Skeleton className="h-9 w-24 rounded-full" /><Skeleton className="h-9 w-28 rounded-full" /><Skeleton className="h-9 w-16 rounded-full" /></div>}>
          <CategoryTabs />
        </Suspense>
        <div className="flex items-center gap-3">
          <Suspense fallback={<Skeleton className="h-12 w-64 rounded-md" />}>
            <SearchBar className="w-64" />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-10 w-36 rounded-md" />}>
            <SortSelect />
          </Suspense>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center" role="status">
          <p className="text-lg font-medium">No plugins found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Plugin results">
          {results.map((plugin) => (
            <div key={plugin.id} role="listitem">
              <PluginCard
                plugin={plugin}
                href={`/plugins/${plugin.slug}`}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
