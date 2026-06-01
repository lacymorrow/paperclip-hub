/**
 * Ajv setup shared across validators. One Ajv instance is reused — compiling
 * a schema is cheap once but isn't free.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AjvImport, { type ValidateFunction } from "ajv";

// CJS interop: ajv's default export is sometimes wrapped when imported via ESM.
// biome-ignore lint/suspicious/noExplicitAny: interop
const Ajv = ((AjvImport as any).default ?? AjvImport) as typeof AjvImport;

// We don't pull in ajv-formats — `format` keywords ("uri", "date-time") are
// treated as documentation hints and ignored by Ajv. The CI validators that
// actually need URL-shape enforcement do their own check.
//
// validateSchema: false bypasses meta-schema resolution. Our schemas declare
// `$schema: "https://json-schema.org/draft-07/schema#"` for documentation;
// Ajv 8's default draft is 2020-12, but the schema features we use (type,
// required, properties, enum, pattern, format-as-comment) are common to both,
// so we don't need a strict meta-schema check.
const ajv = new Ajv({ strict: false, allErrors: true, validateSchema: false });

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
