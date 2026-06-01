#!/usr/bin/env bun
/**
 * Manifest extractor CLI. Two modes:
 *
 *   bun scripts/registry/extract-manifest.ts --package <name> --version <ver>
 *     Extracts a single manifest at a specific version. Writes the result to
 *     registry/manifests/{slug}.json (or to stdout with --stdout). Used at
 *     PR time to generate the locked manifest for review.
 *
 *   bun scripts/registry/extract-manifest.ts --refresh
 *     For each registry/plugins/*.json: read the stored version from the
 *     matching manifest file, compare to npm dist-tags.latest, and only
 *     re-extract if there's a newer version. Used by the nightly build
 *     workflow. Failures are logged and the stored manifest is left
 *     untouched — the stored manifest IS the fallback.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { ExtractionError, extractManifestAtVersion } from "./lib/extract.ts";
import { fetchPackumentLite } from "./lib/npm.ts";
import { npmPackageToSlug } from "./lib/slug.ts";

const REGISTRY_PLUGINS_DIR = "registry/plugins";
const REGISTRY_MANIFESTS_DIR = "registry/manifests";

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

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      package: { type: "string" },
      version: { type: "string" },
      refresh: { type: "boolean", default: false },
      stdout: { type: "boolean", default: false },
    },
  });

  if (values.refresh) {
    await runRefresh();
    return;
  }

  if (!values.package) throw new Error("--package <name> is required (or use --refresh)");
  const version = values.version ?? (await resolveLatest(values.package));
  const { manifest } = await extractManifestAtVersion(values.package, version);
  const stored: StoredManifest = {
    npmPackage: values.package,
    version,
    manifest,
    resolvedAt: new Date().toISOString(),
  };
  const out = `${JSON.stringify(stored, null, 2)}\n`;
  if (values.stdout) {
    process.stdout.write(out);
    return;
  }
  const slug = npmPackageToSlug(values.package);
  ensureDir(REGISTRY_MANIFESTS_DIR);
  writeFileSync(join(REGISTRY_MANIFESTS_DIR, `${slug}.json`), out);
  console.log(`extracted ${values.package}@${version} → ${REGISTRY_MANIFESTS_DIR}/${slug}.json`);
}

async function resolveLatest(npmPackage: string): Promise<string> {
  const packument = await fetchPackumentLite(npmPackage);
  if (!packument) throw new Error(`package not found on npm: ${npmPackage}`);
  const latest = packument.distTags.latest;
  if (!latest) throw new Error(`package ${npmPackage} has no dist-tags.latest`);
  return latest;
}

async function runRefresh(): Promise<void> {
  ensureDir(REGISTRY_MANIFESTS_DIR);
  const entries = listPointerEntries();
  let updated = 0;
  let unchanged = 0;
  const failures: { slug: string; reason: string }[] = [];

  for (const { slug, pointer } of entries) {
    const stored = readStored(slug);
    try {
      const packument = await fetchPackumentLite(pointer.npmPackage);
      if (!packument) {
        failures.push({ slug, reason: `package ${pointer.npmPackage} returns 404 on npm` });
        continue;
      }
      const latest = packument.distTags.latest;
      if (!latest) {
        failures.push({ slug, reason: `${pointer.npmPackage} has no dist-tags.latest` });
        continue;
      }
      if (stored && stored.version === latest) {
        unchanged += 1;
        continue;
      }
      const { manifest } = await extractManifestAtVersion(pointer.npmPackage, latest);
      const out: StoredManifest = {
        npmPackage: pointer.npmPackage,
        version: latest,
        manifest,
        resolvedAt: new Date().toISOString(),
      };
      writeFileSync(
        join(REGISTRY_MANIFESTS_DIR, `${slug}.json`),
        `${JSON.stringify(out, null, 2)}\n`
      );
      updated += 1;
      console.log(`refreshed ${pointer.npmPackage}@${latest} → ${slug}`);
    } catch (err) {
      const message = err instanceof ExtractionError ? err.message : (err as Error).message;
      failures.push({ slug, reason: message });
      console.warn(`skipped ${pointer.npmPackage}: ${message}`);
    }
  }

  console.log(
    `\nrefresh summary: ${updated} updated, ${unchanged} unchanged, ${failures.length} failed`
  );
  if (failures.length > 0) {
    console.log("\nfailures (stored manifest left in place):");
    for (const f of failures) console.log(`  - ${f.slug}: ${f.reason}`);
  }
}

function listPointerEntries(): { slug: string; pointer: PointerEntry }[] {
  if (!existsSync(REGISTRY_PLUGINS_DIR)) return [];
  return readdirSync(REGISTRY_PLUGINS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      const slug = file.replace(/\.json$/, "");
      const pointer = JSON.parse(
        readFileSync(join(REGISTRY_PLUGINS_DIR, file), "utf8")
      ) as PointerEntry;
      return { slug, pointer };
    });
}

function readStored(slug: string): StoredManifest | null {
  const path = join(REGISTRY_MANIFESTS_DIR, `${slug}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as StoredManifest;
  } catch {
    return null;
  }
}

function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

await main();
