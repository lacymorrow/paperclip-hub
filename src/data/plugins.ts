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
  { value: "chat", label: "Chat" },
] as const;

export const SORT_OPTIONS = [
  { value: "popular", label: "Most Downloads" },
  { value: "newest", label: "Newest" },
] as const;

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
