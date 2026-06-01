/**
 * SSRF defenses: every npm helper validates the package name before any URL
 * is constructed, and tarball fetches refuse non-allowlisted hosts. Verifies
 * the validation rejects shapes a malicious file could try to inject.
 */

import { describe, expect, it } from "vitest";
import { fetchPackumentLite, fetchTarball, fetchVersionInfo, fetchWeeklyDownloads } from "../lib/npm.ts";

describe("npm package-name validation", () => {
  it.each([
    ["with slash injection", "evil/../../admin"],
    ["with absolute URL", "https://evil.example/x"],
    ["with newline", "x\nhost: evil"],
    ["with uppercase", "MyPackage"],
    ["empty", ""],
    ["with space", "my package"],
  ])("rejects %s", async (_label, bad) => {
    await expect(fetchPackumentLite(bad)).rejects.toThrow(/invalid npm package/i);
    await expect(fetchVersionInfo(bad, "1.0.0")).rejects.toThrow(/invalid npm package/i);
  });

  it("fetchWeeklyDownloads returns 0 on invalid name without throwing", async () => {
    await expect(fetchWeeklyDownloads("not a name")).resolves.toBe(0);
  });
});

describe("tarball host allowlist", () => {
  it("refuses a tarball URL outside the allowlist", async () => {
    await expect(fetchTarball("https://evil.example.com/pkg.tgz")).rejects.toThrow(
      /non-allowlisted host/,
    );
  });

  it("refuses non-https schemes via the URL parse", async () => {
    await expect(fetchTarball("http://registry.npmjs.org/x.tgz")).rejects.toThrow();
  });
});
