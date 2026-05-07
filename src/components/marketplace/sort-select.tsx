"use client";

import { SORT_OPTIONS } from "@/data/plugins";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export const SortSelect = ({ className }: { className?: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const active = searchParams.get("sort") ?? "popular";

  const handleSort = (sort: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (sort === "popular") {
        params.delete("sort");
      } else {
        params.set("sort", sort);
      }
      router.push(`/plugins?${params.toString()}`);
    });
  };

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
