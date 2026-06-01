/**
 * Streaming in-memory tarball reader. Reads only the files the caller asks for;
 * everything else is discarded as the stream flows past. No filesystem writes —
 * keeps the extractor's filesystem surface at zero so a malicious tarball can't
 * escape via zip-slip or symlink tricks.
 */

import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { extract as createTarExtract } from "tar-stream";

const FILE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB per file
const TOTAL_ENTRIES_MAX = 5000; // refuse pathologically large tarballs

export interface TarballFile {
  path: string;
  contents: Uint8Array;
}

/**
 * Extract files matching `accept` from an in-memory `.tgz`. Paths are
 * matched against the tar entry header with the leading `package/` prefix
 * stripped — i.e., pass `package.json` to get the package's own
 * `package.json`, not the literal entry path `package/package.json`.
 *
 * Errors at any stage of the pipeline (corrupted gzip, malformed tar, oversized
 * entries, too many entries) propagate via the rejected promise. `pipeline()`
 * attaches error handlers to every stage so a failure on one stream doesn't
 * leave the others dangling.
 */
async function readTarball(
  tarball: Uint8Array,
  accept: (path: string) => boolean
): Promise<Map<string, Uint8Array>> {
  const result = new Map<string, Uint8Array>();
  const extract = createTarExtract();
  let entryCount = 0;

  extract.on("entry", (header, entryStream, next) => {
    entryCount += 1;
    if (entryCount > TOTAL_ENTRIES_MAX) {
      entryStream.resume();
      next(new Error(`tarball has too many entries (>${TOTAL_ENTRIES_MAX})`));
      return;
    }
    // npm tarballs put everything under `package/`. Strip exactly one prefix.
    const normalized = header.name.replace(/^[^/]+\//, "");
    if (header.type !== "file" || !accept(normalized)) {
      entryStream.resume();
      next();
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    entryStream.on("data", (chunk: Buffer) => {
      size += chunk.byteLength;
      if (size > FILE_MAX_BYTES) {
        entryStream.resume();
        next(new Error(`file ${normalized} exceeds size cap (${FILE_MAX_BYTES} bytes)`));
        return;
      }
      chunks.push(chunk);
    });
    entryStream.on("end", () => {
      result.set(normalized, new Uint8Array(Buffer.concat(chunks)));
      next();
    });
    entryStream.on("error", next);
  });

  await pipeline(Readable.from([Buffer.from(tarball)]), createGunzip(), extract);
  return result;
}

/**
 * Predicate form: extract any file whose normalized path satisfies `accept`.
 * Used by the manifest extractor to grab the manifest plus any sibling
 * `.js`/`.mjs`/`.cjs` files the manifest might import from.
 */
export function readTarballFilesMatching(
  tarball: Uint8Array,
  accept: (path: string) => boolean
): Promise<Map<string, Uint8Array>> {
  return readTarball(tarball, accept);
}

/**
 * Set form: extract files matching exactly one of `paths`. Convenience wrapper
 * over the predicate form.
 */
export function readTarballFiles(
  tarball: Uint8Array,
  paths: ReadonlySet<string>
): Promise<Map<string, Uint8Array>> {
  return readTarball(tarball, (p) => paths.has(p));
}
