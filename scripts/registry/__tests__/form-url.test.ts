/**
 * The submission form generates a prefilled GitHub web-editor URL containing
 * the pointer JSON. Verify the URL is well-formed and the embedded JSON
 * passes the slim pointer schema.
 */

import { describe, expect, it } from "vitest";
import { compileSchema, formatErrors } from "../lib/schema.ts";
import { npmPackageToSlug } from "../lib/slug.ts";

const REGISTRY_PLUGIN_PATH = "registry/plugins";

// Reimplementation of buildGitHubNewFileUrl from the form. The form is a
// "use client" React component so its module isn't easily importable in
// node tests; mirroring the function here keeps the assertion focused on
// behavior, not on the React wrapper. If the form drifts, the e2e flow
// will catch it via the validator's schema check on the resulting PR.
function buildPointerJson(data: {
  npmPackage: string;
  authorGithubHandle: string;
  category: string;
  sourceRepo?: string;
}): Record<string, unknown> {
  return {
    $schema: "../schema.json",
    npmPackage: data.npmPackage,
    addedBy: data.authorGithubHandle,
    category: data.category,
    ...(data.sourceRepo ? { sourceRepo: data.sourceRepo } : {}),
  };
}

function buildUrl(data: {
  npmPackage: string;
  authorGithubHandle: string;
  category: string;
  sourceRepo?: string;
}): URL {
  const slug = npmPackageToSlug(data.npmPackage);
  const filePath = `${REGISTRY_PLUGIN_PATH}/${slug}.json`;
  const pointer = buildPointerJson(data);
  const params = new URLSearchParams({
    filename: filePath,
    value: `${JSON.stringify(pointer, null, 2)}\n`,
    message: `feat(registry): add ${data.npmPackage}`,
    description: "Submitted via the Paperclip Hub form.",
  });
  return new URL(`https://github.com/lacymorrow/paperclip-hub/new/main?${params.toString()}`);
}

describe("submission form output", () => {
  const validate = compileSchema("registry/schema.json");

  it("produces a pointer JSON that validates against the slim schema", () => {
    const data = {
      npmPackage: "my-paperclip-plugin",
      authorGithubHandle: "octocat",
      category: "tools",
      sourceRepo: "https://github.com/octocat/my-paperclip-plugin",
    };
    const pointer = buildPointerJson(data);
    const ok = validate(pointer);
    expect(ok, formatErrors(validate)).toBe(true);
  });

  it("strips @scope/ for the filename slug", () => {
    const url = buildUrl({
      npmPackage: "@my-co/my-plugin",
      authorGithubHandle: "octocat",
      category: "integration",
    });
    expect(url.searchParams.get("filename")).toBe("registry/plugins/my-plugin.json");
  });

  it("omits sourceRepo when blank", () => {
    const pointer = buildPointerJson({
      npmPackage: "p",
      authorGithubHandle: "u",
      category: "tools",
    });
    expect(pointer).not.toHaveProperty("sourceRepo");
    expect(validate(pointer)).toBe(true);
  });

  it("produces a URL targeting github.com/lacymorrow/paperclip-hub/new/main", () => {
    const url = buildUrl({
      npmPackage: "p",
      authorGithubHandle: "u",
      category: "tools",
    });
    expect(url.origin + url.pathname).toBe("https://github.com/lacymorrow/paperclip-hub/new/main");
  });

  it("rejects URL whose pointer is missing required fields", () => {
    // Pointer missing `category` shouldn't validate
    const pointer = { $schema: "../schema.json", npmPackage: "p", addedBy: "u" };
    expect(validate(pointer)).toBe(false);
  });
});
