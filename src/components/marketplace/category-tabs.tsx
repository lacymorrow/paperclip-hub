"use client";

import { CATEGORIES } from "@/data/plugins";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export const CategoryTabs = ({ className }: { className?: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const active = searchParams?.get("category") ?? "all";

  const handleCategoryChange = (category: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString());
      if (category === "all") {
        params.delete("category");
      } else {
        params.set("category", category);
      }
      router.push(`/plugins?${params.toString()}`);
    });
  };

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)} role="tablist" aria-label="Filter by category">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => handleCategoryChange(cat.value)}
          role="tab"
          aria-selected={active === cat.value}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            active === cat.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};
