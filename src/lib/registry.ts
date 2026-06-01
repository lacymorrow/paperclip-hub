import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "@/data/plugins";

const PLUGINS_DIR = "registry/plugins";
const MANIFESTS_DIR = "registry/manifests";

function toSlug(npmPackage: string): string {
  return (npmPackage || "").toLowerCase().replace(/^@/, "").replace(/\//g, "-");
}

interface PointerEntry {
  npmPackage: string;
  addedBy: string;
  category: string;
  sourceRepo?: string;
}

interface StoredManifest {
  npmPackage: string;
  version: string;
  manifest: Record<string, unknown>;
  resolvedAt: string;
}

// Mirrors the npmPackage pattern in registry/schema.json. We re-validate here
// because the data crosses a file → network boundary and we want to be sure
// the URL can only ever point at api.npmjs.org with a well-formed package
// name as the path segment, even if a pointer file gets hand-edited.
const NPM_PACKAGE_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

async function fetchWeeklyDownloads(npmPackage: string): Promise<number> {
  if (!NPM_PACKAGE_NAME.test(npmPackage)) return 0;
  try {
    const encoded = npmPackage.startsWith("@")
      ? npmPackage.split("/").map(encodeURIComponent).join("/")
      : encodeURIComponent(npmPackage);
    const res = await fetch(`https://api.npmjs.org/downloads/point/last-week/${encoded}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 0;
    const body = (await res.json()) as { downloads?: number };
    return body.downloads ?? 0;
  } catch {
    return 0;
  }
}

interface RegistryRecord {
  slug: string;
  pointer: PointerEntry;
  manifest: StoredManifest | null;
}

function readRegistryRecords(): RegistryRecord[] {
  const cwd = process.cwd();
  const pluginsDir = join(cwd, PLUGINS_DIR);
  const manifestsDir = join(cwd, MANIFESTS_DIR);
  if (!existsSync(pluginsDir)) return [];
  return readdirSync(pluginsDir)
    .filter((f) => f.endsWith(".json"))
    .flatMap((file) => {
      try {
        const slug = file.replace(/\.json$/, "");
        const pointer = JSON.parse(readFileSync(join(pluginsDir, file), "utf8")) as PointerEntry;
        const manifestPath = join(manifestsDir, file);
        const manifest = existsSync(manifestPath)
          ? (JSON.parse(readFileSync(manifestPath, "utf8")) as StoredManifest)
          : null;
        return [{ slug, pointer, manifest }];
      } catch {
        console.warn(`[registry] skipping malformed file: ${file}`);
        return [];
      }
    });
}

let _cache: Plugin[] | null = null;

export async function getPlugins(): Promise<Plugin[]> {
  if (_cache) return _cache;

  const records = readRegistryRecords();
  const plugins = await Promise.all(
    records.map(async (record): Promise<Plugin> => {
      const installs = await fetchWeeklyDownloads(record.pointer.npmPackage);
      return synthesizePlugin(record, installs);
    })
  );

  _cache = plugins;
  return plugins;
}

export async function getPluginBySlug(slug: string): Promise<Plugin | undefined> {
  const plugins = await getPlugins();
  return plugins.find((p) => p.slug === slug);
}

function synthesizePlugin(record: RegistryRecord, installs: number): Plugin {
  const { pointer, manifest } = record;
  const m = manifest?.manifest as
    | { id?: string; displayName?: string; description?: string; author?: string; capabilities?: string[] }
    | undefined;
  return {
    id: m?.id ?? pointer.npmPackage,
    slug: toSlug(pointer.npmPackage),
    name: m?.displayName ?? pointer.npmPackage,
    npmPackage: pointer.npmPackage,
    description: m?.description ?? "",
    category: pointer.category,
    author: {
      name: m?.author ?? pointer.addedBy,
      url: `https://github.com/${pointer.addedBy}`,
    },
    installs,
    version: manifest?.version ?? "unknown",
    capabilities: Array.isArray(m?.capabilities) ? m.capabilities : [],
    sourceRepo: pointer.sourceRepo,
    installCommand: `npx paperclipai@latest plugin install ${pointer.npmPackage}`,
    submittedAt: manifest?.resolvedAt ?? new Date(0).toISOString(),
  };
}
