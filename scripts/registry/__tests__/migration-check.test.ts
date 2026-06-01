/**
 * Sanity check: every migrated registry entry validates against the slim
 * pointer schema, and every migrated manifest validates against the manifest
 * schema. Catches drift if someone hand-edits an entry.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compileSchema, formatErrors } from "../lib/schema.ts";
import { npmPackageToSlug } from "../lib/slug.ts";

describe("registry entries pass schema validation", () => {
  it("every registry/plugins/*.json validates against the slim pointer schema", () => {
    const validate = compileSchema("registry/schema.json");
    const dir = "registry/plugins";
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
      const ok = validate(data);
      if (!ok) {
        throw new Error(`${file} failed schema:\n${formatErrors(validate)}`);
      }
    }
  });

  it("every registry/manifests/*.json validates against the manifest schema", () => {
    const validate = compileSchema("registry/manifest.schema.json");
    const dir = "registry/manifests";
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const stored = JSON.parse(readFileSync(join(dir, file), "utf8"));
      expect(stored.npmPackage).toBeTruthy();
      expect(stored.version).toBeTruthy();
      const ok = validate(stored.manifest);
      if (!ok) {
        throw new Error(`${file} manifest failed schema:\n${formatErrors(validate)}`);
      }
    }
  });

  it("every pointer has a corresponding manifest", () => {
    const pointers = readdirSync("registry/plugins").filter((f) => f.endsWith(".json"));
    const manifests = new Set(readdirSync("registry/manifests").filter((f) => f.endsWith(".json")));
    for (const p of pointers) {
      expect(manifests.has(p), `missing registry/manifests/${p}`).toBe(true);
    }
  });

  it("every manifest has a corresponding pointer", () => {
    const pointers = new Set(readdirSync("registry/plugins").filter((f) => f.endsWith(".json")));
    const manifests = readdirSync("registry/manifests").filter((f) => f.endsWith(".json"));
    for (const m of manifests) {
      expect(pointers.has(m), `orphan registry/manifests/${m}`).toBe(true);
    }
  });

  it("every pointer filename matches npmPackageToSlug(npmPackage)", () => {
    const dir = "registry/plugins";
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const slug = file.replace(/\.json$/, "");
      const data = JSON.parse(readFileSync(join(dir, file), "utf8")) as { npmPackage: string };
      const expected = npmPackageToSlug(data.npmPackage);
      expect(slug, `${file}: filename should be ${expected}.json for npmPackage ${data.npmPackage}`).toBe(
        expected,
      );
    }
  });

  it("each stored manifest's npmPackage equals the corresponding pointer's npmPackage", () => {
    const files = readdirSync("registry/plugins").filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const pointer = JSON.parse(readFileSync(join("registry/plugins", file), "utf8")) as {
        npmPackage: string;
      };
      const stored = JSON.parse(readFileSync(join("registry/manifests", file), "utf8")) as {
        npmPackage: string;
      };
      expect(stored.npmPackage, `${file}: manifest npmPackage mismatch`).toBe(pointer.npmPackage);
    }
  });
});
