/**
 * The one sponsored plugin on the home page, paid through the "Featured on
 * Paperclip Hub" GitHub Sponsors tier (FEATURED_TIER_ID in ./sponsor). null means
 * nobody holds the slot and the home page shows nothing extra.
 *
 * To feature a sponsor: confirm the sponsorship on GitHub, check the plugin is
 * listed (not quarantined), then set `slug` to its /plugins/<slug> path segment.
 * Clear it when the sponsorship ends.
 */
export interface FeaturedSponsor {
  slug: string;
  /** Who pays for the slot, shown as "Sponsored by". */
  sponsor: string;
}

export const featuredSponsor: FeaturedSponsor | null = null;
