// src/constants.ts
var PLUGIN_ID = "paperclip-plugin-agent-usage";
var PLUGIN_VERSION = "0.1.4";
var PAGE_ROUTE = "agent-usage";
var SLOT_IDS = {
  page: "agent-usage-page",
  dashboardWidget: "agent-usage-dashboard-widget",
  settingsPage: "agent-usage-settings-page",
};
var EXPORT_NAMES = {
  page: "AgentUsagePage",
  dashboardWidget: "AgentUsageDashboardWidget",
  settingsPage: "AgentUsageSettingsPage",
};
var JOB_KEYS = {
  pollUsage: "poll-usage",
};
var TOOL_NAMES = {
  getUsage: "get-usage",
  getUsageSummary: "get-usage-summary",
};
var DEFAULT_CONFIG = {
  pollIntervalMinutes: 15,
  providers: ["claude"],
};

// src/manifest.ts
var manifest = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "Agent Usage Tracker",
  description:
    "Monitors AI provider usage quotas (Claude, etc.) and exposes real-time usage data to agents and the dashboard so they can make smart decisions based on remaining capacity.",
  author: "Paperclip Company",
  categories: ["ui", "automation"],
  capabilities: [
    "companies.read",
    "plugin.state.read",
    "plugin.state.write",
    "events.subscribe",
    "events.emit",
    "jobs.schedule",
    "http.outbound",
    "metrics.write",
    "agent.tools.register",
    "ui.dashboardWidget.register",
    "ui.page.register",
    "instance.settings.register",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  instanceConfigSchema: {
    type: "object",
    properties: {
      pollIntervalMinutes: {
        type: "number",
        title: "Poll Interval (minutes)",
        description: "How often to refresh usage data from providers.",
        default: DEFAULT_CONFIG.pollIntervalMinutes,
      },
      providers: {
        type: "array",
        title: "Providers to Track",
        items: {
          type: "string",
          enum: ["claude"],
        },
        default: DEFAULT_CONFIG.providers,
      },
    },
  },
  jobs: [
    {
      jobKey: JOB_KEYS.pollUsage,
      displayName: "Poll Provider Usage",
      description:
        "Periodically fetches usage quota data from configured AI providers and stores it for agent access.",
      schedule: `*/${DEFAULT_CONFIG.pollIntervalMinutes} * * * *`,
    },
  ],
  tools: [
    {
      name: TOOL_NAMES.getUsage,
      displayName: "Get AI Provider Usage",
      description:
        "Returns current usage quota windows for configured AI providers (utilization percentages, reset times, limits). Use this to check how much capacity remains before starting expensive operations.",
      parametersSchema: {
        type: "object",
        properties: {
          provider: {
            type: "string",
            description: "Provider to query. Defaults to 'claude'.",
          },
        },
      },
    },
    {
      name: TOOL_NAMES.getUsageSummary,
      displayName: "Get Usage Summary",
      description:
        "Returns a brief human-readable summary of current usage across all providers, including remaining capacity and reset times.",
      parametersSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
  ui: {
    slots: [
      {
        type: "page",
        id: SLOT_IDS.page,
        displayName: "Agent Usage",
        exportName: EXPORT_NAMES.page,
        routePath: PAGE_ROUTE,
      },
      {
        type: "settingsPage",
        id: SLOT_IDS.settingsPage,
        displayName: "Agent Usage Settings",
        exportName: EXPORT_NAMES.settingsPage,
      },
      {
        type: "dashboardWidget",
        id: SLOT_IDS.dashboardWidget,
        displayName: "AI Usage",
        exportName: EXPORT_NAMES.dashboardWidget,
      },
    ],
  },
};
var manifest_default = manifest;
export { manifest_default as default };
//# sourceMappingURL=manifest.js.map
