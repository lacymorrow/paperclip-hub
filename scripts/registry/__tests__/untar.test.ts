/**
 * Verify untar surfaces stream errors (corrupted gzip data, malformed tar)
 * via the returned promise rather than crashing the process.
 */

import { describe, expect, it } from "vitest";
import { readTarballFilesMatching } from "../lib/untar.ts";

describe("untar error propagation", () => {
  it("rejects on invalid gzip header", async () => {
    // Random bytes that aren't a valid gzip stream
    const garbage = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0xfa, 0xce]);
    await expect(readTarballFilesMatching(garbage, () => true)).rejects.toThrow();
  });

  it("rejects on truncated gzip stream", async () => {
    // Valid gzip magic + minimal header, then truncated
    const truncated = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00]);
    await expect(readTarballFilesMatching(truncated, () => true)).rejects.toThrow();
  });
});
