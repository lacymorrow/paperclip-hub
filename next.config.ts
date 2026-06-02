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
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Powered-By", value: "cliphub.fyi" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
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
