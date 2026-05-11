import { BookOpen, Github, Package, Terminal } from "lucide-react";
import type { Metadata } from "next";
import { PluginSubmissionForm } from "@/components/forms/plugin-submission-form";
import { GitHubSignInButton } from "@/components/buttons/github-sign-in-button";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "Submit a Plugin — Paperclip Hub",
  description:
    "Submit your plugin to the Paperclip Hub registry. Open a pull request directly from your browser.",
};

const PREREQS = [
  {
    icon: BookOpen,
    title: "Read the Plugin SDK docs",
    description: "Understand the manifest format, capabilities, and plugin lifecycle.",
  },
  {
    icon: Terminal,
    title: "Build and publish to npm",
    description:
      "Package your plugin as an npm module and publish it so we can verify it exists.",
  },
  {
    icon: Package,
    title: "Submit below",
    description:
      "Fill out the form. We'll open a pull request to the registry on your behalf.",
  },
] as const;

const CLI_EXAMPLE = `# registry/plugins/your-plugin.json
{
  "$schema": "../schema.json",
  "name": "Your Plugin",
  "npmPackage": "your-plugin",
  "description": "What it does.",
  "category": "tools",
  "capabilities": ["tool"],
  "author": "your-github-handle",
  "submittedAt": "2026-05-07T00:00:00Z"
}`;

export default async function SubmitPage() {
  const session = await auth();
  const user = session?.user;
  const githubUsername = user?.githubUsername ?? null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Submit a Plugin</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Add your plugin to the Paperclip Hub registry. Submissions create a pull request — no
          account required beyond GitHub.
        </p>
      </div>

      <div className="mb-10 space-y-4">
        {PREREQS.map((step, i) => (
          <div key={step.title} className="flex gap-4 rounded-xl border bg-card p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
              {i + 1}
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <step.icon className="h-4 w-4" />
                {step.title}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 sm:p-8">
        {!user ? (
          <div className="text-center py-4">
            <Github className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Sign in with GitHub to continue</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We use your GitHub account to open the pull request on your behalf.
            </p>
            <div className="mt-6 flex justify-center">
              <GitHubSignInButton callbackUrl="/submit" />
            </div>
          </div>
        ) : !githubUsername ? (
          <div className="text-center py-4">
            <Github className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Connect your GitHub account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account isn&apos;t linked to GitHub yet. Connect it so we can open the PR on
              your behalf.
            </p>
            <div className="mt-6 flex justify-center">
              <GitHubSignInButton callbackUrl="/submit" />
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-6">Plugin details</h2>
            <PluginSubmissionForm githubUsername={githubUsername} />
          </>
        )}
      </div>

      <div className="mt-10 rounded-xl border bg-muted/40 p-6">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
          Prefer the CLI?
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          You can also submit a plugin by manually opening a pull request to{" "}
          <a
            href="https://github.com/lacymorrow/paperclip-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            lacymorrow/paperclip-hub
          </a>
          . Add a JSON file to <code className="rounded bg-muted px-1.5 py-0.5 text-xs">registry/plugins/</code> that follows the schema:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
          {CLI_EXAMPLE}
        </pre>
        <p className="mt-3 text-xs text-muted-foreground">
          The full schema is at{" "}
          <a
            href="https://github.com/lacymorrow/paperclip-hub/blob/main/registry/schema.json"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            registry/schema.json
          </a>
          .
        </p>
      </div>
    </div>
  );
}
