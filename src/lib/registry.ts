import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { Plugin } from "@/data/plugins";

interface RegistryPlugin {
  name: string;
  npmPackage: string;
  description: string;
  category: string;
  capabilities: string[];
  sourceRepo?: string;
  author: string;
  submittedAt: string;
}

async function fetchNpmData(npmPackage: string): Promise<{ version: string; weeklyDownloads: number }> {
  try {
    const [regRes, dlRes] = await Promise.all([
      fetch(`https://registry.npmjs.org/${npmPackage}/latest`, { next: { revalidate: 3600 } }),
      fetch(`https://api.npmjs.org/downloads/point/last-week/${npmPackage}`, { next: { revalidate: 3600 } }),
    ]);
    const version = regRes.ok ? ((await regRes.json()) as { version: string }).version : "unknown";
    const weeklyDownloads = dlRes.ok ? ((await dlRes.json()) as { downloads: number }).downloads : 0;
    return { version, weeklyDownloads };
  } catch {
    return { version: "unknown", weeklyDownloads: 0 };
  }
}

function readRegistryDir(): RegistryPlugin[] {
  const dir = join(process.cwd(), "registry", "plugins");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(join(dir, file), "utf-8")) as RegistryPlugin);
}

let _cache: Plugin[] | null = null;

export async function getPlugins(): Promise<Plugin[]> {
  if (_cache) return _cache;

  const raw = readRegistryDir();
  const plugins = await Promise.all(
    raw.map(async (rp): Promise<Plugin> => {
      const npm = await fetchNpmData(rp.npmPackage);
      return {
        id: rp.npmPackage,
        slug: rp.npmPackage,
        name: rp.name,
        npmPackage: rp.npmPackage,
        description: rp.description,
        category: rp.category,
        author: {
          name: rp.author,
          url: `https://github.com/${rp.author}`,
        },
        installs: npm.weeklyDownloads,
        version: npm.version,
        capabilities: rp.capabilities,
        sourceRepo: rp.sourceRepo,
        installCommand: `bunx opencode plugin add ${rp.npmPackage}`,
        submittedAt: rp.submittedAt,
      };
    }),
  );

  _cache = plugins;
  return plugins;
}

export async function getPluginBySlug(slug: string): Promise<Plugin | undefined> {
  const plugins = await getPlugins();
  return plugins.find((p) => p.slug === slug);
}
