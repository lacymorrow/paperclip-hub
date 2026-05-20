import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "@/data/plugins";

function toSlug(npmPackage: string): string {
  return npmPackage.replace(/^@/, "").replace(/\//g, "-");
}

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

async function fetchNpmData(
  npmPackage: string
): Promise<{ version: string; weeklyDownloads: number }> {
  try {
    const encoded = encodeURIComponent(npmPackage);
    const [regRes, dlRes] = await Promise.all([
      fetch(`https://registry.npmjs.org/${encoded}/latest`, { next: { revalidate: 3600 } }),
      fetch(`https://api.npmjs.org/downloads/point/last-week/${encoded}`, {
        next: { revalidate: 3600 },
      }),
    ]);
    const version = regRes.ok ? ((await regRes.json()) as { version: string }).version : "unknown";
    const weeklyDownloads = dlRes.ok
      ? ((await dlRes.json()) as { downloads: number }).downloads
      : 0;
    return { version, weeklyDownloads };
  } catch {
    return { version: "unknown", weeklyDownloads: 0 };
  }
}

function readRegistryDir(): RegistryPlugin[] {
  const dir = join(process.cwd(), "registry", "plugins");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .flatMap((file) => {
      try {
        return [JSON.parse(readFileSync(join(dir, file), "utf-8")) as RegistryPlugin];
      } catch {
        console.warn(`[registry] skipping malformed file: ${file}`);
        return [];
      }
    });
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
        slug: toSlug(rp.npmPackage),
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
        installCommand: `paperclip plugin add ${rp.npmPackage}`,
        submittedAt: rp.submittedAt,
      };
    })
  );

  _cache = plugins;
  return plugins;
}

export async function getPluginBySlug(slug: string): Promise<Plugin | undefined> {
  const plugins = await getPlugins();
  return plugins.find((p) => p.slug === slug);
}
