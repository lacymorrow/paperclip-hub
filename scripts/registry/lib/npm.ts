/**
 * npm registry helpers. All HTTP fetches go through here so size limits,
 * timeouts, and the User-Agent header are applied consistently.
 */

const USER_AGENT = "paperclip-hub-registry/1.0 (+https://cliphub.fyi)";
const REGISTRY = "https://registry.npmjs.org";
const TARBALL_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Strict npm package-name pattern from the registry JSON Schema (kept in sync
 * with `registry/schema.json`'s `npmPackage` field). Validating at every entry
 * point closes off any SSRF surface: a corrupted pointer file or malicious
 * payload can't reshape the URL into something that points at private
 * infrastructure, because the input is rejected before concatenation.
 */
const NPM_PACKAGE_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/**
 * Allowed npm-tarball hosts. The registry's `dist.tarball` field could in
 * theory point anywhere (mirror, custom CDN). For our purposes anything other
 * than the canonical registry is rejected, because trusting an arbitrary URL
 * would be a clear SSRF vector.
 */
const TARBALL_HOSTS = new Set(["registry.npmjs.org"]);

function assertValidPackageName(pkg: string): void {
  if (!NPM_PACKAGE_NAME.test(pkg)) {
    throw new Error(`invalid npm package name: ${JSON.stringify(pkg)}`);
  }
}

export interface NpmPackumentLite {
  name: string;
  distTags: { latest?: string; [tag: string]: string | undefined };
  versions: string[];
  maintainers: { name: string }[];
}

export interface NpmVersionInfo {
  name: string;
  version: string;
  tarball: string;
  paperclipPlugin?: {
    manifest?: string;
    [key: string]: unknown;
  };
}

function encodePackage(pkg: string): string {
  return pkg.startsWith("@")
    ? pkg.split("/").map(encodeURIComponent).join("/")
    : encodeURIComponent(pkg);
}

/**
 * Fetch the top-level packument: `dist-tags`, version list, maintainers.
 * Returns `null` if the package is not published (404). Throws on other errors.
 */
export async function fetchPackumentLite(pkg: string): Promise<NpmPackumentLite | null> {
  assertValidPackageName(pkg);
  const url = `${REGISTRY}/${encodePackage(pkg)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`npm packument fetch failed: ${pkg} → ${res.status}`);
  const body = (await res.json()) as {
    name: string;
    "dist-tags"?: Record<string, string>;
    versions?: Record<string, unknown>;
    maintainers?: { name: string }[];
  };
  return {
    name: body.name,
    distTags: body["dist-tags"] ?? {},
    versions: Object.keys(body.versions ?? {}),
    maintainers: body.maintainers ?? [],
  };
}

/**
 * Fetch the per-version manifest with tarball URL and `paperclipPlugin` block.
 * Returns `null` if the version is missing.
 */
export async function fetchVersionInfo(
  pkg: string,
  version: string
): Promise<NpmVersionInfo | null> {
  assertValidPackageName(pkg);
  const url = `${REGISTRY}/${encodePackage(pkg)}/${encodeURIComponent(version)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`npm version fetch failed: ${pkg}@${version} → ${res.status}`);
  const body = (await res.json()) as {
    name: string;
    version: string;
    dist?: { tarball?: string };
    paperclipPlugin?: { manifest?: string; [key: string]: unknown };
  };
  if (!body.dist?.tarball) throw new Error(`no tarball URL for ${pkg}@${version}`);
  return {
    name: body.name,
    version: body.version,
    tarball: body.dist.tarball,
    paperclipPlugin: body.paperclipPlugin,
  };
}

/**
 * Stream-fetch a tarball into memory, enforcing the size cap. The tarball is
 * small enough (≤ 10 MB) that in-memory is fine and avoids creating any
 * filesystem surface.
 */
export async function fetchTarball(url: string): Promise<Uint8Array> {
  // The tarball URL comes from `dist.tarball` in the npm packument — i.e.,
  // data we received from the registry, not directly from a user-controlled
  // file. Still, enforce that it points to the canonical npm CDN: a hijacked
  // mirror entry shouldn't be able to redirect us at arbitrary hosts.
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    throw new Error(`refusing tarball over non-https scheme: ${parsed.protocol}`);
  }
  if (!TARBALL_HOSTS.has(parsed.hostname)) {
    throw new Error(`refusing tarball from non-allowlisted host: ${parsed.hostname}`);
  }
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`tarball fetch failed: ${url} → ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) throw new Error(`tarball response had no body: ${url}`);
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > TARBALL_MAX_BYTES) {
      void reader.cancel();
      throw new Error(`tarball exceeds size cap (${TARBALL_MAX_BYTES} bytes): ${url}`);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/**
 * Fetch weekly download count from npm. Returns 0 on any failure (downloads
 * stats are best-effort enrichment, not load-bearing).
 */
export async function fetchWeeklyDownloads(pkg: string): Promise<number> {
  try {
    assertValidPackageName(pkg);
    const url = `https://api.npmjs.org/downloads/point/last-week/${encodePackage(pkg)}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return 0;
    const body = (await res.json()) as { downloads?: number };
    return body.downloads ?? 0;
  } catch {
    return 0;
  }
}
