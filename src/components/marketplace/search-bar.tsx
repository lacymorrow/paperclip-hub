"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";

interface SearchBarProps {
  className?: string;
  dark?: boolean;
  heroSize?: boolean;
}

export const SearchBar = ({ className, dark, heroSize }: SearchBarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams?.get("q") ?? "");

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
        router.push(`/?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  if (dark) {
    return (
      <div className={`relative ${className ?? ""}`}>
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: "18px", height: "18px", color: "#565E73" }}
        />
        <input
          type="text"
          placeholder="Search plugins, connectors, tools..."
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full outline-none transition-all"
          style={{
            height: heroSize ? "56px" : "44px",
            fontSize: heroSize ? "1rem" : "0.875rem",
            paddingLeft: heroSize ? "48px" : "40px",
            paddingRight: heroSize ? "120px" : "16px",
            borderRadius: heroSize ? "16px" : "10px",
            background: "#0F1117",
            border: "1px solid #1E2335",
            color: "#E8ECF4",
            fontFamily: "inherit",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#7C6BFF";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,107,255,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#1E2335";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {heroSize && (
          <button
            onClick={() => handleSearch(value)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white text-sm font-semibold px-4 py-2 rounded-[10px] transition-all hover:bg-[#A78BFA]"
            style={{ background: "#7C6BFF" }}
          >
            Search
          </button>
        )}
        {isPending && !heroSize && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "#A78BFA", borderTopColor: "transparent" }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search plugins, connectors, tools..."
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 h-12 text-base bg-background/60 backdrop-blur-sm border-border/50"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
};
