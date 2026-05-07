export interface PluginAuthor {
  name: string;
  avatar: string;
  url?: string;
}

export interface Plugin {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  category: "connector" | "workspace" | "automation" | "ui";
  author: PluginAuthor;
  installs: number;
  rating: number;
  version: string;
  tags: string[];
  verified: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  icon: string;
  capabilities: string[];
  installCommand: string;
}

export const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "connector", label: "Connectors" },
  { value: "workspace", label: "Workspace" },
  { value: "automation", label: "Automation" },
  { value: "ui", label: "UI Extensions" },
] as const;

export const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest Rated" },
] as const;

export const plugins: Plugin[] = [
  {
    id: "1",
    slug: "linear-sync",
    name: "Linear Sync",
    description: "Two-way sync between Paperclip issues and Linear. Auto-create, update, and close issues across both platforms.",
    longDescription: "Keep your Paperclip board and Linear workspace in perfect sync. When an issue is created or updated in either system, changes propagate automatically. Supports custom field mapping, status synchronization, and bidirectional comments.",
    category: "connector",
    author: { name: "Paperclip", avatar: "/plugins/paperclip.svg" },
    installs: 12847,
    rating: 4.9,
    version: "2.1.0",
    tags: ["project-management", "sync", "linear"],
    verified: true,
    featured: true,
    createdAt: "2025-08-15",
    updatedAt: "2026-04-20",
    icon: "link",
    capabilities: ["events.subscribe", "issues.read", "issues.write"],
    installCommand: "paperclip plugin install @paperclip/linear-sync",
  },
  {
    id: "2",
    slug: "github-connector",
    name: "GitHub Connector",
    description: "Connect Paperclip agents to GitHub repos. Create PRs, review code, manage issues, and trigger workflows.",
    longDescription: "Full GitHub integration for your Paperclip agents. Agents can create branches, commit code, open pull requests, and manage issues directly from the Paperclip board. Includes webhook support for real-time event processing.",
    category: "connector",
    author: { name: "Paperclip", avatar: "/plugins/paperclip.svg" },
    installs: 18293,
    rating: 4.8,
    version: "3.0.1",
    tags: ["github", "git", "ci-cd", "code-review"],
    verified: true,
    featured: true,
    createdAt: "2025-06-01",
    updatedAt: "2026-05-01",
    icon: "git-branch",
    capabilities: ["events.subscribe", "agent.tools.register", "jobs.schedule"],
    installCommand: "paperclip plugin install @paperclip/github-connector",
  },
  {
    id: "3",
    slug: "slack-notifications",
    name: "Slack Notifications",
    description: "Send Paperclip events to Slack channels. Get notified when agents complete tasks, issues change status, or errors occur.",
    category: "connector",
    author: { name: "Paperclip", avatar: "/plugins/paperclip.svg" },
    installs: 9412,
    rating: 4.7,
    version: "1.4.2",
    tags: ["slack", "notifications", "messaging"],
    verified: true,
    featured: false,
    createdAt: "2025-09-10",
    updatedAt: "2026-03-15",
    icon: "message-square",
    capabilities: ["events.subscribe"],
    installCommand: "paperclip plugin install @paperclip/slack-notifications",
  },
  {
    id: "4",
    slug: "terminal-sandbox",
    name: "Terminal Sandbox",
    description: "Isolated terminal environments for agent code execution. Secure sandboxing with resource limits and audit logging.",
    category: "workspace",
    author: { name: "Paperclip", avatar: "/plugins/paperclip.svg" },
    installs: 7856,
    rating: 4.9,
    version: "2.0.0",
    tags: ["sandbox", "terminal", "security", "execution"],
    verified: true,
    featured: true,
    createdAt: "2025-07-20",
    updatedAt: "2026-04-28",
    icon: "terminal",
    capabilities: ["environment.drivers.register"],
    installCommand: "paperclip plugin install @paperclip/terminal-sandbox",
  },
  {
    id: "5",
    slug: "auto-triage",
    name: "Auto-Triage",
    description: "AI-powered issue triage. Automatically categorize, prioritize, and route incoming issues to the right agent.",
    category: "automation",
    author: { name: "Community", avatar: "/plugins/community.svg" },
    installs: 5234,
    rating: 4.6,
    version: "1.2.0",
    tags: ["ai", "triage", "automation", "routing"],
    verified: false,
    featured: true,
    createdAt: "2025-11-05",
    updatedAt: "2026-04-10",
    icon: "brain",
    capabilities: ["events.subscribe", "issues.write", "agent.tools.register"],
    installCommand: "paperclip plugin install @community/auto-triage",
  },
  {
    id: "6",
    slug: "metrics-dashboard",
    name: "Metrics Dashboard",
    description: "Custom dashboards for agent performance, issue throughput, and company health metrics. Real-time charts and alerts.",
    category: "ui",
    author: { name: "Paperclip", avatar: "/plugins/paperclip.svg" },
    installs: 6123,
    rating: 4.5,
    version: "1.8.0",
    tags: ["analytics", "dashboard", "metrics", "charts"],
    verified: true,
    featured: false,
    createdAt: "2025-10-01",
    updatedAt: "2026-04-25",
    icon: "bar-chart-3",
    capabilities: ["ui.slots.register"],
    installCommand: "paperclip plugin install @paperclip/metrics-dashboard",
  },
  {
    id: "7",
    slug: "jira-import",
    name: "Jira Import",
    description: "Migrate projects, issues, and workflows from Jira to Paperclip. One-click migration with field mapping.",
    category: "connector",
    author: { name: "Community", avatar: "/plugins/community.svg" },
    installs: 3456,
    rating: 4.3,
    version: "1.1.0",
    tags: ["jira", "migration", "import"],
    verified: false,
    featured: false,
    createdAt: "2026-01-15",
    updatedAt: "2026-03-20",
    icon: "import",
    capabilities: ["issues.write", "projects.write"],
    installCommand: "paperclip plugin install @community/jira-import",
  },
  {
    id: "8",
    slug: "code-review-agent",
    name: "Code Review Agent",
    description: "Automated code review tool that analyzes PRs for bugs, security issues, and style violations before human review.",
    category: "automation",
    author: { name: "Paperclip", avatar: "/plugins/paperclip.svg" },
    installs: 8901,
    rating: 4.7,
    version: "2.3.0",
    tags: ["code-review", "security", "quality", "ci-cd"],
    verified: true,
    featured: true,
    createdAt: "2025-08-01",
    updatedAt: "2026-05-02",
    icon: "code",
    capabilities: ["agent.tools.register", "events.subscribe"],
    installCommand: "paperclip plugin install @paperclip/code-review-agent",
  },
  {
    id: "9",
    slug: "sentry-connector",
    name: "Sentry Connector",
    description: "Automatically create Paperclip issues from Sentry errors. Link stack traces, assign to the right agent, and track resolution.",
    category: "connector",
    author: { name: "Community", avatar: "/plugins/community.svg" },
    installs: 4567,
    rating: 4.4,
    version: "1.0.3",
    tags: ["sentry", "errors", "monitoring", "debugging"],
    verified: false,
    featured: false,
    createdAt: "2026-02-01",
    updatedAt: "2026-04-15",
    icon: "bug",
    capabilities: ["events.subscribe", "issues.write", "webhooks.receive"],
    installCommand: "paperclip plugin install @community/sentry-connector",
  },
  {
    id: "10",
    slug: "agent-memory",
    name: "Agent Memory",
    description: "Persistent memory system for agents. Store and retrieve context across sessions with semantic search and decay rules.",
    category: "workspace",
    author: { name: "Paperclip", avatar: "/plugins/paperclip.svg" },
    installs: 6789,
    rating: 4.8,
    version: "1.5.0",
    tags: ["memory", "context", "ai", "persistence"],
    verified: true,
    featured: false,
    createdAt: "2025-09-20",
    updatedAt: "2026-04-30",
    icon: "database",
    capabilities: ["agent.tools.register", "database.access"],
    installCommand: "paperclip plugin install @paperclip/agent-memory",
  },
  {
    id: "11",
    slug: "workflow-builder",
    name: "Workflow Builder",
    description: "Visual workflow editor for creating multi-step automations. Drag-and-drop interface for chaining agent actions.",
    category: "ui",
    author: { name: "Community", avatar: "/plugins/community.svg" },
    installs: 3210,
    rating: 4.2,
    version: "0.9.0",
    tags: ["workflow", "visual", "automation", "no-code"],
    verified: false,
    featured: false,
    createdAt: "2026-03-01",
    updatedAt: "2026-04-28",
    icon: "workflow",
    capabilities: ["ui.slots.register", "jobs.schedule"],
    installCommand: "paperclip plugin install @community/workflow-builder",
  },
  {
    id: "12",
    slug: "notion-sync",
    name: "Notion Sync",
    description: "Sync Paperclip projects with Notion databases. Keep documentation and task tracking in sync automatically.",
    category: "connector",
    author: { name: "Community", avatar: "/plugins/community.svg" },
    installs: 2890,
    rating: 4.1,
    version: "1.0.1",
    tags: ["notion", "sync", "documentation"],
    verified: false,
    featured: false,
    createdAt: "2026-02-15",
    updatedAt: "2026-04-05",
    icon: "book-open",
    capabilities: ["events.subscribe", "issues.read"],
    installCommand: "paperclip plugin install @community/notion-sync",
  },
];

export const stats = {
  totalPlugins: plugins.length,
  totalInstalls: plugins.reduce((sum, p) => sum + p.installs, 0),
  totalAuthors: new Set(plugins.map((p) => p.author.name)).size,
  avgRating: +(plugins.reduce((sum, p) => sum + p.rating, 0) / plugins.length).toFixed(1),
};

export function getPluginBySlug(slug: string): Plugin | undefined {
  return plugins.find((p) => p.slug === slug);
}

export function filterPlugins({
  category,
  search,
  sort,
}: {
  category?: string;
  search?: string;
  sort?: string;
}): Plugin[] {
  let filtered = [...plugins];

  if (category && category !== "all") {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)),
    );
  }

  switch (sort) {
    case "trending":
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
    case "newest":
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "rating":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case "popular":
    default:
      filtered.sort((a, b) => b.installs - a.installs);
      break;
  }

  return filtered;
}
