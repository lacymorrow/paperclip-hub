"use server";

import { Octokit } from "@octokit/rest";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";

const REGISTRY_OWNER = "paperclipai";
const REGISTRY_REPO = "paperclip-hub";
const REGISTRY_BASE_BRANCH = "main";
const REGISTRY_PLUGIN_PATH = "registry/plugins";

const CAPABILITIES = [
  "event",
  "config",
  "tool",
  "auth",
  "chat.message",
  "chat.params",
  "permission.ask",
  "tool.execute.before",
  "tool.execute.after",
] as const;

export const pluginSubmissionSchema = z.object({
  name: z.string().min(1, "Plugin name is required").max(100),
  npmPackage: z
    .string()
    .min(1, "npm package name is required")
    .regex(
      /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/,
      "Invalid npm package name format"
    ),
  description: z.string().min(1, "Description is required").max(300),
  category: z.string().min(1, "Category is required"),
  capabilities: z
    .array(z.enum(CAPABILITIES))
    .min(1, "At least one capability is required"),
  sourceRepo: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type PluginSubmissionData = z.infer<typeof pluginSubmissionSchema>;

interface NpmPackageInfo {
  version: string;
  description: string;
  license: string;
}

interface SubmissionResult {
  success: boolean;
  prUrl?: string;
  error?: string;
}

async function fetchNpmPackageInfo(packageName: string): Promise<NpmPackageInfo | null> {
  const encoded = encodeURIComponent(packageName).replace("%40", "@");
  const res = await fetch(`https://registry.npmjs.org/${encoded}/latest`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    version?: string;
    description?: string;
    license?: string;
  };
  return {
    version: data.version ?? "0.0.0",
    description: data.description ?? "",
    license: data.license ?? "unknown",
  };
}

async function getGitHubAccessToken(userId: string): Promise<string | null> {
  const row = await db?.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, "github")),
    columns: { access_token: true },
  });
  return row?.access_token ?? null;
}

async function ensureForked(
  octokit: Octokit,
  userLogin: string
): Promise<{ forkedOwner: string; forkedRepo: string }> {
  // Check if fork already exists
  try {
    await octokit.repos.get({ owner: userLogin, repo: REGISTRY_REPO });
    return { forkedOwner: userLogin, forkedRepo: REGISTRY_REPO };
  } catch {
    // Fork doesn't exist, create it
  }

  await octokit.repos.createFork({
    owner: REGISTRY_OWNER,
    repo: REGISTRY_REPO,
  });

  // GitHub fork creation is async — poll until the fork is ready (up to ~30s)
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    try {
      await octokit.repos.get({ owner: userLogin, repo: REGISTRY_REPO });
      return { forkedOwner: userLogin, forkedRepo: REGISTRY_REPO };
    } catch {
      // Not ready yet
    }
  }

  throw new Error("Fork creation timed out. Please try again in a moment.");
}

export async function submitPlugin(
  data: PluginSubmissionData
): Promise<SubmissionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to submit a plugin." };
  }

  if (!session.user.githubUsername) {
    return {
      success: false,
      error: "Your account must be connected to GitHub. Please sign in with GitHub.",
    };
  }

  const validation = pluginSubmissionSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message ?? "Invalid form data.",
    };
  }

  const accessToken = await getGitHubAccessToken(session.user.id);
  if (!accessToken) {
    return {
      success: false,
      error: "No GitHub access token found. Please sign out and reconnect with GitHub.",
    };
  }

  // Validate npm package exists
  const npmInfo = await fetchNpmPackageInfo(data.npmPackage);
  if (!npmInfo) {
    return {
      success: false,
      error: `npm package "${data.npmPackage}" was not found in the registry.`,
    };
  }

  const octokit = new Octokit({ auth: accessToken });
  const userLogin = session.user.githubUsername;

  // Fork the registry repo if needed
  let forkedOwner: string;
  let forkedRepo: string;
  try {
    ({ forkedOwner, forkedRepo } = await ensureForked(octokit, userLogin));
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fork the registry repository.",
    };
  }

  // Get upstream HEAD SHA for branching (we branch from upstream, not fork, to stay current)
  const { data: upstreamRef } = await octokit.git.getRef({
    owner: REGISTRY_OWNER,
    repo: REGISTRY_REPO,
    ref: `heads/${REGISTRY_BASE_BRANCH}`,
  });
  const baseSha = upstreamRef.object.sha;

  // Create a unique branch name
  const safePkg = data.npmPackage.replace(/[^a-z0-9-]/g, "-");
  const branchName = `submit/${safePkg}-${Date.now()}`;

  try {
    await octokit.git.createRef({
      owner: forkedOwner,
      repo: forkedRepo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });
  } catch (err: any) {
    if (err?.status !== 422) {
      return { success: false, error: "Failed to create branch in fork." };
    }
    // Branch already exists — unlikely given timestamp suffix, but handle gracefully
  }

  // Build plugin JSON content
  const pluginJson = {
    $schema: "../schema.json",
    name: data.name,
    npmPackage: data.npmPackage,
    description: data.description,
    category: data.category,
    capabilities: data.capabilities,
    ...(data.sourceRepo ? { sourceRepo: data.sourceRepo } : {}),
    author: userLogin,
    submittedAt: new Date().toISOString(),
  };
  const fileContent = `${JSON.stringify(pluginJson, null, 2)}\n`;
  // Normalize scoped package names (@scope/pkg → @scope-pkg) for flat file naming
  const safeFilename = data.npmPackage.replace(/\//g, "-");
  const filePath = `${REGISTRY_PLUGIN_PATH}/${safeFilename}.json`;

  // Commit the plugin JSON to the fork branch
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: forkedOwner,
      repo: forkedRepo,
      path: filePath,
      message: `chore: add ${data.npmPackage} to plugin registry`,
      content: Buffer.from(fileContent).toString("base64"),
      branch: branchName,
    });
  } catch (err) {
    return { success: false, error: "Failed to commit plugin file to fork." };
  }

  // Open the PR against the upstream repo
  let prUrl: string;
  try {
    const { data: pr } = await octokit.pulls.create({
      owner: REGISTRY_OWNER,
      repo: REGISTRY_REPO,
      title: `feat(registry): add ${data.name} (${data.npmPackage})`,
      body: [
        `## Plugin Submission\n`,
        `**Package:** [\`${data.npmPackage}\`](https://www.npmjs.com/package/${data.npmPackage})`,
        `**Category:** ${data.category}`,
        `**Capabilities:** ${data.capabilities.join(", ")}`,
        `**npm version:** ${npmInfo.version}`,
        `**License:** ${npmInfo.license}`,
        data.sourceRepo ? `**Source:** ${data.sourceRepo}` : "",
        `\nSubmitted via the [Paperclip Hub](https://cliphub.lacy.sh/submit) plugin submission form.`,
      ]
        .filter(Boolean)
        .join("\n"),
      head: `${forkedOwner}:${branchName}`,
      base: REGISTRY_BASE_BRANCH,
      maintainer_can_modify: true,
    });
    prUrl = pr.html_url;
  } catch (err) {
    return { success: false, error: "Failed to open pull request." };
  }

  return { success: true, prUrl };
}

export { CAPABILITIES };
