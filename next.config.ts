import type { NextConfig } from "next";
import { redirects } from "@/config/redirects";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "cliphub.fyi" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "github.com" },
      { protocol: "https", hostname: "**.vercel.app" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,
  },

  redirects,

  async headers() {
    // Content-Security-Policy. Tight on intent — we only fetch from our own
    // origin plus the npm downloads API (used by the home page for install
    // counts) and Google Fonts (loaded by hub.css). Inline styles are needed
    // because hub.css uses style attributes; inline scripts are needed for
    // Next.js's JSON-LD block in the root layout.
    // Umami (self-hosted) is allowed only when the site is configured to use it.
    const umamiOrigin = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
      ? new URL(process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://analytics.lacy.sh/script.js")
          .origin
      : "";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://www.lacymorrow.com ${umamiOrigin}`.trim(),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://avatars.githubusercontent.com https://github.com",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' https://api.npmjs.org https://registry.npmjs.org ${umamiOrigin}`.trim(),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://github.com",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Powered-By", value: "cliphub.fyi" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },

  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  productionBrowserSourceMaps: false,

  experimental: {
    viewTransition: true,
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
