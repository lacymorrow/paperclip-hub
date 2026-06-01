/**
 * Individual validation checks. Each check is a pure async function that
 * takes a typed input and returns a `CheckResult`. The check functions
 * never throw — failures are reported via `CheckResult.errors`. This makes
 * the orchestrator (`validate-pr.ts`) simple and lets us collect every
 * failure at once instead of bailing on the first.
 */

import { existsSync, readFileSync } from "node:fs";
import { ExtractionError, extractManifestAtVersion } from "./extract.ts";
import { fetchPackumentLite } from "./npm.ts";
import { compileSchema, formatErrors } from "./schema.ts";
import { npmPackageToSlug } from "./slug.ts";

export interface CheckResult {
  check: string;
  ok: boolean;
  errors: string[];
  warnings?: string[];
}

const PLUGIN_DIR = "registry/plugins";
const MANIFEST_DIR = "registry/manifests";
const TYPOSQUAT_MIN_DISTANCE = 3;
const MIN_ACCOUNT_AGE_DAYS = 30;

export interface PointerEntry {
  $schema?: string;
  npmPackage: string;
  addedBy: string;
  category: string;
  sourceRepo?: string;
}

export interface StoredManifest {
  npmPackage: string;
  version: string;
  manifest: Record<string, unknown>;
  resolvedAt: string;
}

export interface ChangedRegistryFiles {
  addedPointers: string[];
  modifiedPointers: string[];
  addedManifests: string[];
  modifiedManifests: string[];
  deletedPointers: string[];
  deletedManifests: string[];
  other: string[];
}

/**
 * Classify `git diff` paths into the buckets the checks care about.
 */
export function classifyChanges(files: { status: string; path: string }[]): ChangedRegistryFiles {
  const out: ChangedRegistryFiles = {
    addedPointers: [],
    modifiedPointers: [],
    addedManifests: [],
    modifiedManifests: [],
    deletedPointers: [],
    deletedManifests: [],
    other: [],
  };
  for (const { status, path } of files) {
    if (path.startsWith(`${PLUGIN_DIR}/`) && path.endsWith(".json")) {
      if (status === "A") out.addedPointers.push(path);
      else if (status === "D") out.deletedPointers.push(path);
      else out.modifiedPointers.push(path);
    } else if (path.startsWith(`${MANIFEST_DIR}/`) && path.endsWith(".json")) {
      if (status === "A") out.addedManifests.push(path);
      else if (status === "D") out.deletedManifests.push(path);
      else out.modifiedManifests.push(path);
    } else {
      out.other.push(path);
    }
  }
  return out;
}

/**
 * Every changed pointer must parse and validate against the slim pointer
 * schema in registry/schema.json.
 */
export function checkSchema(changes: ChangedRegistryFiles): CheckResult {
  const validate = compileSchema("registry/schema.json");
  const errors: string[] = [];
  for (const file of [...changes.addedPointers, ...changes.modifiedPointers]) {
    try {
      const data = JSON.parse(readFileSync(file, "utf8"));
      if (!validate(data)) {
        errors.push(`${file}:\n${formatErrors(validate)}`);
      }
    } catch (err) {
      errors.push(`${file}: parse failed — ${(err as Error).message}`);
    }
  }
  return { check: "schema", ok: errors.length === 0, errors };
}

/**
 * Filename without `.json` must equal the slug derived from `npmPackage`
 * (with the `@scope/` prefix stripped, matching `npmPackageToSlug`).
 */
export function checkFilename(changes: ChangedRegistryFiles): CheckResult {
  const errors: string[] = [];
  for (const file of [...changes.addedPointers, ...changes.modifiedPointers]) {
    try {
      const data = JSON.parse(readFileSync(file, "utf8")) as PointerEntry;
      const expected = npmPackageToSlug(data.npmPackage);
      const actual = file.replace(`${PLUGIN_DIR}/`, "").replace(/\.json$/, "");
      if (expected !== actual) {
        errors.push(
          `${file}: filename "${actual}.json" does not match npmPackage slug "${expected}.json"`
        );
      }
    } catch {
      // schema check will catch parse failures
    }
  }
  return { check: "filename", ok: errors.length === 0, errors };
}

/**
 * Added pointers cannot shadow existing slugs. Modifications must target a
 * file that already exists on the base branch.
 */
export function checkCollision(
  changes: ChangedRegistryFiles,
  allExistingPointers: Set<string>
): CheckResult {
  const errors: string[] = [];
  // Files in addedPointers came from git diff against base, so they're new
  // only if they aren't present in `allExistingPointers` (which lists
  // pointers present BEFORE the PR's changes — see validate-pr.ts).
  for (const file of changes.addedPointers) {
    if (allExistingPointers.has(file)) {
      errors.push(`${file}: claims to be a new entry but already exists in base branch`);
    }
  }
  return { check: "collision", ok: errors.length === 0, errors };
}

/**
 * Each PR touches at most one pointer + (optionally) the matching manifest.
 * PRs that modify multiple plugins require a maintainer label.
 */
export function checkSingleFile(changes: ChangedRegistryFiles, prLabels: string[]): CheckResult {
  const touched = new Set<string>();
  for (const file of [
    ...changes.addedPointers,
    ...changes.modifiedPointers,
    ...changes.deletedPointers,
  ]) {
    touched.add(file.replace(`${PLUGIN_DIR}/`, "").replace(/\.json$/, ""));
  }
  for (const file of [
    ...changes.addedManifests,
    ...changes.modifiedManifests,
    ...changes.deletedManifests,
  ]) {
    touched.add(file.replace(`${MANIFEST_DIR}/`, "").replace(/\.json$/, ""));
  }
  if (touched.size > 1 && !prLabels.includes("multi-plugin-pr")) {
    return {
      check: "single-file",
      ok: false,
      errors: [
        `PR touches ${touched.size} plugins (${[...touched].join(", ")}). Open a separate PR per plugin, or add the \`multi-plugin-pr\` label if intentional.`,
      ],
    };
  }
  return { check: "single-file", ok: true, errors: [] };
}

/**
 * Every npm package referenced by an added/modified pointer must resolve.
 */
export async function checkNpmExists(changes: ChangedRegistryFiles): Promise<CheckResult> {
  const errors: string[] = [];
  for (const file of [...changes.addedPointers, ...changes.modifiedPointers]) {
    try {
      const data = JSON.parse(readFileSync(file, "utf8")) as PointerEntry;
      const packument = await fetchPackumentLite(data.npmPackage);
      if (!packument) {
        errors.push(`${file}: npm package ${data.npmPackage} returned 404 on registry.npmjs.org`);
        continue;
      }
      if (!packument.distTags.latest) {
        errors.push(`${file}: npm package ${data.npmPackage} has no dist-tags.latest`);
      }
    } catch (err) {
      errors.push(`${file}: npm lookup failed — ${(err as Error).message}`);
    }
  }
  return { check: "npm-exists", ok: errors.length === 0, errors };
}

/**
 * PR author must equal `addedBy` AND be listed as an npm maintainer of the
 * package, OR a hub maintainer must apply the `submitted-on-behalf` label.
 */
export async function checkOwnership(
  changes: ChangedRegistryFiles,
  prAuthor: string,
  prLabels: string[]
): Promise<CheckResult> {
  const errors: string[] = [];
  const onBehalf = prLabels.includes("submitted-on-behalf");
  for (const file of [...changes.addedPointers, ...changes.modifiedPointers]) {
    try {
      const data = JSON.parse(readFileSync(file, "utf8")) as PointerEntry;
      if (onBehalf) continue;
      if (data.addedBy.toLowerCase() !== prAuthor.toLowerCase()) {
        errors.push(
          `${file}: addedBy "${data.addedBy}" must match PR author "${prAuthor}". (Or add label \`submitted-on-behalf\`.)`
        );
      }
      const packument = await fetchPackumentLite(data.npmPackage);
      if (!packument) continue; // npm-exists check will flag this
      const maintainers = packument.maintainers.map((m) => m.name.toLowerCase());
      if (!maintainers.includes(prAuthor.toLowerCase())) {
        errors.push(
          `${file}: PR author "${prAuthor}" is not listed as an npm maintainer of ${data.npmPackage}. Maintainers on npm: ${maintainers.join(", ") || "(none)"}. (Or add label \`submitted-on-behalf\`.)`
        );
      }
    } catch (err) {
      errors.push(`${file}: ownership check failed — ${(err as Error).message}`);
    }
  }
  return { check: "ownership", ok: errors.length === 0, errors };
}

/**
 * PR author's GitHub account must be at least MIN_ACCOUNT_AGE_DAYS old.
 * Anti-spam gate that matches Obsidian's submission policy.
 */
export async function checkAccountAge(prAuthor: string): Promise<CheckResult> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(prAuthor)}`, {
      headers: { "User-Agent": "paperclip-hub-validator/1.0" },
    });
    if (!res.ok) {
      return {
        check: "account-age",
        ok: false,
        errors: [`could not fetch GitHub account for "${prAuthor}" (status ${res.status})`],
      };
    }
    const body = (await res.json()) as { created_at?: string };
    if (!body.created_at) {
      return {
        check: "account-age",
        ok: false,
        errors: [`GitHub account "${prAuthor}" has no created_at`],
      };
    }
    const ageMs = Date.now() - Date.parse(body.created_at);
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < MIN_ACCOUNT_AGE_DAYS) {
      return {
        check: "account-age",
        ok: false,
        errors: [
          `GitHub account "${prAuthor}" is ${Math.floor(ageDays)} days old; minimum is ${MIN_ACCOUNT_AGE_DAYS}.`,
        ],
      };
    }
    return { check: "account-age", ok: true, errors: [] };
  } catch (err) {
    return {
      check: "account-age",
      ok: false,
      errors: [`account-age check failed: ${(err as Error).message}`],
    };
  }
}

/**
 * Reject new entries whose slug is < TYPOSQUAT_MIN_DISTANCE Levenshtein
 * edits from any existing slug. Maintainer can override with a label.
 */
export function checkTyposquat(
  changes: ChangedRegistryFiles,
  allExistingPointers: Set<string>,
  prLabels: string[]
): CheckResult {
  if (prLabels.includes("confirmed-not-typosquat")) {
    return { check: "typosquat", ok: true, errors: [] };
  }
  const existingSlugs = [...allExistingPointers].map((p) =>
    p.replace(`${PLUGIN_DIR}/`, "").replace(/\.json$/, "")
  );
  const errors: string[] = [];
  for (const file of changes.addedPointers) {
    const slug = file.replace(`${PLUGIN_DIR}/`, "").replace(/\.json$/, "");
    for (const existing of existingSlugs) {
      if (existing === slug) continue;
      const dist = levenshtein(slug, existing);
      if (dist < TYPOSQUAT_MIN_DISTANCE) {
        errors.push(
          `new slug "${slug}" is only ${dist} edits from existing "${existing}". If this is intentional, add label \`confirmed-not-typosquat\`.`
        );
        break;
      }
    }
  }
  return { check: "typosquat", ok: errors.length === 0, errors };
}

/**
 * If a PR commits a manifest file, re-extract from npm and assert byte-
 * identical match. Prevents a bad actor from committing a manifest that
 * doesn't match what npm actually serves.
 */
export async function checkManifestMatch(changes: ChangedRegistryFiles): Promise<CheckResult> {
  const errors: string[] = [];
  for (const file of [...changes.addedManifests, ...changes.modifiedManifests]) {
    try {
      const stored = JSON.parse(readFileSync(file, "utf8")) as StoredManifest;
      if (!stored.npmPackage || !stored.version) {
        errors.push(`${file}: missing npmPackage or version field`);
        continue;
      }
      const { manifest: fresh } = await extractManifestAtVersion(stored.npmPackage, stored.version);
      if (JSON.stringify(fresh) !== JSON.stringify(stored.manifest)) {
        errors.push(
          `${file}: committed manifest does not match what extract-manifest would produce for ${stored.npmPackage}@${stored.version}. Did the npm tarball change, or was the committed JSON edited by hand?`
        );
      }
    } catch (err) {
      if (err instanceof ExtractionError) {
        errors.push(`${file}: re-extraction failed — ${err.message}`);
      } else {
        errors.push(`${file}: manifest-match check failed — ${(err as Error).message}`);
      }
    }
  }
  return { check: "manifest-match", ok: errors.length === 0, errors };
}

/**
 * For each new pointer, extract the manifest at npm latest and return it
 * (used to post the extracted manifest as a PR comment for review).
 */
export async function extractForReview(
  changes: ChangedRegistryFiles
): Promise<
  { slug: string; npmPackage: string; version: string; manifest: Record<string, unknown> }[]
> {
  const out: {
    slug: string;
    npmPackage: string;
    version: string;
    manifest: Record<string, unknown>;
  }[] = [];
  for (const file of changes.addedPointers) {
    try {
      const data = JSON.parse(readFileSync(file, "utf8")) as PointerEntry;
      const packument = await fetchPackumentLite(data.npmPackage);
      if (!packument?.distTags.latest) continue;
      const { version, manifest } = await extractManifestAtVersion(
        data.npmPackage,
        packument.distTags.latest
      );
      out.push({
        slug: npmPackageToSlug(data.npmPackage),
        npmPackage: data.npmPackage,
        version,
        manifest,
      });
    } catch {
      // don't fail validation just because extract-for-review failed;
      // the manifest-match check on a separate commit will catch real issues
    }
  }
  return out;
}

/**
 * Read all existing pointer paths from the base branch. Used by collision
 * and typosquat checks. Falls back to current working tree if `baseRef`
 * isn't available (e.g., local runs).
 */
export function listAllExistingPointers(baseTreePaths: string[] | null): Set<string> {
  if (baseTreePaths) return new Set(baseTreePaths);
  if (!existsSync(PLUGIN_DIR)) return new Set();
  const { readdirSync } = require("node:fs");
  return new Set(
    (readdirSync(PLUGIN_DIR) as string[])
      .filter((f) => f.endsWith(".json"))
      .map((f) => `${PLUGIN_DIR}/${f}`)
  );
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length];
}
