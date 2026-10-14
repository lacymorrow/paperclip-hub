import { describe, expect, it } from "vitest";
import { projects } from "../projects";
import { FEATURED_TIER_ID, sponsorTiers, sponsorTierUrl, sponsorUrl } from "../sponsor";

describe("projects", () => {
  it("has unique ids and https urls", () => {
    expect(new Set(projects.map((p) => p.id)).size).toBe(projects.length);
    for (const p of projects) expect(p.url).toMatch(/^https:\/\//);
  });
  it("labels only Shipkit as a purchase", () => {
    expect(projects.filter((p) => p.kind === "buy").map((p) => p.id)).toEqual(["shipkit"]);
  });
});

describe("sponsor", () => {
  it("mirrors the four live tiers", () => {
    expect(sponsorTiers.map((t) => t.price)).toEqual(["$5", "$25", "$100", "$1,000"]);
  });
  it("links the featured tier to its own checkout", () => {
    const tier = sponsorTiers.find((t) => t.placement === "tier-featured");
    expect(tier?.tierId).toBe(FEATURED_TIER_ID);
    expect(sponsorTierUrl(FEATURED_TIER_ID)).toBe(
      "https://github.com/sponsors/lacymorrow/sponsorships?tier_id=668081"
    );
  });
  it("builds frequency urls", () => {
    expect(sponsorUrl("recurring")).toBe(
      "https://github.com/sponsors/lacymorrow?frequency=recurring"
    );
    expect(sponsorUrl("one-time")).toBe(
      "https://github.com/sponsors/lacymorrow?frequency=one-time"
    );
  });
});
