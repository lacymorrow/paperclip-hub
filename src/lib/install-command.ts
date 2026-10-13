/**
 * Single source of truth for the install command the site shows.
 *
 * Verified against paperclipai CLI 2026.1012.0 (see docs/install-verification.md):
 *  - plugin:  `paperclipai plugin install <package>`
 *  - adapter: `paperclipai adapter install --payload-json '{"packageName":"<package>"}'`
 *             (only for external adapters exporting createServerAdapter();
 *             adapters bundled with Paperclip need no install)
 *  - library: SDKs and shared libraries are not installable into an instance,
 *             so there is no command (null) and they must not be listed.
 */
export type RegistryKind = "plugin" | "adapter" | "library";

export const REGISTRY_KINDS: readonly RegistryKind[] = ["plugin", "adapter", "library"];

const CLI = "npx paperclipai@latest";

export function getInstallCommand(kind: RegistryKind, npmPackage: string): string | null {
  switch (kind) {
    case "plugin":
      return `${CLI} plugin install ${npmPackage}`;
    case "adapter":
      return `${CLI} adapter install --payload-json '${JSON.stringify({ packageName: npmPackage })}'`;
    default:
      return null;
  }
}

/** Has the shape of a Paperclip plugin manifest (what `plugin install` requires). */
export function isPluginManifest(manifest: unknown): boolean {
  if (!manifest || typeof manifest !== "object") return false;
  const m = manifest as { id?: unknown; apiVersion?: unknown; entrypoints?: unknown };
  return (
    typeof m.id === "string" &&
    typeof m.apiVersion === "number" &&
    !!m.entrypoints &&
    typeof m.entrypoints === "object"
  );
}
