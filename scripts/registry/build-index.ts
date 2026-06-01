#!/usr/bin/env bun
/**
 * Build the public plugins.json artifact from the committed pointers and
 * stored manifests, enriched with live npm download stats. Output goes to
 * public/plugins.json so Vercel serves it at https://cliphub.fyi/plugins.json
 * during the same build that produces the site.
 *
 *   bun scripts/registry/build-index.ts
 *
 * This script does NOT re-extract manifests from npm; that's the refresh
 * workflow's job. Build is fast and deterministic given the committed state.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchPackumentLite, fetchWeeklyDownloads } from "./lib/npm.ts";

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

interface BuiltPlugin {
  slug: string;
  npmPackage: string;
  addedBy: string;
  category: string;
  sourceRepo?: string;
  version: string;
  latestVersion: string;
  manifest: Record<string, unknown>;
  installs: number;
  installCommand: string;
  resolvedAt: string;
}

interface BuiltIndex {
  $schema: string;
  generatedAt: string;
  plugins: BuiltPlugin[];
  quarantined: { slug: string; reason: string }[];
}

async function main(): Promise<void> {
  const pointers = readPointers();
  const builtPlugins: BuiltPlugin[] = [];
  const quarantined: { slug: string; reason: string }[] = [];

  await Promise.all(
    pointers.map(async ({ slug, pointer }) => {
      const stored = readStoredManifest(slug);
      if (!stored) {
        quarantined.push({
          slug,
          reason: "no registry/manifests/{slug}.json — run extract-manifest",
        });
        return;
      }
      let latestVersion = stored.version;
      let installs = 0;
      try {
        const packument = await fetchPackumentLite(pointer.npmPackage);
        if (!packument) {
          quarantined.push({
            slug,
            reason: `npm 404: ${pointer.npmPackage} is no longer published on registry.npmjs.org`,
          });
          return;
        }
        latestVersion = packument.distTags.latest ?? stored.version;
        installs = await fetchWeeklyDownloads(pointer.npmPackage);
      } catch (err) {
        console.warn(`[build-index] enrichment failed for ${slug}: ${(err as Error).message}`);
      }
      builtPlugins.push({
        slug,
        npmPackage: pointer.npmPackage,
        addedBy: pointer.addedBy,
        category: pointer.category,
        sourceRepo: pointer.sourceRepo,
        version: stored.version,
        latestVersion,
        manifest: stored.manifest,
        installs,
        installCommand: `npx paperclipai@latest plugin install ${pointer.npmPackage}`,
        resolvedAt: stored.resolvedAt,
      });
    })
  );

  builtPlugins.sort((a, b) => b.installs - a.installs);

  const out: BuiltIndex = {
    $schema: "https://cliphub.fyi/registry/index.schema.json",
    generatedAt: new Date().toISOString(),
    plugins: builtPlugins,
    quarantined,
  };

  if (!existsSync("public")) mkdirSync("public", { recursive: true });
  writeFileSync("public/plugins.json", `${JSON.stringify(out, null, 2)}\n`);
  console.log(
    `built public/plugins.json — ${builtPlugins.length} plugins, ${quarantined.length} quarantined`
  );
}

function readPointers(): { slug: string; pointer: PointerEntry }[] {
  if (!existsSync("registry/plugins")) return [];
  return readdirSync("registry/plugins")
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      const slug = file.replace(/\.json$/, "");
      const pointer = JSON.parse(
        readFileSync(join("registry/plugins", file), "utf8")
      ) as PointerEntry;
      return { slug, pointer };
    });
}

function readStoredManifest(slug: string): StoredManifest | null {
  const path = join("registry/manifests", `${slug}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as StoredManifest;
  } catch {
    return null;
  }
}

await main();
