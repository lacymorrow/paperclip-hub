import type { Route } from "next";
import { routes } from "./routes";

/**
 * Redirect type used by Next.js config.
 * Defined here (not in @/lib/utils/redirect) because next.config.ts imports
 * this file and cannot pull in next/navigation at transpile time.
 */
export interface Redirect {
  source: Route;
  destination: Route;
  permanent: boolean;
}

const createRedirects = (sources: Route[], destination: Route, permanent = false): Redirect[] => {
  if (!sources.length) return [];

  // Automatically generate both trailing-slash variants for each source.
  // This is necessary when skipTrailingSlashRedirect is enabled (e.g. for PostHog).
  const expanded = new Set<Route>();
  for (const source of sources) {
    expanded.add(source);
    if (source.endsWith("/") && source.length > 1) {
      expanded.add(source.slice(0, -1) as Route);
    } else if (!source.endsWith("/")) {
      expanded.add(`${source}/` as Route);
    }
  }

  return Array.from(expanded)
    .filter((source) => source !== destination)
    .map((source) => ({ source, destination, permanent }));
};

/**
 * Next.js redirect configuration.
 * Imported by next.config.ts — keep route aliases centralized here.
 */
/* eslint-disable-next-line @typescript-eslint/require-await */
export const redirects = async (): Promise<Redirect[]> => {
  return [
    ...createRedirects(["/plugins"], "/", true),
    ...createRedirects(["/doc", "/docs", "/documentation"], routes.docs, true),
    // Inherited ShipKit doc sections were pruned during the hub docs repurpose.
    // Redirect their old URLs (and any sub-pages) to the docs home. Temporary (307)
    // rather than permanent (308) so browsers don't cache them while the docs churn.
    ...createRedirects(
      [
        "/docs/features",
        "/docs/features/:path*",
        "/docs/integrations",
        "/docs/integrations/:path*",
        "/docs/guides",
        "/docs/guides/:path*",
        "/docs/development",
        "/docs/development/:path*",
        "/docs/deployment",
        "/docs/deployment/:path*",
        "/docs/internal",
        "/docs/internal/:path*",
      ] as Route[],
      routes.docs,
      false
    ),
    ...createRedirects(
      ["/join", "/signup", "/sign-up", "/sign-in", "/login", "/log-in", "/signin"],
      routes.home
    ),
    ...createRedirects(["/logout", "/log-out", "/signout", "/sign-out"], routes.auth.signOut),
  ];
};
