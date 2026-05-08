import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const PluginCardSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="mb-4 space-y-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-3.5 w-10" />
        </div>
        <Skeleton className="h-3.5 w-10" />
      </div>
    </CardContent>
  </Card>
);

export const PluginGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, i) => (
      <PluginCardSkeleton key={i} />
    ))}
  </div>
);
