import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const TEMPLATE_OWNER = "lacymorrow";
const TEMPLATE_REPO = "paperclip-hub";

interface CreateRequestBody {
  projectName: string;
  template?: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as CreateRequestBody;
    const { projectName, template } = body;

    if (!projectName || typeof projectName !== "string") {
      return NextResponse.json(
        { success: false, error: "projectName is required" },
        { status: 400 },
      );
    }

    // Validate project name (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "projectName must only contain letters, numbers, hyphens, and underscores",
        },
        { status: 400 },
      );
    }

    // Get the GitHub token from the user's accounts
    const githubAccount = await db?.query.accounts.findFirst({
      where: (accounts, { and, eq }) =>
        and(
          eq(accounts.userId, session.user.id),
          eq(accounts.provider, "github"),
        ),
    });

    if (!githubAccount?.access_token) {
      return NextResponse.json(
        { success: false, error: "GitHub account not connected" },
        { status: 400 },
      );
    }

    const octokit = new Octokit({ auth: githubAccount.access_token });

    // Parse template if provided (format: owner/repo)
    let templateOwner = TEMPLATE_OWNER;
    let templateRepo = TEMPLATE_REPO;
    if (template) {
      const parts = template.split("/");
      if (parts.length === 2 && parts[0] && parts[1]) {
        templateOwner = parts[0];
        templateRepo = parts[1];
      }
    }

    // Create repository from template
    const repoResponse = await octokit.repos.createUsingTemplate({
      template_owner: templateOwner,
      template_repo: templateRepo,
      name: projectName,
      private: true,
      description: `Paperclip Hub project: ${projectName}`,
    });

    const repoUrl = repoResponse.data.html_url;

    // Attempt Vercel deployment if connected
    let deployUrl: string | null = null;

    const vercelAccount = await db?.query.accounts.findFirst({
      where: (accounts, { and, eq }) =>
        and(
          eq(accounts.userId, session.user.id),
          eq(accounts.provider, "vercel"),
        ),
    });

    if (vercelAccount?.access_token) {
      try {
        const createProjectResponse = await fetch(
          "https://api.vercel.com/v9/projects",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelAccount.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: projectName,
              gitRepository: {
                type: "github",
                repo: repoResponse.data.full_name,
              },
              framework: "nextjs",
            }),
          },
        );

        if (createProjectResponse.ok) {
          const project = await createProjectResponse.json();
          deployUrl = `https://vercel.com/${project.accountId}/${project.name}`;
        } else {
          const errorBody = await createProjectResponse.json();
          console.error("Vercel API error:", errorBody);
        }
      } catch (deployError) {
        // Deployment is optional; repo creation still succeeded
        console.error("Vercel project creation failed:", deployError);
      }
    }

    return NextResponse.json({
      success: true,
      repoUrl,
      deployUrl,
    });
  } catch (error) {
    console.error("Error in CLI create:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create project",
      },
      { status: 500 },
    );
  }
}
