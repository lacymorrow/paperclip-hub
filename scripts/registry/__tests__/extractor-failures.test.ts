/**
 * Failure-mode tests for the manifest extractor. These don't hit npm; they
 * exercise the in-memory primitives (the walker, untar, schema validation)
 * directly with constructed inputs.
 */

import { describe, expect, it } from "vitest";
import { compileSchema, formatErrors } from "../lib/schema.ts";
import { extractDefaultExport, WalkerError } from "../lib/walker.ts";

describe("walker depth + node limits", () => {
  it("rejects deeply nested objects beyond MAX_DEPTH", () => {
    let src = "export default ";
    for (let i = 0; i < 60; i += 1) src += "{ a: ";
    src += '"leaf"';
    for (let i = 0; i < 60; i += 1) src += " }";
    src += ";";
    expect(() => extractDefaultExport(src)).toThrow(WalkerError);
  });

  it("rejects modules with enough resolved nodes to blow past the node cap", () => {
    // Walker bounds resolution to MAX_NODES (50k). 30k vars × 2 node-visits
    // each at resolution time (Identifier → Literal) puts us comfortably
    // over the cap.
    const decls: string[] = [];
    for (let i = 0; i < 30000; i += 1) decls.push(`var v${i} = ${i};`);
    decls.push(
      "var arr = [",
      ...Array.from({ length: 30000 }, (_, i) => `v${i}`).map((s) => `${s},`),
      "];",
      "export default { arr };",
    );
    expect(() => extractDefaultExport(decls.join(""))).toThrow(/too many AST nodes/);
  });

  it("rejects when the import resolver returns null and the identifier is referenced", () => {
    const src = `
      import { MISSING } from "./missing.js";
      export default { x: MISSING };
    `;
    expect(() => extractDefaultExport(src, () => null)).toThrow(WalkerError);
  });

  it("does not throw when an import is declared but never referenced", () => {
    const src = `
      import { UNUSED } from "./missing.js";
      export default { x: 1 };
    `;
    expect(extractDefaultExport(src, () => null)).toEqual({ x: 1 });
  });

  it("rejects re-export chains (`export { X } from './...'`) by default", () => {
    // We support `export { X } from "./foo"` only via the import-resolver path
    // when called recursively. A direct re-export chain at the top level
    // resolves to whatever the resolver returns; if the resolver returns
    // null, the chain isn't followed and the identifier is unresolved.
    const src = `
      export { X } from "./foo.js";
      var manifest = { x: X };
      export default manifest;
    `;
    expect(() => extractDefaultExport(src)).toThrow(WalkerError);
  });

  it("preserves error location info in WalkerError messages", () => {
    const src = `
      // line 2
      var bad = Math.random();
      export default { v: bad };
    `;
    try {
      extractDefaultExport(src);
      expect.fail("expected WalkerError");
    } catch (err) {
      expect(err).toBeInstanceOf(WalkerError);
      expect((err as Error).message).toMatch(/line \d+/);
    }
  });
});

describe("manifest schema validation", () => {
  const validate = compileSchema("registry/manifest.schema.json");

  it("rejects a manifest missing required apiVersion", () => {
    const ok = validate({
      id: "x",
      version: "1.0.0",
      displayName: "X",
      description: "x",
      capabilities: [],
    });
    expect(ok).toBe(false);
    expect(formatErrors(validate)).toMatch(/apiVersion/);
  });

  it("accepts a manifest with required fields", () => {
    const ok = validate({
      id: "x",
      apiVersion: 1,
      version: "1.0.0",
      displayName: "X",
      description: "x",
      capabilities: ["events.subscribe"],
    });
    expect(ok).toBe(true);
  });

  it("rejects displayName longer than the cap", () => {
    const ok = validate({
      id: "x",
      apiVersion: 1,
      version: "1.0.0",
      displayName: "a".repeat(200),
      description: "x",
      capabilities: [],
    });
    expect(ok).toBe(false);
  });
});

describe("pointer schema validation", () => {
  const validate = compileSchema("registry/schema.json");

  it("rejects an unknown category", () => {
    expect(
      validate({
        $schema: "../schema.json",
        npmPackage: "p",
        addedBy: "u",
        category: "not-real",
      }),
    ).toBe(false);
  });

  it("rejects an npm package name with uppercase letters", () => {
    expect(
      validate({
        $schema: "../schema.json",
        npmPackage: "MyPackage",
        addedBy: "u",
        category: "tools",
      }),
    ).toBe(false);
  });

  it("rejects a GitHub handle with disallowed characters", () => {
    expect(
      validate({
        $schema: "../schema.json",
        npmPackage: "p",
        addedBy: "user.name",
        category: "tools",
      }),
    ).toBe(false);
  });

  it("rejects unknown fields (additionalProperties:false)", () => {
    expect(
      validate({
        $schema: "../schema.json",
        npmPackage: "p",
        addedBy: "u",
        category: "tools",
        author: "should-not-be-here",
      }),
    ).toBe(false);
  });
});
