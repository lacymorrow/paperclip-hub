import { describe, expect, it } from "vitest";
import { getInstallCommand, isPluginManifest } from "../../../src/lib/install-command.ts";

describe("getInstallCommand", () => {
  it("uses plugin install for plugins", () => {
    expect(getInstallCommand("plugin", "@acme/foo")).toBe(
      "npx paperclipai@latest plugin install @acme/foo"
    );
  });
  it("uses adapter install with a payload for adapters", () => {
    expect(getInstallCommand("adapter", "@acme/adapter")).toBe(
      `npx paperclipai@latest adapter install --payload-json '{"packageName":"@acme/adapter"}'`
    );
  });
  it("has no command for libraries and SDKs", () => {
    expect(getInstallCommand("library", "@paperclipai/plugin-sdk")).toBeNull();
  });
});

describe("isPluginManifest", () => {
  it("accepts a plugin manifest shape", () => {
    expect(isPluginManifest({ id: "a.b", apiVersion: 1, entrypoints: { worker: "./w.js" } })).toBe(
      true
    );
  });
  it("rejects things that are not plugin manifests", () => {
    expect(isPluginManifest({ name: "sdk" })).toBe(false);
    expect(isPluginManifest(null)).toBe(false);
  });
});
