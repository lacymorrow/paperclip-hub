import { z } from "zod";

export const CAPABILITIES = [
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

export const CATEGORIES = [
  "auth",
  "tools",
  "chat",
  "provider",
  "connector",
  "workspace",
  "automation",
  "ui",
  "other",
] as const;

export const pluginSubmissionSchema = z.object({
  name: z.string().min(1, "Plugin name is required").max(100),
  npmPackage: z
    .string()
    .min(1, "npm package name is required")
    .max(214, "npm package name is too long")
    .regex(
      /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/,
      "Invalid npm package name format"
    ),
  description: z.string().min(1, "Description is required").max(300),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  capabilities: z.array(z.enum(CAPABILITIES)).min(1, "At least one capability is required"),
  sourceRepo: z
    .string()
    .url("Must be a valid URL")
    .refine((url) => url.startsWith("https://"), "Source repo URL must use HTTPS")
    .optional()
    .or(z.literal("")),
});

export type PluginSubmissionData = z.infer<typeof pluginSubmissionSchema>;
