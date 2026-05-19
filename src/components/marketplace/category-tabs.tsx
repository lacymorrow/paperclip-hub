"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { CATEGORIES } from "@/data/plugins";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  className?: string;
  dark?: boolean;
}

export const CategoryTabs = ({ className, dark }: CategoryTabsProps) => {
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
      router.push(`/?${params.toString()}`);
    });
  };

  if (dark) {
    return (
      <div
        className={cn("flex items-center gap-2 overflow-x-auto pb-1", className)}
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={
                isActive
                  ? {
                      background: "rgba(124,107,255,0.15)",
                      color: "#A78BFA",
                      border: "1px solid rgba(124,107,255,0.3)",
                    }
                  : {
                      background: "#1C2030",
                      color: "#8891A5",
                      border: "1px solid transparent",
                    }
              }
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => handleCategoryChange(cat.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            active === cat.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};
