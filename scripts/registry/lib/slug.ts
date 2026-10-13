/**
 * Derive the registry filename slug for an npm package name.
 *
 * `@scope/pkg` and `pkg` both produce the same `pkg` slug, matching the
 * existing convention in `registry/plugins/`. The slug becomes
 * `registry/plugins/{slug}.json` and `registry/manifests/{slug}.json`.
 */
export function npmPackageToSlug(npmPackage: string): string {
  return npmPackage.replace(/^@[^/]+\//, "");
}

/**
 * Filenames accepted for a pointer: the bare name, or `scope-name` when two
 * scopes publish the same bare name (e.g. `@anneal-memory/paperclip-plugin`
 * and `@magneto-ai/paperclip-plugin` would both want `paperclip-plugin.json`).
 */
export function acceptableSlugs(npmPackage: string): string[] {
  const bare = npmPackageToSlug(npmPackage);
  const scoped = npmPackage.startsWith("@") ? npmPackage.slice(1).replace("/", "-") : bare;
  return [...new Set([bare, scoped])];
}
