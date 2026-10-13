/**
 * Build & Serve (the agency behind the Hub) is the only commercial surface on
 * the site. One quiet link per placement, always tagged so clicks can be
 * attributed. The services page is about company setup, not plugin builds, so
 * every placement points at the contact page.
 */
const CONTACT_URL = "https://buildandserve.com/contact";

export type BuildAndServePlacement =
  | "empty-search"
  | "plugin-detail"
  | "support-feature"
  | "support-custom";

export function buildAndServeUrl(placement: BuildAndServePlacement): string {
  const params = new URLSearchParams({
    utm_source: "cliphub",
    utm_medium: "referral",
    utm_campaign: placement,
  });
  return `${CONTACT_URL}?${params.toString()}`;
}

/** Umami picks these data attributes up on click, no client JS needed. */
export function buildAndServeEvent(placement: BuildAndServePlacement) {
  return {
    "data-umami-event": "build-and-serve-click",
    "data-umami-event-placement": placement,
  } as const;
}
