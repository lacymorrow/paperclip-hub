#!/usr/bin/env bun
/**
 * One-off migration: convert the old full-metadata registry entries into
 * pointer + extracted manifest pairs. Run once during the refactor PR.
 *
 *   bun scripts/registry/migrate.ts
 *
 * For each existing entry in registry/plugins/*.json:
 *   - If the npm package has paperclipPlugin.manifest: rewrite as pointer,
 *     extract manifest, write registry/manifests/{slug}.json.
 *   - Otherwise: report and skip (the entry stays unchanged for the migrator
 *     to delete manually).
 *
 * The pointer keeps `category` from the old entry (hub-curated metadata) and
 * `sourceRepo` if present. Everything else moves into the extracted manifest.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ExtractionError, extractManifestAtVersion } from "./lib/extract.ts";
import { fetchPackumentLite } from "./lib/npm.ts";

interface LegacyEntry {
  name?: string;
  npmPackage: string;
  description?: string;
  category: string;
  capabilities?: string[];
  sourceRepo?: string;
  author?: string;
  submittedAt?: string;
}

interface PointerEntry {
  $schema: string;
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
  const files = readdirSync("registry/plugins").filter((f) => f.endsWith(".json"));
  let migrated = 0;
  const skipped: { slug: string; reason: string }[] = [];

  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    const legacy = JSON.parse(readFileSync(join("registry/plugins", file), "utf8")) as LegacyEntry;
    if (!legacy.npmPackage) {
      skipped.push({ slug, reason: "no npmPackage field" });
      continue;
    }
    try {
      const packument = await fetchPackumentLite(legacy.npmPackage);
      if (!packument) {
        skipped.push({ slug, reason: `npm 404: ${legacy.npmPackage}` });
        continue;
      }
      const latest = packument.distTags.latest;
      if (!latest) {
        skipped.push({ slug, reason: "no dist-tags.latest" });
        continue;
      }
      const { version, manifest } = await extractManifestAtVersion(legacy.npmPackage, latest);

      const pointer: PointerEntry = {
        $schema: "../schema.json",
        npmPackage: legacy.npmPackage,
        addedBy: legacy.author || "lacymorrow",
        category: legacy.category,
      };
      if (legacy.sourceRepo) pointer.sourceRepo = legacy.sourceRepo;

      const stored: StoredManifest = {
        npmPackage: legacy.npmPackage,
        version,
        manifest,
        resolvedAt: legacy.submittedAt ?? new Date().toISOString(),
      };

      writeFileSync(join("registry/plugins", file), `${JSON.stringify(pointer, null, 2)}\n`);
      writeFileSync(join("registry/manifests", file), `${JSON.stringify(stored, null, 2)}\n`);
      migrated += 1;
      console.log(`migrated: ${slug} (${legacy.npmPackage}@${version})`);
    } catch (err) {
      const message = err instanceof ExtractionError ? err.message : (err as Error).message;
      skipped.push({ slug, reason: message });
      console.warn(`skipped: ${slug} — ${message}`);
    }
  }

  console.log(`\nmigration summary: ${migrated} migrated, ${skipped.length} skipped`);
  if (skipped.length > 0) {
    console.log("\nskipped entries (review and delete manually if not a real plugin):");
    for (const s of skipped) console.log(`  - ${s.slug}: ${s.reason}`);
  }
}

await main();
