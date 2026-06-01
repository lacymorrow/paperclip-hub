/**
 * High-level manifest extraction: pull the npm tarball, locate the manifest
 * file via `package.json` → `paperclipPlugin.manifest`, statically resolve
 * it, and validate against the manifest schema.
 *
 * This module is the only place that combines network + parsing + validation
 * — the rest of the codebase calls `extractManifest()` and gets back either
 * a clean `{ version, manifest }` or a structured `ExtractionError`.
 */

import { posix } from "node:path";
import { fetchTarball, fetchVersionInfo } from "./npm.ts";
import { compileSchema, formatErrors } from "./schema.ts";
import { readTarballFilesMatching } from "./untar.ts";
import { extractDefaultExport, type ImportResolver, WalkerError } from "./walker.ts";

export interface ExtractedManifest {
  version: string;
  manifest: Record<string, unknown>;
}

export class ExtractionError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

export async function extractManifestAtVersion(
  npmPackage: string,
  version: string
): Promise<ExtractedManifest> {
  const versionInfo = await fetchVersionInfo(npmPackage, version);
  if (!versionInfo) {
    throw new ExtractionError("VERSION_NOT_FOUND", `${npmPackage}@${version} not found on npm`);
  }

  const manifestPathRaw = versionInfo.paperclipPlugin?.manifest;
  if (!manifestPathRaw || typeof manifestPathRaw !== "string") {
    throw new ExtractionError(
      "NO_MANIFEST_POINTER",
      `${npmPackage}@${version}: package.json missing paperclipPlugin.manifest pointer`
    );
  }

  const tarball = await fetchTarball(versionInfo.tarball);
  const manifestPath = manifestPathRaw.replace(/^\.\//, "");
  const manifestDir = posix.dirname(manifestPath);
  // Grab the manifest file plus any sibling `.js`/`.mjs`/`.cjs` in the same
  // directory subtree, so the walker can resolve `import "./constants.js"`
  // without needing a second network roundtrip.
  const files = await readTarballFilesMatching(tarball, (p) => {
    if (p === manifestPath) return true;
    if (manifestDir === "." || p.startsWith(`${manifestDir}/`)) {
      return /\.(?:m?js|cjs)$/i.test(p);
    }
    return false;
  });
  const manifestFile = files.get(manifestPath);
  if (!manifestFile) {
    throw new ExtractionError(
      "MANIFEST_FILE_MISSING",
      `${npmPackage}@${version}: paperclipPlugin.manifest points at ${manifestPath} but file is not in the tarball`
    );
  }

  const decoder = new TextDecoder();
  const source = decoder.decode(manifestFile);
  const resolveImport: ImportResolver = (specifier) => {
    for (const candidate of candidateSpecifierPaths(manifestDir, specifier)) {
      const file = files.get(candidate);
      if (file) return decoder.decode(file);
    }
    return null;
  };
  let manifest: unknown;
  try {
    manifest = extractDefaultExport(source, resolveImport);
  } catch (err) {
    if (err instanceof WalkerError) {
      throw new ExtractionError("WALKER_REJECTED", `${npmPackage}@${version}: ${err.message}`);
    }
    throw err;
  }

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new ExtractionError(
      "NOT_OBJECT",
      `${npmPackage}@${version}: default export resolved to ${Array.isArray(manifest) ? "array" : typeof manifest}, expected object`
    );
  }

  const validate = compileSchema("registry/manifest.schema.json");
  if (!validate(manifest)) {
    throw new ExtractionError(
      "SCHEMA_INVALID",
      `${npmPackage}@${version}: extracted manifest failed schema validation:\n${formatErrors(validate)}`
    );
  }

  return { version, manifest: manifest as Record<string, unknown> };
}

/**
 * Candidate paths to try when resolving a relative ESM import inside the
 * tarball. Returns the empty array for bare specifiers (e.g. `"acorn"`,
 * `"@scope/pkg"`) — those never have local files in the tarball and following
 * them would mean leaving the tarball sandbox.
 *
 * Tries `as-is`, `+.js`, `+.mjs`, `+.cjs`, and `+/index.js` to cover common
 * Node resolution shapes that tsc emits.
 */
function candidateSpecifierPaths(manifestDir: string, specifier: string): string[] {
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) return [];
  const base =
    manifestDir === "." ? specifier.replace(/^\.\//, "") : posix.join(manifestDir, specifier);
  const candidates: string[] = [base];
  if (!/\.[a-z]+$/i.test(base)) {
    candidates.push(`${base}.js`, `${base}.mjs`, `${base}.cjs`, `${base}/index.js`);
  }
  return candidates;
}
