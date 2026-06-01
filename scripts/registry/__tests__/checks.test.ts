/**
 * Unit tests for the per-check pure functions in lib/checks.ts. These don't
 * hit npm or git — they work directly with fabricated `ChangedRegistryFiles`
 * + file fixtures written under /tmp.
 */

import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type ChangedRegistryFiles,
  checkCollision,
  checkFilename,
  checkSchema,
  checkSingleFile,
  checkTyposquat,
  classifyChanges,
} from "../lib/checks.ts";

let originalCwd: string;
let workDir: string;

beforeEach(() => {
  originalCwd = process.cwd();
  workDir = mkdtempSync(join(tmpdir(), "ph-checks-"));
  process.chdir(workDir);
  mkdirSync("registry/plugins", { recursive: true });
  mkdirSync("registry/manifests", { recursive: true });
  // Copy the slim pointer + manifest schemas into the workdir so compileSchema can resolve them.
  writeFileSync(
    "registry/schema.json",
    JSON.stringify({
      $schema: "https://json-schema.org/draft-07/schema#",
      type: "object",
      required: ["npmPackage", "addedBy", "category"],
      additionalProperties: false,
      properties: {
        $schema: { type: "string" },
        npmPackage: { type: "string", pattern: "^(@[a-z0-9-~][a-z0-9-._~]*/)?[a-z0-9-~][a-z0-9-._~]*$" },
        addedBy: { type: "string", minLength: 1 },
        category: { type: "string", enum: ["tools", "integration", "observability"] },
        sourceRepo: { type: "string" },
      },
    }),
  );
});

afterEach(() => {
  process.chdir(originalCwd);
});

function writePointer(slug: string, fields: Record<string, unknown>): string {
  const path = `registry/plugins/${slug}.json`;
  writeFileSync(path, JSON.stringify(fields, null, 2));
  return path;
}

function makeChanges(over: Partial<ChangedRegistryFiles> = {}): ChangedRegistryFiles {
  return {
    addedPointers: [],
    modifiedPointers: [],
    addedManifests: [],
    modifiedManifests: [],
    deletedPointers: [],
    deletedManifests: [],
    other: [],
    ...over,
  };
}

describe("classifyChanges", () => {
  it("buckets pointers and manifests by add/modify/delete", () => {
    const result = classifyChanges([
      { status: "A", path: "registry/plugins/foo.json" },
      { status: "M", path: "registry/plugins/bar.json" },
      { status: "D", path: "registry/plugins/baz.json" },
      { status: "A", path: "registry/manifests/foo.json" },
      { status: "M", path: "scripts/registry/validate-pr.ts" },
    ]);
    expect(result.addedPointers).toEqual(["registry/plugins/foo.json"]);
    expect(result.modifiedPointers).toEqual(["registry/plugins/bar.json"]);
    expect(result.deletedPointers).toEqual(["registry/plugins/baz.json"]);
    expect(result.addedManifests).toEqual(["registry/manifests/foo.json"]);
    expect(result.other).toEqual(["scripts/registry/validate-pr.ts"]);
  });
});

describe("checkSchema", () => {
  it("passes a valid pointer", () => {
    writePointer("foo", { npmPackage: "foo", addedBy: "u", category: "tools" });
    const r = checkSchema(makeChanges({ addedPointers: ["registry/plugins/foo.json"] }));
    expect(r.ok).toBe(true);
  });

  it("fails on missing required field", () => {
    writePointer("foo", { npmPackage: "foo", addedBy: "u" });
    const r = checkSchema(makeChanges({ addedPointers: ["registry/plugins/foo.json"] }));
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toMatch(/category/);
  });

  it("fails on disallowed extra field", () => {
    writePointer("foo", { npmPackage: "foo", addedBy: "u", category: "tools", x: 1 });
    const r = checkSchema(makeChanges({ addedPointers: ["registry/plugins/foo.json"] }));
    expect(r.ok).toBe(false);
  });
});

describe("checkFilename", () => {
  it("passes when slug matches npmPackageToSlug(npmPackage)", () => {
    writePointer("my-plugin", { npmPackage: "@scope/my-plugin", addedBy: "u", category: "tools" });
    const r = checkFilename(makeChanges({ addedPointers: ["registry/plugins/my-plugin.json"] }));
    expect(r.ok).toBe(true);
  });

  it("fails when slug doesn't match", () => {
    writePointer("wrong-name", { npmPackage: "my-plugin", addedBy: "u", category: "tools" });
    const r = checkFilename(makeChanges({ addedPointers: ["registry/plugins/wrong-name.json"] }));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/does not match/);
  });
});

describe("checkCollision", () => {
  it("passes when new entry doesn't shadow existing", () => {
    const existing = new Set(["registry/plugins/existing.json"]);
    const r = checkCollision(makeChanges({ addedPointers: ["registry/plugins/new.json"] }), existing);
    expect(r.ok).toBe(true);
  });

  it("fails when the 'added' entry already exists in base", () => {
    const existing = new Set(["registry/plugins/already-there.json"]);
    const r = checkCollision(
      makeChanges({ addedPointers: ["registry/plugins/already-there.json"] }),
      existing,
    );
    expect(r.ok).toBe(false);
  });
});

describe("checkSingleFile", () => {
  it("passes when one plugin is touched", () => {
    const r = checkSingleFile(
      makeChanges({
        addedPointers: ["registry/plugins/a.json"],
        addedManifests: ["registry/manifests/a.json"],
      }),
      [],
    );
    expect(r.ok).toBe(true);
  });

  it("fails when multiple plugins are touched without the override label", () => {
    const r = checkSingleFile(
      makeChanges({ addedPointers: ["registry/plugins/a.json", "registry/plugins/b.json"] }),
      [],
    );
    expect(r.ok).toBe(false);
  });

  it("passes with multiple plugins when multi-plugin-pr label is applied", () => {
    const r = checkSingleFile(
      makeChanges({ addedPointers: ["registry/plugins/a.json", "registry/plugins/b.json"] }),
      ["multi-plugin-pr"],
    );
    expect(r.ok).toBe(true);
  });
});

describe("checkTyposquat", () => {
  it("flags slugs within Levenshtein 3 of an existing slug", () => {
    const existing = new Set(["registry/plugins/paperclip-plugin-discord.json"]);
    writePointer("paperclip-plugin-discrd", {
      npmPackage: "paperclip-plugin-discrd",
      addedBy: "u",
      category: "tools",
    });
    const r = checkTyposquat(
      makeChanges({ addedPointers: ["registry/plugins/paperclip-plugin-discrd.json"] }),
      existing,
      [],
    );
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/typosquat|edits/i);
  });

  it("allows close slugs when confirmed-not-typosquat label applied", () => {
    const existing = new Set(["registry/plugins/paperclip-plugin-discord.json"]);
    const r = checkTyposquat(
      makeChanges({ addedPointers: ["registry/plugins/paperclip-plugin-discrd.json"] }),
      existing,
      ["confirmed-not-typosquat"],
    );
    expect(r.ok).toBe(true);
  });

  it("passes for slugs sufficiently distant from existing", () => {
    const existing = new Set(["registry/plugins/paperclip-plugin-discord.json"]);
    const r = checkTyposquat(
      makeChanges({ addedPointers: ["registry/plugins/totally-different-name.json"] }),
      existing,
      [],
    );
    expect(r.ok).toBe(true);
  });
});
