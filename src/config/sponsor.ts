/**
 * GitHub Sponsors is the only payment rail. Tiers mirror the live listing at
 * https://github.com/sponsors/lacymorrow exactly. Do not add a tier here until
 * it exists there.
 */
const SPONSOR_URL = "https://github.com/sponsors/lacymorrow";

export type SponsorFrequency = "recurring" | "one-time";

export type SponsorPlacement =
  | "support-primary"
  | "support-once"
  | "tier-5"
  | "tier-100"
  | "tier-1000";

export function sponsorUrl(frequency: SponsorFrequency): string {
  return `${SPONSOR_URL}?frequency=${frequency}`;
}

/** Umami picks these data attributes up on click, no client JS needed. */
export function sponsorEvent(placement: SponsorPlacement) {
  return {
    "data-umami-event": "sponsor-click",
    "data-umami-event-placement": placement,
  } as const;
}

export interface SponsorTier {
  price: string;
  perk: string;
  placement: Extract<SponsorPlacement, `tier-${string}`>;
}

export const sponsorTiers: readonly SponsorTier[] = [
  { price: "$5", perk: "Sponsor badge on your profile.", placement: "tier-5" },
  { price: "$100", perk: "Bug reports prioritized.", placement: "tier-100" },
  {
    price: "$1,000",
    perk: "We join your company chat for help and support.",
    placement: "tier-1000",
  },
];
