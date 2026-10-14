import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { buildAndServeEvent, buildAndServeUrl } from "@/config/build-and-serve";
import { projects } from "@/config/projects";
import {
  FEATURED_TIER_ID,
  sponsorEvent,
  sponsorTiers,
  sponsorTierUrl,
  sponsorUrl,
} from "@/config/sponsor";

import "../plugins/hub.css";

const SUPPORT_TITLE = "Support the Hub | Paperclip Hub";
const SUPPORT_DESCRIPTION =
  "Clip Hub is free. So is most of what we build. Sponsoring on GitHub keeps it that way.";
const SUPPORT_OG = `/og?${new URLSearchParams({
  title: "Support the Hub",
  description: SUPPORT_DESCRIPTION,
  url: "cliphub.fyi/support",
}).toString()}`;

export const metadata: Metadata = {
  title: SUPPORT_TITLE,
  description: SUPPORT_DESCRIPTION,
  alternates: { canonical: "https://cliphub.fyi/support" },
  openGraph: {
    type: "website",
    url: "https://cliphub.fyi/support",
    title: SUPPORT_TITLE,
    description: SUPPORT_DESCRIPTION,
    siteName: "Paperclip Hub",
    images: [{ url: SUPPORT_OG, width: 1200, height: 630, alt: "Support the Hub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SUPPORT_TITLE,
    description: SUPPORT_DESCRIPTION,
    images: [SUPPORT_OG],
  },
};

const OWN_ORIGIN = "https://cliphub.fyi";

export default function SupportPage() {
  return (
    <div className="hub-c1">
      <header className="hc-header">
        <Link href="/" className="hc-brand">
          <span className="hc-brand-wm">
            <b>Paper</b>clip
          </span>
          <span className="hc-brand-sub">Hub</span>
        </Link>
        <nav className="hc-nav">
          <Link href="/">Browse</Link>
          <Link href="/submit">Submit</Link>
          <Link href="https://docs.paperclip.ing">Docs</Link>
          <Link href="https://discord.gg/m4HZY7xNG3">Discord</Link>
        </nav>
        <div className="hc-header-actions">
          <Link href="https://paperclip.ing" className="hc-btn">
            Get Paperclip →
          </Link>
        </div>
      </header>

      <main>
        <section className="hc-support-hero">
          <span className="hc-support-eyebrow">Support</span>
          <h1>
            Clip Hub is free. So is most of what we build. <em>Sponsoring keeps it that way.</em>
          </h1>
          <p>
            Your sponsorship pays for the hours behind these projects: fixing bugs, answering
            issues, keeping the sites up.
          </p>
          <div className="hc-support-actions">
            <a
              href={sponsorUrl("recurring")}
              target="_blank"
              rel="noopener"
              className="hc-btn hc-btn-lg"
              {...sponsorEvent("support-primary")}
            >
              Sponsor monthly on GitHub
            </a>
            <a
              href={sponsorUrl("one-time")}
              target="_blank"
              rel="noopener"
              className="hc-support-once"
              {...sponsorEvent("support-once")}
            >
              Give once
            </a>
          </div>
          <small className="hc-support-note">Payments go through GitHub Sponsors.</small>
        </section>

        <div className="hc-section-hd">
          <div className="l">
            <span className="eyebrow">Tiers</span>
            <h2>
              Monthly, <em>your call.</em>
            </h2>
          </div>
        </div>
        <ul className="hc-support-tiers">
          {sponsorTiers.map((tier) => (
            <li key={tier.placement}>
              <span className="hc-tier-price">
                {tier.price}
                <small>/mo</small>
              </span>
              <p>{tier.perk}</p>
              <a
                href={tier.tierId ? sponsorTierUrl(tier.tierId) : sponsorUrl("recurring")}
                target="_blank"
                rel="noopener"
                {...sponsorEvent(tier.placement)}
              >
                Sponsor at {tier.price} →
              </a>
            </li>
          ))}
        </ul>

        <div className="hc-section-hd">
          <div className="l">
            <span className="eyebrow">Projects</span>
            <h2>
              What it <em>funds.</em>
            </h2>
          </div>
        </div>
        <ul className="hc-support-projects">
          {projects.map((p) => {
            const own = p.url === OWN_ORIGIN;
            const external = own ? {} : { target: "_blank", rel: "noopener" };
            return (
              <li key={p.id}>
                <a href={own ? "/" : p.url} className="hc-project" {...external}>
                  <span className="hc-project-name">
                    {p.name}
                    {p.kind === "buy" ? <span className="hc-project-tag">Buy</span> : null}
                  </span>
                  <span className="hc-project-line">{p.line}</span>
                  <span className="hc-project-host">{p.host}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="hc-section-hd" id="business">
          <div className="l">
            <span className="eyebrow">Business</span>
            <h2>
              For <em>businesses.</em>
            </h2>
          </div>
        </div>
        <ul className="hc-support-biz">
          <li>
            <a
              href={sponsorTierUrl(FEATURED_TIER_ID)}
              target="_blank"
              rel="noopener"
              {...sponsorEvent("support-feature")}
            >
              Feature your plugin on Clip Hub <span aria-hidden>→</span>
            </a>
          </li>
          <li>
            <a
              href={buildAndServeUrl("support-custom")}
              target="_blank"
              rel="noopener"
              {...buildAndServeEvent("support-custom")}
            >
              Need a custom Paperclip plugin built? <span aria-hidden>→</span>
            </a>
          </li>
        </ul>
      </main>

      <SiteFooter />
    </div>
  );
}
