"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useId, useState, useTransition } from "react";

export const SearchBar = ({ className }: { className?: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams?.get("q") ?? "");
  const inputId = useId();

  const handleSearch = useCallback(
    (term: string) => {
      setValue(term);
      startTransition(() => {
        const params = new URLSearchParams(searchParams?.toString());
        if (term) {
          params.set("q", term);
        } else {
          params.delete("q");
        }
        router.push(`/plugins?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div className={`relative ${className ?? ""}`} role="search">
      <label htmlFor={inputId} className="sr-only">Search plugins</label>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        id={inputId}
        placeholder="Search plugins, connectors, tools..."
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 h-12 text-base bg-background/60 backdrop-blur-sm border-border/50"
        aria-busy={isPending}
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label="Searching">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
};
