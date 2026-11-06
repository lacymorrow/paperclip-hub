import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultMetadata } from "../metadata";
import { siteConfig } from "../site-config";

/**
 * The site is named "Paperclip Hub". cliphub.fyi is only the domain, and the
 * name is what ties the site to Paperclip in search. "Clip Hub" / "ClipHub"
 * must never reach a person, so this fails the build if either creeps back in.
 */
const FORBIDDEN = /\bclip[\s_-]?hub\b/i;

// Lowercase, no separator: the project slug, db name, Vercel project, umami
// event names, and the domain itself. All machine identifiers, all allowed.
const ALLOWED = /^cliphub$/;

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".css", ".md", ".mdx"];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
      continue;
    }
    if (SOURCE_EXTENSIONS.some((ext) => entry.endsWith(ext))) out.push(full);
  }
  return out;
}

/** Strip the places the identifier legitimately appears: urls, emails, imports. */
function stripMachineRefs(line: string): string {
  return line
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\S+@\S+/g, "")
    .replace(/cliphub\.fyi/g, "")
    .replace(/["'`]cliphub["'`]/g, "");
}

describe("branding", () => {
  it('names the site "Paperclip Hub"', () => {
    expect(siteConfig.name).toBe("Paperclip Hub");
    expect(siteConfig.title).toBe("Paperclip Hub");
    expect(siteConfig.branding.projectName).toBe("Paperclip Hub");
  });

  it("appends the brand to page titles, not the tagline", () => {
    const title = defaultMetadata.title;
    expect(typeof title === "object" && title !== null && "template" in title).toBe(true);
    const template = (title as { template: string }).template;
    expect(template).toBe("%s | Paperclip Hub");
    expect(template).not.toContain(siteConfig.tagline);
  });

  it('never writes "Clip Hub" or "ClipHub" in user-facing source', () => {
    const offenders: string[] = [];
    const files = [...sourceFiles("src"), ...sourceFiles("public")].filter(
      (f) => !f.endsWith(join("__tests__", "branding.test.ts"))
    );
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        const match = FORBIDDEN.exec(stripMachineRefs(line));
        if (!match || ALLOWED.test(match[0])) return;
        offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(offenders, `Use "Paperclip Hub":\n${offenders.join("\n")}`).toEqual([]);
  });
});
