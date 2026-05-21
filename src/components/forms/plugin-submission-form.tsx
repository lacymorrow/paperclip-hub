"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CAPABILITIES,
  CATEGORIES,
  type PluginSubmissionData,
  pluginSubmissionSchema,
} from "@/server/actions/plugin-submission.schema";

const REGISTRY_OWNER = "lacymorrow";
const REGISTRY_REPO = "paperclip-hub";
const REGISTRY_BRANCH = "main";
const REGISTRY_PLUGIN_PATH = "registry/plugins";

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  auth: "Auth",
  provider: "Provider",
  tools: "Tools",
  integration: "Integration",
  observability: "Observability",
  memory: "Memory",
  other: "Other",
};

const CAPABILITY_LABELS: Record<(typeof CAPABILITIES)[number], string> = {
  event: "Event",
  config: "Config",
  tool: "Tool",
  auth: "Auth",
  "chat.message": "Chat Message",
  "chat.params": "Chat Params",
  "permission.ask": "Permission Ask",
  "tool.execute.before": "Tool Before",
  "tool.execute.after": "Tool After",
};

// Derive the registry filename slug from the npm package name.
// Strips the npm scope so `@scope/pkg` and `pkg` produce the same `pkg.json`
// filename, matching existing registry convention.
export function deriveRegistryFilename(npmPackage: string): string {
  return npmPackage.replace(/^@[^/]+\//, "");
}

function resolveCollisionFilename(baseSlug: string, taken: Set<string>): string {
  if (!taken.has(baseSlug)) return baseSlug;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${baseSlug}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${baseSlug}-${Date.now()}`;
}

function buildGitHubNewFileUrl(data: PluginSubmissionData, existingSlugs: string[]): string {
  const baseSlug = deriveRegistryFilename(data.npmPackage);
  const safeFilename = resolveCollisionFilename(baseSlug, new Set(existingSlugs));
  const filePath = `${REGISTRY_PLUGIN_PATH}/${safeFilename}.json`;

  const pluginJson = {
    $schema: "../schema.json",
    name: data.name,
    npmPackage: data.npmPackage,
    description: data.description,
    category: data.category,
    capabilities: data.capabilities,
    ...(data.sourceRepo ? { sourceRepo: data.sourceRepo } : {}),
    author: data.authorGithubHandle,
    submittedAt: new Date().toISOString(),
  };
  const fileContent = `${JSON.stringify(pluginJson, null, 2)}\n`;

  const commitMessage = `feat(registry): add ${data.name} (${data.npmPackage})`;
  const prBody = [
    "## Plugin Submission",
    "",
    `**Package:** \`${data.npmPackage}\``,
    `**Description:** ${data.description}`,
    `**Category:** ${data.category}`,
    `**Capabilities:** ${data.capabilities.join(", ")}`,
    `**Author:** @${data.authorGithubHandle}`,
    data.sourceRepo ? `**Source:** ${data.sourceRepo}` : "",
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
      name: "",
      npmPackage: "",
      description: "",
      category: undefined,
      capabilities: [],
      authorGithubHandle: "",
      sourceRepo: "",
    },
  });

  function onSubmit(data: PluginSubmissionData) {
    const url = buildGitHubNewFileUrl(data, existingSlugs);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plugin name</FormLabel>
              <FormControl>
                <Input placeholder="Anthropic Auth" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What does your plugin do? (max 300 characters)"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>{field.value?.length ?? 0} / 300</FormDescription>
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capabilities"
          render={() => (
            <FormItem>
              <FormLabel>Capabilities</FormLabel>
              <FormDescription>Which hook types does your plugin implement?</FormDescription>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CAPABILITIES.map((cap) => (
                  <FormField
                    key={cap}
                    control={form.control}
                    name="capabilities"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(cap)}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked ? [...current, cap] : current.filter((v) => v !== cap)
                              );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm cursor-pointer">
                          {CAPABILITY_LABELS[cap]}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
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
              <FormDescription>Used as the plugin author in the registry entry.</FormDescription>
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
