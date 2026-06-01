import { describe, expect, it } from "vitest";
import { extractDefaultExport, WalkerError } from "../lib/walker.ts";

describe("walker", () => {
  it("resolves a simple object literal as the default export", () => {
    const src = `export default { id: "x", n: 1, b: true, arr: [1, 2, 3] };`;
    expect(extractDefaultExport(src)).toEqual({ id: "x", n: 1, b: true, arr: [1, 2, 3] });
  });

  it("resolves esbuild-style `export { x as default }` with var references", () => {
    const src = `
			var ID = "agent-usage";
			var manifest = { id: ID, capabilities: ["event"] };
			var manifest_default = manifest;
			export { manifest_default as default };
		`;
    expect(extractDefaultExport(src)).toEqual({ id: "agent-usage", capabilities: ["event"] });
  });

  it("resolves nested object/array/identifier references", () => {
    const src = `
			var POLL = 15;
			var CFG = { pollIntervalMinutes: POLL, providers: ["claude"] };
			export default {
				instanceConfigSchema: { properties: { x: { default: CFG.pollIntervalMinutes } } },
				jobs: [{ schedule: \`*/\${POLL} * * * *\` }],
			};
		`;
    expect(extractDefaultExport(src)).toEqual({
      instanceConfigSchema: { properties: { x: { default: 15 } } },
      jobs: [{ schedule: "*/15 * * * *" }],
    });
  });

  it("resolves member expressions on object literals", () => {
    const src = `
			var JOB_KEYS = { pollUsage: "poll-usage" };
			export default { key: JOB_KEYS.pollUsage };
		`;
    expect(extractDefaultExport(src)).toEqual({ key: "poll-usage" });
  });

  it("rejects function calls", () => {
    const src = "var x = Math.random(); export default { v: x };";
    expect(() => extractDefaultExport(src)).toThrow(WalkerError);
  });

  it("rejects new expressions", () => {
    const src = "export default { d: new Date() };";
    expect(() => extractDefaultExport(src)).toThrow(WalkerError);
  });

  it("rejects binary expressions (would be a computed value, not a literal)", () => {
    const src = "export default { sum: 1 + 1 };";
    expect(() => extractDefaultExport(src)).toThrow(WalkerError);
  });

  it("rejects spread in objects and arrays", () => {
    expect(() => extractDefaultExport("var x = { a: 1 }; export default { ...x };")).toThrow(
      WalkerError
    );
    expect(() => extractDefaultExport("var x = [1]; export default { arr: [...x] };")).toThrow(
      WalkerError
    );
  });

  it("rejects unresolved identifiers", () => {
    expect(() => extractDefaultExport("export default { v: unknownThing };")).toThrow(WalkerError);
  });

  it("rejects circular references", () => {
    const src = "var a = b; var b = a; export default a;";
    expect(() => extractDefaultExport(src)).toThrow(WalkerError);
  });

  it("rejects modules with no default export", () => {
    expect(() => extractDefaultExport("export const x = 1;")).toThrow(WalkerError);
  });

  it("rejects template literals with non-primitive expressions", () => {
    const src = "var obj = {}; export default { s: `a${obj}b` };";
    expect(() => extractDefaultExport(src)).toThrow(WalkerError);
  });

  it("handles unary minus and negation", () => {
    expect(extractDefaultExport("export default { n: -1, b: !false };")).toEqual({
      n: -1,
      b: true,
    });
  });

  it("handles a real esbuild-bundled manifest fixture", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(
      new URL("../fixtures/agent-usage-manifest.js", import.meta.url),
      "utf8"
    );
    const result = extractDefaultExport(source) as {
      id: string;
      apiVersion: number;
      capabilities: string[];
      jobs?: { schedule: string }[];
    };
    expect(result.id).toBe("paperclip-plugin-agent-usage");
    expect(result.apiVersion).toBe(1);
    expect(Array.isArray(result.capabilities)).toBe(true);
    expect(result.capabilities.length).toBeGreaterThan(5);
    const firstJob = result.jobs?.[0];
    expect(firstJob?.schedule).toBe("*/15 * * * *");
  });

  it("resolves identifiers brought in by ImportSpecifier when given a resolver", () => {
    const manifest = `
			import { ID, CAPS } from "./constants.js";
			var manifest = { id: ID, capabilities: CAPS };
			export default manifest;
		`;
    const constants = `
			export const ID = "tsc-plugin";
			export const CAPS = ["events.subscribe", "tool"];
		`;
    const result = extractDefaultExport(manifest, (spec) =>
      spec === "./constants.js" ? constants : null
    );
    expect(result).toEqual({ id: "tsc-plugin", capabilities: ["events.subscribe", "tool"] });
  });

  it("evaluates logical and conditional operators over resolved literals", () => {
    const src = `
			var a = "x";
			var b = null;
			export default {
				or: a || "fallback",
				and: a && "kept",
				nullish: b ?? "defaulted",
				ternary: a ? "yes" : "no",
			};
		`;
    expect(extractDefaultExport(src)).toEqual({
      or: "x",
      and: "kept",
      nullish: "defaulted",
      ternary: "yes",
    });
  });

  it("treats optional-chain member access on undefined as undefined", () => {
    const src = `
			var maybe = undefined;
			export default { v: maybe?.foo?.bar };
		`;
    expect(extractDefaultExport(src)).toEqual({ v: undefined });
  });
});
