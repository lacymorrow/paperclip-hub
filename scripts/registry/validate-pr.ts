#!/usr/bin/env bun
/**
 * PR-time orchestrator. Runs every registry validator against the changes in
 * the current PR and reports the consolidated result as a PR comment. Exits
 * non-zero if any check fails.
 *
 * Environment (set by .github/workflows/pr-validate.yml):
 *   GITHUB_TOKEN, GITHUB_REPOSITORY (or REPO), PR_NUMBER, PR_AUTHOR,
 *   PR_LABELS (comma-separated), BASE_SHA, HEAD_SHA
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  type CheckResult,
  checkAccountAge,
  checkCollision,
  checkFilename,
  checkManifestMatch,
  checkNpmExists,
  checkOwnership,
  checkSchema,
  checkSingleFile,
  checkTyposquat,
  classifyChanges,
  extractForReview,
} from "./lib/checks.ts";
import { listChangedFiles } from "./lib/git.ts";
import { upsertPrComment } from "./lib/github.ts";
import { requirePrContext } from "./lib/pr-context.ts";

async function main(): Promise<void> {
  const ctx = requirePrContext();
  const changedFiles = await listChangedFiles(ctx.baseSha, ctx.headSha);
  const changes = classifyChanges(changedFiles);

  const registryTouched =
    changes.addedPointers.length +
      changes.modifiedPointers.length +
      changes.deletedPointers.length +
      changes.addedManifests.length +
      changes.modifiedManifests.length +
      changes.deletedManifests.length >
    0;

  if (!registryTouched) {
    console.log("no registry/plugins/** or registry/manifests/** changes — skipping");
    return;
  }

  const baseTreePointers = listBasePointerPaths(ctx.baseSha);
  const results: CheckResult[] = [];
  results.push(checkSchema(changes));
  results.push(checkFilename(changes));
  results.push(checkCollision(changes, baseTreePointers));
  results.push(checkSingleFile(changes, ctx.labels));
  results.push(checkTyposquat(changes, baseTreePointers, ctx.labels));
  results.push(await checkNpmExists(changes));
  results.push(await checkOwnership(changes, ctx.prAuthor, ctx.labels));
  results.push(await checkAccountAge(ctx.prAuthor));
  results.push(await checkManifestMatch(changes));

  const extracted = await extractForReview(changes);

  const allOk = results.every((r) => r.ok);
  const summary = renderSummary(results, extracted, allOk);

  console.log(summary);

  if (process.env.GITHUB_TOKEN) {
    try {
      await upsertPrComment(ctx.repo.owner, ctx.repo.name, ctx.prNumber, summary);
    } catch (err) {
      console.warn(`PR comment failed: ${(err as Error).message}`);
    }
  }

  if (!allOk) process.exit(1);
}

/**
 * List pointer files present in the base branch (i.e., before the PR's
 * changes). Used so the collision check knows what already existed and the
 * typosquat check has the full slug list to compare against.
 */
function listBasePointerPaths(baseSha: string): Set<string> {
  try {
    const out = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", baseSha, "registry/plugins/"],
      {
        encoding: "utf8",
      }
    );
    return new Set(
      out
        .split("\n")
        .map((line) => line.trim())
        .filter((p) => p.endsWith(".json"))
    );
  } catch {
    // fallback to working tree (local runs)
    if (!existsSync("registry/plugins")) return new Set();
    const { readdirSync } = require("node:fs");
    return new Set(
      (readdirSync("registry/plugins") as string[])
        .filter((f) => f.endsWith(".json"))
        .map((f) => `registry/plugins/${f}`)
    );
  }
}

function renderSummary(
  results: CheckResult[],
  extracted: {
    slug: string;
    npmPackage: string;
    version: string;
    manifest: Record<string, unknown>;
  }[],
  allOk: boolean
): string {
  const lines: string[] = [];
  lines.push(
    allOk ? "## ✅ Plugin submission checks passed" : "## ❌ Plugin submission checks failed"
  );
  lines.push("");
  for (const r of results) {
    lines.push(`- ${r.ok ? "✅" : "❌"} **${r.check}**${r.ok ? "" : ":"}`);
    for (const e of r.errors) {
      for (const line of e.split("\n")) lines.push(`  - ${line}`);
    }
  }

  if (extracted.length > 0) {
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("### Extracted manifest (for maintainer review)");
    lines.push("");
    lines.push(
      "This is the manifest that will be locked into `registry/manifests/{slug}.json` on merge."
    );
    for (const e of extracted) {
      lines.push("");
      lines.push(`#### \`${e.npmPackage}@${e.version}\``);
      lines.push("");
      lines.push("```json");
      lines.push(JSON.stringify(e.manifest, null, 2));
      lines.push("```");
    }
  }
  return lines.join("\n");
}

await main();
