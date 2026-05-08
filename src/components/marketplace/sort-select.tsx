"use client";

import { SORT_OPTIONS } from "@/data/plugins";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useTransition } from "react";

export const SortSelect = ({ className }: { className?: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const active = searchParams?.get("sort") ?? "popular";
  const selectId = useId();

  const handleSort = (sort: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString());
      if (sort === "popular") {
        params.delete("sort");
      } else {
        params.set("sort", sort);
      }
      router.push(`/plugins?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="sr-only">Sort plugins</label>
      <select
        id={selectId}
        value={active}
        onChange={(e) => handleSort(e.target.value)}
        className={cn(
          "rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className,
        )}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
