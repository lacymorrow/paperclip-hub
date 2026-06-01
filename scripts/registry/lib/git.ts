/**
 * Lightweight git helpers used by the diff-based validators. We invoke
 * `git` directly via execFile (no shell) so untrusted PR metadata can't
 * inject arguments.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

export interface ChangedFile {
  status: "A" | "M" | "D" | "R" | "C" | "T" | "U";
  path: string;
}

/**
 * List files changed between two refs. `base` defaults to the merge base
 * with `origin/main`. Status codes come from `git diff --name-status`.
 */
export async function listChangedFiles(baseSha: string, headSha: string): Promise<ChangedFile[]> {
  const { stdout } = await execFileP("git", [
    "diff",
    "--name-status",
    "--diff-filter=ACMRTU",
    baseSha,
    headSha,
  ]);
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.split(/\s+/);
      // Rename/copy entries have two paths; take the destination
      const path = rest[rest.length - 1] ?? "";
      const code = status?.[0] ?? "M";
      return { status: code as ChangedFile["status"], path };
    })
    .filter((f) => f.path);
}
