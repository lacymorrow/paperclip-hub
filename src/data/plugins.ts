export interface Plugin {
  id: string;
  slug: string;
  name: string;
  npmPackage: string;
  description: string;
  category: string;
  author: { name: string; url?: string };
  installs: number;
  version: string;
  capabilities: string[];
  sourceRepo?: string;
  installCommand: string;
  submittedAt: string;
}

export const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "auth", label: "Auth" },
  { value: "provider", label: "Providers" },
  { value: "tools", label: "Tools" },
  { value: "integration", label: "Integrations" },
  { value: "observability", label: "Observability" },
  { value: "memory", label: "Memory" },
] as const;

export const SORT_OPTIONS = [
  { value: "popular", label: "Most Downloads" },
  { value: "newest", label: "Newest" },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  auth: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  provider: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  tools: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  integration: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  observability: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  memory: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

export function filterPlugins(
  plugins: Plugin[],
  { category, search, sort }: { category?: string; search?: string; sort?: string },
): Plugin[] {
  let filtered = [...plugins];

  if (category && category !== "all") {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  switch (sort) {
    case "newest":
      filtered.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );
      break;
    case "popular":
    default:
      filtered.sort((a, b) => b.installs - a.installs);
      break;
  }

  return filtered;
}
