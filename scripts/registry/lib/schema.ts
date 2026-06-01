/**
 * Ajv setup shared across validators. One Ajv instance is reused — compiling
 * a schema is cheap once but isn't free.
 *
 * Format keywords (`uri`, `date-time`, etc.) are validated via `ajv-formats`
 * so `sourceRepo: "not a url"` is rejected at schema time rather than slipping
 * past with a documentation-only hint.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AjvImport, { type ValidateFunction } from "ajv";
import addFormatsImport from "ajv-formats";

// CJS interop: both packages export defaults that get nested when imported via ESM.
// biome-ignore lint/suspicious/noExplicitAny: interop
const Ajv = ((AjvImport as any).default ?? AjvImport) as typeof AjvImport;
// biome-ignore lint/suspicious/noExplicitAny: interop
const addFormats = ((addFormatsImport as any).default ?? addFormatsImport) as typeof addFormatsImport;

// `strict: false` lets our schemas use Draft-07 `$schema` declarations even
// though Ajv 8's default draft is 2020-12. `validateSchema: false` keeps Ajv
// from trying to resolve the draft-07 meta-schema URL (the meta-schema isn't
// preloaded in Ajv 8 and we don't need it; our schemas use only features
// common to both drafts).
const ajv = new Ajv({ strict: false, allErrors: true, validateSchema: false });
addFormats(ajv);

const cache = new Map<string, ValidateFunction>();

export function compileSchema(schemaRelativePath: string): ValidateFunction {
  const absolute = resolve(process.cwd(), schemaRelativePath);
  const cached = cache.get(absolute);
  if (cached) return cached;
  const schema = JSON.parse(readFileSync(absolute, "utf8"));
  const fn = ajv.compile(schema);
  cache.set(absolute, fn);
  return fn;
}

export function formatErrors(validate: ValidateFunction): string {
  if (!validate.errors || validate.errors.length === 0) return "";
  return validate.errors
    .map((e) => `  - ${e.instancePath || "/"} ${e.message ?? ""}`.trim())
    .join("\n");
}
