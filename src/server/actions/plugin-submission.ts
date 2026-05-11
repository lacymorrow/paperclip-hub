"use server";

import { Octokit } from "@octokit/rest";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getGitHubAccessToken } from "@/server/services/github/github-token-service";
import { pluginSubmissionSchema, type PluginSubmissionData } from "./plugin-submission.schema";

const REGISTRY_OWNER = "paperclipai";
const REGISTRY_REPO = "paperclip-hub";
const REGISTRY_BASE_BRANCH = "main";
const REGISTRY_PLUGIN_PATH = "registry/plugins";

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
  // @scope/pkg → @scope%2Fpkg for npm registry API
  const encoded = encodeURIComponent(packageName).replace(/%40/g, "@");
  try {
    const res = await fetch(`https://registry.npmjs.org/${encoded}/latest`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
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
  } catch {
    return null;
  }
}

async function ensureForked(
  octokit: Octokit,
  userLogin: string
): Promise<{ forkedOwner: string; forkedRepo: string }> {
  try {
    await octokit.repos.get({ owner: userLogin, repo: REGISTRY_REPO });
    return { forkedOwner: userLogin, forkedRepo: REGISTRY_REPO };
  } catch (err) {
    const status = (err as { status?: number } | null)?.status;
    if (status !== 404) throw err;
    // Fork doesn't exist, create it
  }

  const { data: fork } = await octokit.repos.createFork({
    owner: REGISTRY_OWNER,
    repo: REGISTRY_REPO,
  });
  const actualOwner = fork.owner.login;

  // GitHub fork creation is async — poll until the fork's default branch is present
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await octokit.repos.getBranch({
        owner: actualOwner,
        repo: REGISTRY_REPO,
        branch: REGISTRY_BASE_BRANCH,
      });
      return { forkedOwner: actualOwner, forkedRepo: REGISTRY_REPO };
    } catch {
      // Not ready yet
    }
  }

  throw new Error("Fork creation timed out. Please try again in a moment.");
}

async function findExistingPr(
  octokit: Octokit,
  head: string,
  safeFilename: string
): Promise<string | null> {
  const { data: prs } = await octokit.pulls.list({
    owner: REGISTRY_OWNER,
    repo: REGISTRY_REPO,
    state: "open",
    head,
  });
  // Also search by filename in case a previous submission used a different fork branch
  const byFilename = prs.find((pr) =>
    pr.title.includes(safeFilename.replace("@", "").split("-")[0] ?? "")
  );
  const exact = prs.find((pr) => pr.head.label === head);
  return exact?.html_url ?? byFilename?.html_url ?? null;
}

function sanitizeMarkdown(str: string): string {
  return str.replace(/[#*_\[\]()>!`|\\~<]/g, "");
}

function octokitErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { message?: string; response?: { data?: { message?: string } } };
    return e.response?.data?.message ?? e.message ?? String(err);
  }
  return String(err);
}

export async function submitPlugin(data: PluginSubmissionData): Promise<SubmissionResult> {
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

  if (!db) {
    return { success: false, error: "Database is not configured." };
  }

  const validation = pluginSubmissionSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message ?? "Invalid form data.",
    };
  }
  const validated = validation.data;

  const accessToken = await getGitHubAccessToken(session.user.id);
  if (!accessToken) {
    return {
      success: false,
      error: "No GitHub access token found. Please sign out and sign in again with GitHub.",
    };
  }

  // Validate npm package exists
  const npmInfo = await fetchNpmPackageInfo(validated.npmPackage);
  if (!npmInfo) {
    return {
      success: false,
      error: `npm package "${validated.npmPackage}" was not found in the npm registry.`,
    };
  }

  const octokit = new Octokit({ auth: accessToken });
  const userLogin = session.user.githubUsername;

  // Ensure the registry repo is forked under the user's account
  let forkedOwner: string;
  let forkedRepo: string;
  try {
    ({ forkedOwner, forkedRepo } = await ensureForked(octokit, userLogin));
  } catch (err) {
    console.error("[submitPlugin] fork failed:", octokitErrorMessage(err));
    return {
      success: false,
      error: "Failed to fork the registry repository. Please try again.",
    };
  }

  // Normalize scoped package names (@scope/pkg → @scope-pkg) for flat file naming
  const safeFilename = validated.npmPackage.replace(/\//g, "-");
  const filePath = `${REGISTRY_PLUGIN_PATH}/${safeFilename}.json`;
  const safePkg = validated.npmPackage.replace(/[^a-z0-9-]/g, "-");
  const branchName = `submit/${safePkg}`;

  // Check for an existing open PR to avoid duplicates
  try {
    const head = `${forkedOwner}:${branchName}`;
    const existingPrUrl = await findExistingPr(octokit, head, safeFilename);
    if (existingPrUrl) {
      return { success: true, prUrl: existingPrUrl };
    }
  } catch {
    // Non-fatal: proceed even if the duplicate check fails
  }

  // Sync fork with upstream to avoid stale-fork dirty PRs
  try {
    await octokit.repos.mergeUpstream({
      owner: forkedOwner,
      repo: forkedRepo,
      branch: REGISTRY_BASE_BRANCH,
    });
  } catch {
    // Non-fatal: proceed even if upstream sync fails
  }

  // Branch from the fork's own HEAD to handle stale forks safely
  let baseSha: string;
  try {
    const { data: forkRef } = await octokit.git.getRef({
      owner: forkedOwner,
      repo: forkedRepo,
      ref: `heads/${REGISTRY_BASE_BRANCH}`,
    });
    baseSha = forkRef.object.sha;
  } catch (err) {
    console.error("[submitPlugin] getRef on fork failed:", octokitErrorMessage(err));
    return { success: false, error: "Could not read the fork branch. Please try again." };
  }

  // Create or reuse the stable submission branch

  try {
    await octokit.git.createRef({
      owner: forkedOwner,
      repo: forkedRepo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });
  } catch (err: unknown) {
    const status = (err as { status?: number } | null)?.status;
    const msg = octokitErrorMessage(err);
    // 422 "Reference already exists" is safe to ignore — stable branch may already exist
    if (status !== 422 || !msg.includes("Reference already exists")) {
      console.error("[submitPlugin] createRef failed:", msg);
      return { success: false, error: "Failed to create submission branch. Please try again." };
    }
  }

  // Build and commit the plugin JSON
  const pluginJson = {
    $schema: "../schema.json",
    name: validated.name,
    npmPackage: validated.npmPackage,
    description: validated.description,
    category: validated.category,
    capabilities: validated.capabilities,
    ...(validated.sourceRepo ? { sourceRepo: validated.sourceRepo } : {}),
    author: userLogin,
    submittedAt: new Date().toISOString(),
  };
  const fileContent = `${JSON.stringify(pluginJson, null, 2)}\n`;

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: forkedOwner,
      repo: forkedRepo,
      path: filePath,
      message: `chore: add ${validated.npmPackage} to plugin registry`,
      content: Buffer.from(fileContent).toString("base64"),
      branch: branchName,
    });
  } catch (err) {
    console.error("[submitPlugin] createOrUpdateFileContents failed:", octokitErrorMessage(err));
    return { success: false, error: "Failed to commit the plugin file. Please try again." };
  }

  // Open the pull request
  let prUrl: string;
  try {
    const { data: pr } = await octokit.pulls.create({
      owner: REGISTRY_OWNER,
      repo: REGISTRY_REPO,
      title: `feat(registry): add ${sanitizeMarkdown(validated.name)} (${validated.npmPackage})`,
      body: [
        `## Plugin Submission\n`,
        `**Package:** [\`${validated.npmPackage}\`](https://www.npmjs.com/package/${validated.npmPackage})`,
        `**Description:** ${sanitizeMarkdown(validated.description)}`,
        `**Category:** ${validated.category}`,
        `**Capabilities:** ${validated.capabilities.join(", ")}`,
        `**npm version:** ${npmInfo.version}`,
        `**License:** ${npmInfo.license}`,
        validated.sourceRepo ? `**Source:** ${validated.sourceRepo}` : "",
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
    console.error("[submitPlugin] pulls.create failed:", octokitErrorMessage(err));
    return { success: false, error: "Failed to open the pull request. Please try again." };
  }

  return { success: true, prUrl };
}
