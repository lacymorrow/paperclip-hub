/**
 * Minimal GitHub API helpers for PR commenting. We do not use `@octokit/rest`
 * to keep the CI dep graph small.
 */

const COMMENT_MARKER = "<!-- paperclip-hub-validator -->";

interface IssueComment {
  id: number;
  body?: string;
}

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
  return token;
}

async function gh<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "paperclip-hub-validator/1.0",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

/**
 * Upsert the validator's PR comment. We tag every comment with a marker
 * so re-runs update the existing one rather than spamming the PR.
 */
export async function upsertPrComment(
  owner: string,
  repo: string,
  prNumber: number,
  bodyMarkdown: string
): Promise<void> {
  const full = `${COMMENT_MARKER}\n${bodyMarkdown}`;
  const comments = await gh<IssueComment[]>(
    "GET",
    `/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100`
  );
  const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER));
  if (existing) {
    await gh<unknown>("PATCH", `/repos/${owner}/${repo}/issues/comments/${existing.id}`, {
      body: full,
    });
  } else {
    await gh<unknown>("POST", `/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
      body: full,
    });
  }
}
