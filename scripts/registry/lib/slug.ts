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
