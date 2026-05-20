import { routes } from "@/config/routes";
import type { MainNavItem, SidebarNavItem } from "@/types/nav";

export interface DocsConfig {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
  featuresNav: SidebarNavItem[];
}

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Documentation",
      href: routes.docs,
    },
    // Only include blog link when blog is enabled
    ...(process.env.NEXT_PUBLIC_HAS_BLOG === "true" ? [{ title: "Blog", href: routes.blog }] : []),
    {
      title: "Contact",
      href: routes.contact,
    },
  ],
  sidebarNav: [
    {
      title: "Getting Started",
      items: [
        {
          title: "Introduction",
          href: routes.docs,
          items: [],
        },
        {
          title: "Installation",
          href: `${routes.docs}/installation`,
          items: [],
        },
        {
          title: "Quick Start",
          href: `${routes.docs}/quick-start`,
          items: [],
        },
        {
          title: "Deployment",
          href: `${routes.docs}/deployment`,
          items: [],
        },
        {
          title: "Environment Variables",
          href: `${routes.docs}/env`,
          items: [],
        },
        {
          title: "Authentication",
          href: `${routes.docs}/auth`,
          items: [],
        },
        {
          title: "Integrations",
          href: `${routes.docs}/integrations`,
          items: [],
          label: "Updated",
        },
      ],
    },
    {
      title: "Features",
      items: [
        {
          title: "Dashboard",
          href: `${routes.docs}/features/dashboard`,
          items: [],
        },
        {
          title: "Authentication",
          href: `${routes.docs}/features/authentication`,
          items: [],
        },
        {
          title: "CMS Integration",
          href: `${routes.docs}/features/cms`,
          items: [],
        },
        {
          title: "API Keys",
          href: `${routes.docs}/features/api-keys`,
          items: [],
        },
        {
          title: "Activity Logging",
          href: `${routes.docs}/features/activity`,
          items: [],
        },
        {
          title: "Teams",
          href: `${routes.docs}/features/teams`,
          items: [],
        },
        {
          title: "Projects",
          href: `${routes.docs}/features/projects`,
          items: [],
        },
      ],
    },
    {
      title: "Components",
      items: [
        {
          title: "UI Components",
          href: `${routes.docs}/components/ui`,
          items: [],
        },
        {
          title: "Data Display",
          href: `${routes.docs}/components/data-display`,
          items: [],
        },
        {
          title: "Forms",
          href: `${routes.docs}/components/forms`,
          items: [],
        },
        {
          title: "Navigation",
          href: `${routes.docs}/components/navigation`,
          items: [],
        },
        {
          title: "Layout",
          href: `${routes.docs}/components/layout`,
          items: [],
        },
        {
          title: "Feedback",
          href: `${routes.docs}/components/feedback`,
          items: [],
        },
        {
          title: "Data Tables",
          href: `${routes.docs}/components/data-tables`,
          items: [],
        },
        {
          title: "Charts",
          href: `${routes.docs}/components/charts`,
          items: [],
        },
      ],
    },
  ],
  featuresNav: [
    {
      title: "Core Features",
      items: [
        {
          title: "Dashboard",
          href: routes.home,
          items: [],
        },
        {
          title: "Deployments",
          href: routes.home,
          items: [],
        },
      ],
    },
  ],
};
