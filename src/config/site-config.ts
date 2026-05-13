import type { Metadata } from "next";
import type { Manifest } from "next/dist/lib/metadata/types/manifest-types";

// import { routes } from "@/config/routes"; // Import if needed for startUrl

/**
 * Site Configuration
 *
 * Central configuration for site-wide settings, branding, and metadata.
 * Used throughout the application for consistent branding and functionality.
 */

interface ManifestConfig {
  startUrl: string;
  display: Manifest["display"];
  displayOverride?: Manifest["display_override"];
  orientation: Manifest["orientation"];
  categories: Manifest["categories"];
  dir: Manifest["dir"];
  lang: Manifest["lang"];
  preferRelatedApplications: Manifest["prefer_related_applications"];
  scope: Manifest["scope"];
  launchHandler?: Manifest["launch_handler"];
  icons: {
    favicon: string;
    appIcon192: string;
    appIcon512: string;
  };
  relatedApplications?: Manifest["related_applications"];
}

interface PayloadConfig {
  adminTitleSuffix: string;
  adminIconPath: string;
  adminLogoPath: string;
  dbSchemaName: string;
  emailFromName: string;
}

interface SiteConfig {
  // Core site information
  name: string;
  title: string;
  url: string;
  ogImage: string;
  description: string;
  tagline: string;
  // UI behavior settings
  behavior: {
    pageTransitions: boolean;
  };

  // Branding information
  branding: {
    projectName: string;
    projectSlug: string;
    productNames: {
      // TODO: Remove these once we have a proper product name
      bones: string;
      brains: string;
      main: string;
    };
    domain: string;
    protocol: string;
    githubOrg: string;
    githubRepo: string;
    vercelProjectName: string;
    databaseName: string;
  };

  // External links
  links: {
    twitter: string;
    twitter_follow: string;
    x: string;
    x_follow: string;
    github: string;
  };

  // Social profiles (single source of truth for top networks)
  /**
   * Centralized social links for the project/org. Empty strings mean "disabled".
   * Use helper utilities to get an enabled list for rendering.
   */
  social: {
    github?: string;
    twitter?: string;
    x?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    discord?: string;
    dribbble?: string;
    threads?: string;
  };

  // Repository information
  repo: {
    owner: string;
    name: string;
    url: string;
    format: {
      clone: () => string;
      ssh: () => string;
    };
  };

  // Email addresses and formatting
  email: {
    support: string;
    team: string;
    noreply: string;
    domain: string;
    legal: string;
    privacy: string;
    format: (type: Exclude<keyof SiteConfig["email"], "format">) => string;
  };

  // Creator information
  creator: {
    name: string;
    email: string;
    url: string;
    twitter: string;
    twitter_handle: string;
    domain: string;
    fullName: string;
    role: string;
    avatar: string;
    location: string;
    bio: string;
  };

  // E-commerce store configuration
  store: {
    id: string;
    products: Record<string, string>;
  };

  // SEO and metadata
  metadata: {
    keywords: string[];
    themeColor: {
      light: string;
      dark: string;
    };
    locale: string;
    generator: string;
    referrer: Metadata["referrer"];
    category: string;
    classification: string;
    openGraph: {
      imageWidth: number;
      imageHeight: number;
    };
    twitter: {
      card: "summary" | "summary_large_image" | "app" | "player";
    };
    robots: Metadata["robots"];
    formatDetection: Metadata["formatDetection"];
    alternates: Metadata["alternates"];
    appleWebApp: Metadata["appleWebApp"];
    appLinks: Metadata["appLinks"];
    assetsPath: string;
    bookmarksPath: string;
    blogPath?: string;
  };

  // Application settings
  app: {
    apiKeyPrefix: string;
  };

  // PWA Manifest settings
  manifest: ManifestConfig;

  // Payload CMS settings
  payload: PayloadConfig;
}

// Use 'let' to allow modification after definition
export const siteConfig: SiteConfig = {
  behavior: {
    pageTransitions: true,
  },

  name: "Paperclip Hub",
  title: "Paperclip Hub",
  tagline: "Extend Paperclip. Build anything.",
  url: "https://cliphub.fyi",
  ogImage: "/app/og-image.png",
  description:
    "The plugin marketplace for Paperclip. Discover connectors, automations, and extensions built by the community.",

  branding: {
    projectName: "Paperclip Hub",
    projectSlug: "cliphub",
    productNames: {
      bones: "Bones",
      brains: "Brains",
      main: "Paperclip Hub",
    },
    domain: "cliphub.fyi",
    protocol: "web+paperclip",
    githubOrg: "paperclipai",
    githubRepo: "paperclip-hub",
    vercelProjectName: "cliphub",
    databaseName: "cliphub",
  },

  links: {
    twitter: "https://twitter.com/paperclipai",
    twitter_follow: "https://twitter.com/intent/follow?screen_name=paperclipai",
    x: "https://x.com/paperclipai",
    x_follow: "https://x.com/intent/follow?screen_name=paperclipai",
    github: "https://github.com/paperclipai/paperclip-hub",
  },

  social: {
    github: "https://github.com/paperclipai",
    x: "https://x.com/paperclipai",
    linkedin: "",
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    discord: "https://discord.gg/XxKrKNvEje",
    dribbble: "",
    threads: "",
  },

  repo: {
    owner: "paperclipai",
    name: "paperclip-hub",
    url: "https://github.com/paperclipai/paperclip-hub",
    format: {
      // Placeholder format functions - assigned below
      clone: () => "",
      ssh: () => "",
    },
  },

  email: {
    support: "feedback@paperclip.ing",
    team: "team@paperclip.ing",
    noreply: "noreply@paperclip.ing",
    domain: "paperclip.ing",
    legal: "legal@paperclip.ing",
    privacy: "privacy@paperclip.ing",
    // Placeholder format function - assigned below
    format: (_type) => "",
  },

  creator: {
    name: "lacymorrow",
    email: "lacy@paperclip.ing",
    url: "https://lacymorrow.com",
    twitter: "@lacybuilds",
    twitter_handle: "lacybuilds",
    domain: "lacymorrow.com",
    fullName: "Lacy Morrow",
    role: "Engineer",
    avatar: "https://avatars.githubusercontent.com/u/1311301?v=4",
    location: "San Francisco, CA",
    bio: "Founder, developer, and product designer.",
  },

  store: {
    id: "cliphub",
    products: {
      // LemonSqueezy Checkout URLs use Variant IDs (not Product IDs)
      // Format: variant UUID from LemonSqueezy dashboard
      paperclip: "411883",
      // Examples:
      bones: "411883",
      brains: "411883",
    },
  },

  metadata: {
    keywords: [
      "Paperclip",
      "AI agents",
      "plugins",
      "marketplace",
      "connectors",
      "automation",
      "developer tools",
    ],
    themeColor: {
      light: "white",
      dark: "black",
    },
    locale: "en-US",
    generator: "Next.js, cliphub.fyi",
    referrer: "origin-when-cross-origin",
    category: "technology", // Use technology as category
    classification: "Business Software",
    openGraph: {
      imageWidth: 1200,
      imageHeight: 630,
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {},
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      startupImage: [
        {
          url: "/apple-touch-icon.png",
          media: "(device-width: 768px) and (device-height: 1024px)",
        },
      ],
    },
    appLinks: {},
    assetsPath: "/assets",
    bookmarksPath: "/",
    // blogPath is now conditionally added below
  },

  manifest: {
    startUrl: "/", // Use literal for now, update below if needed
    display: "standalone",
    displayOverride: ["window-controls-overlay"],
    orientation: "portrait-primary",
    categories: ["development", "productivity", "utilities"],
    dir: "ltr",
    lang: "en-US",
    preferRelatedApplications: false,
    scope: "/",
    launchHandler: { client_mode: ["navigate-existing", "auto"] },
    icons: {
      favicon: "/favicon.ico",
      appIcon192: "/app/web-app-manifest-192x192.png",
      appIcon512: "/app/web-app-manifest-512x512.png",
    },
    relatedApplications: [],
  },

  payload: {
    adminTitleSuffix: " CMS", // Updated below
    adminIconPath: "./lib/payload/components/payload-icon",
    adminLogoPath: "./lib/payload/components/payload-logo",
    dbSchemaName: "payload",
    emailFromName: "Payload CMS",
  },

  app: {
    apiKeyPrefix: "sk",
  },
};

// Assign dynamic values AFTER the main object is defined
siteConfig.repo.format = {
  clone: () => `https://github.com/${siteConfig.repo.owner}/${siteConfig.repo.name}.git`,
  ssh: () => `git@github.com:${siteConfig.repo.owner}/${siteConfig.repo.name}.git`,
};

siteConfig.email.format = (type: Exclude<keyof SiteConfig["email"], "format">) =>
  siteConfig.email[type];

siteConfig.payload.adminTitleSuffix = ` - ${siteConfig.title} CMS`;

// siteConfig.manifest.startUrl = routes.home; // Uncomment and import routes if needed

// Make sure alternates exists before assigning canonical
siteConfig.metadata.alternates ??= {};
siteConfig.metadata.alternates.canonical = siteConfig.url;
// Advertise RSS feed for SEO and feed discovery (only when blog is enabled)
if (process.env.NEXT_PUBLIC_HAS_BLOG === "true") {
  siteConfig.metadata.alternates.types = {
    ...(siteConfig.metadata.alternates?.types ?? {}),
    "application/rss+xml": `${siteConfig.url}/rss.xml`,
  };
}

// Check appleWebApp is an object before assigning title
if (siteConfig.metadata.appleWebApp && typeof siteConfig.metadata.appleWebApp === "object") {
  siteConfig.metadata.appleWebApp.title = siteConfig.title;
}

// Ensure appLinks and appLinks.web are objects before assigning url
siteConfig.metadata.appLinks ??= {};
siteConfig.metadata.appLinks.web ??= { url: "", should_fallback: false }; // Initialize web if needed
// Check type again after potential initialization
if (
  siteConfig.metadata.appLinks?.web &&
  typeof siteConfig.metadata.appLinks.web === "object" &&
  !Array.isArray(siteConfig.metadata.appLinks.web) // Ensure it's not an array
) {
  siteConfig.metadata.appLinks.web.url = siteConfig.url;
}

// Update paths to be absolute URLs based on siteConfig.url
siteConfig.metadata.assetsPath = `${siteConfig.url}/assets`;
siteConfig.metadata.bookmarksPath = `${siteConfig.url}/`;

if (process.env.NEXT_PUBLIC_HAS_BLOG === "true") {
  siteConfig.metadata.blogPath = `${siteConfig.url}/blog`;
}

// Freeze the object to prevent accidental modifications later (optional)
// Object.freeze(siteConfig);
