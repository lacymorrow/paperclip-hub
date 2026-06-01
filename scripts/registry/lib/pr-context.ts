/**
 * Read PR metadata from GitHub Actions environment variables. Centralized
 * here so individual validators don't each have to know which env vars
 * GitHub exposes.
 */

export interface PrContext {
  prNumber: number;
  prAuthor: string;
  baseSha: string;
  headSha: string;
  repo: { owner: string; name: string };
  labels: string[];
}

export function readPrContext(): PrContext | null {
  const prNumber = Number(process.env.PR_NUMBER);
  const prAuthor = process.env.PR_AUTHOR ?? "";
  const baseSha = process.env.BASE_SHA ?? "";
  const headSha = process.env.HEAD_SHA ?? "";
  const repoFull = process.env.GITHUB_REPOSITORY ?? process.env.REPO ?? "";
  if (!prNumber || !prAuthor || !baseSha || !headSha || !repoFull) return null;
  const [owner, name] = repoFull.split("/");
  if (!owner || !name) return null;
  const labels = (process.env.PR_LABELS ?? "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  return { prNumber, prAuthor, baseSha, headSha, repo: { owner, name }, labels };
}

export function requirePrContext(): PrContext {
  const ctx = readPrContext();
  if (!ctx) {
    throw new Error(
      "PR context env vars not set (PR_NUMBER, PR_AUTHOR, BASE_SHA, HEAD_SHA, GITHUB_REPOSITORY/REPO)"
    );
  }
  return ctx;
}
