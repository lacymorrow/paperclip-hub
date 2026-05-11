"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  CAPABILITIES,
  CATEGORIES,
  type PluginSubmissionData,
  pluginSubmissionSchema,
} from "@/server/actions/plugin-submission.schema";
import { submitPlugin } from "@/server/actions/plugin-submission";

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  auth: "Auth",
  tools: "Tools",
  chat: "Chat",
  provider: "Provider",
  connector: "Connector",
  workspace: "Workspace",
  automation: "Automation",
  ui: "UI Extension",
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

interface PluginSubmissionFormProps {
  githubUsername: string;
}

export function PluginSubmissionForm({ githubUsername }: PluginSubmissionFormProps) {
  const { toast } = useToast();
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const form = useForm<PluginSubmissionData>({
    resolver: zodResolver(pluginSubmissionSchema),
    defaultValues: {
      name: "",
      npmPackage: "",
      description: "",
      category: undefined,
      capabilities: [],
      sourceRepo: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: PluginSubmissionData) {
    const result = await submitPlugin(data);
    if (result.success && result.prUrl) {
      setPrUrl(result.prUrl);
      form.reset();
    } else {
      toast({
        title: "Submission failed",
        description: result.error ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (prUrl) {
    return (
      <div className="rounded-xl border bg-green-50 dark:bg-green-950/20 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <svg
            className="h-6 w-6 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-green-900 dark:text-green-100">
          Pull request opened!
        </h2>
        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
          Your plugin submission has been submitted for review. We&apos;ll merge it once it passes
          review.
        </p>
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
        >
          View pull request
          <ExternalLink className="h-4 w-4" />
        </a>
        <p className="mt-4 text-xs text-green-600 dark:text-green-400">
          Submitting as{" "}
          <a
            href={`https://github.com/${githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            @{githubUsername}
          </a>
        </p>
        <button
          onClick={() => setPrUrl(null)}
          className="mt-3 text-xs text-green-600 dark:text-green-400 underline hover:no-underline"
        >
          Submit another plugin
        </button>
      </div>
    );
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
                <Input placeholder="opencode-anthropic-auth or @scope/plugin" {...field} />
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
                                checked
                                  ? [...current, cap]
                                  : current.filter((v) => v !== cap)
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

        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Submitting as{" "}
          <a
            href={`https://github.com/${githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline"
          >
            @{githubUsername}
          </a>
          . This will open a pull request on GitHub on your behalf.
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating pull request...
            </>
          ) : (
            "Submit plugin"
          )}
        </Button>
      </form>
    </Form>
  );
}
