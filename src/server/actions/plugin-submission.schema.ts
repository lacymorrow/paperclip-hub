import { z } from "zod";

/**
 * Hub-curated category vocabulary, used for marketplace browse navigation.
 * Distinct from the manifest's own `categories` array (which is the plugin
 * author's free-form classification).
 */
export const CATEGORIES = [
  "auth",
  "provider",
  "tools",
  "integration",
  "observability",
  "memory",
  "other",
] as const;

/**
 * Plugin submission form schema. Captures only what the submitter is asked
 * to type. Plugin metadata (displayName, description, capabilities) is
 * extracted from the package's built manifest by CI, not collected here.
 */
export const pluginSubmissionSchema = z.object({
  npmPackage: z
    .string()
    .min(1, "npm package name is required")
    .max(214, "npm package name is too long")
    .regex(
      /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/,
      "Invalid npm package name format"
    ),
  authorGithubHandle: z
    .string()
    .min(1, "GitHub handle is required")
    .max(39, "GitHub handle is too long")
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, "Invalid GitHub username"),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Please select a category" }),
  }),
  sourceRepo: z
    .string()
    .url("Must be a valid URL")
    .refine((url) => url.startsWith("https://"), "Source repo URL must use HTTPS")
    .optional()
    .or(z.literal("")),
});

export type PluginSubmissionData = z.infer<typeof pluginSubmissionSchema>;
