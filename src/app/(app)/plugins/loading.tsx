import { PluginGridSkeleton } from "@/components/marketplace/plugin-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function PluginsLoading() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-32" />
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 flex-wrap">
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-64 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>

      <PluginGridSkeleton count={6} />
    </main>
  );
}
