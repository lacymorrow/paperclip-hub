"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { SORT_OPTIONS } from "@/data/plugins";

interface SortSelectProps {
  className?: string;
  dark?: boolean;
}

export const SortSelect = ({ className, dark }: SortSelectProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const active = searchParams?.get("sort") ?? "popular";

  const handleSort = (sort: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString());
      if (sort === "popular") {
        params.delete("sort");
      } else {
        params.set("sort", sort);
      }
      router.push(`/?${params.toString()}`);
    });
  };

  if (dark) {
    return (
      <select
        value={active}
        onChange={(e) => handleSort(e.target.value)}
        className={`outline-none cursor-pointer transition-all ${className ?? ""}`}
        style={{
          fontFamily: "inherit",
          fontSize: "0.875rem",
          color: "#8891A5",
          background: "#0F1117",
          border: "1px solid #1E2335",
          borderRadius: "10px",
          padding: "10px 36px 10px 14px",
          appearance: "none",
          WebkitAppearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23565E73' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "calc(100% - 12px) center",
          height: "44px",
        }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <select
      value={active}
      onChange={(e) => handleSort(e.target.value)}
      className={`rounded-md border bg-background px-3 py-2 text-sm ${className ?? ""}`}
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
