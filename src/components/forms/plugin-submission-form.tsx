"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  type PluginSubmissionData,
  pluginSubmissionSchema,
} from "@/server/actions/plugin-submission.schema";

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  auth: "Auth",
  provider: "Provider",
  tools: "Tools",
  integration: "Integration",
  observability: "Observability",
  memory: "Memory",
  other: "Other",
};

const REGISTRY_OWNER = "lacymorrow";
const REGISTRY_REPO = "paperclip-hub";
const REGISTRY_BRANCH = "main";
const REGISTRY_PLUGIN_PATH = "registry/plugins";

// `@scope/pkg` and `pkg` both produce the same `pkg` slug, matching the
// convention in `registry/plugins/`.
export function deriveRegistryFilename(npmPackage: string): string {
  return npmPackage.replace(/^@[^/]+\//, "");
}

function buildGitHubNewFileUrl(data: PluginSubmissionData): string {
  const slug = deriveRegistryFilename(data.npmPackage);
  const filePath = `${REGISTRY_PLUGIN_PATH}/${slug}.json`;

  const pointer = {
    $schema: "../schema.json",
    npmPackage: data.npmPackage,
    addedBy: data.authorGithubHandle,
    category: data.category,
    ...(data.sourceRepo ? { sourceRepo: data.sourceRepo } : {}),
  };
  const fileContent = `${JSON.stringify(pointer, null, 2)}\n`;

  const commitMessage = `feat(registry): add ${data.npmPackage}`;
  const prBody = [
    "## Plugin submission",
    "",
    `**Package:** \`${data.npmPackage}\``,
    `**Submitter:** @${data.authorGithubHandle}`,
    data.sourceRepo ? `**Source:** ${data.sourceRepo}` : "",
    "",
    "Plugin metadata (displayName, capabilities, etc.) will be extracted from the npm tarball by CI and posted in a follow-up comment.",
    "",
    "Submitted via the [Paperclip Hub](https://cliphub.fyi/submit) plugin submission form.",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    filename: filePath,
    value: fileContent,
    message: commitMessage,
    description: prBody,
  });

  return `https://github.com/${REGISTRY_OWNER}/${REGISTRY_REPO}/new/${REGISTRY_BRANCH}?${params.toString()}`;
}

interface PluginSubmissionFormProps {
  existingSlugs?: string[];
}

export function PluginSubmissionForm({ existingSlugs = [] }: PluginSubmissionFormProps) {
  const form = useForm<PluginSubmissionData>({
    resolver: zodResolver(pluginSubmissionSchema),
    defaultValues: {
      npmPackage: "",
      authorGithubHandle: "",
      category: undefined,
      sourceRepo: "",
    },
  });

  function onSubmit(data: PluginSubmissionData) {
    const slug = deriveRegistryFilename(data.npmPackage);
    if (existingSlugs.includes(slug)) {
      form.setError("npmPackage", {
        message: `A plugin with slug "${slug}" already exists. Modifications require editing registry/plugins/${slug}.json directly on GitHub.`,
      });
      return;
    }
    const url = buildGitHubNewFileUrl(data);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="npmPackage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>npm package name</FormLabel>
              <FormControl>
                <Input placeholder="paperclip-github or @scope/plugin" {...field} />
              </FormControl>
              <FormDescription>
                Exact name as published on{" "}
                <a
                  href="https://www.npmjs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  npmjs.com
                </a>
                . The package must include a <code>paperclipPlugin.manifest</code> field in its{" "}
                <code>package.json</code> so CI can extract the manifest.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="authorGithubHandle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your GitHub handle</FormLabel>
              <FormControl>
                <Input placeholder="octocat" {...field} />
              </FormControl>
              <FormDescription>
                Must match the PR author and be listed as an npm maintainer of the package.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Where this plugin appears in the hub's browse filters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sourceRepo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source repository URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://github.com/you/your-plugin" {...field} />
              </FormControl>
              <FormDescription>Shown on the plugin's hub page as a "view source" link.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto">
          Open pull request on GitHub
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}
