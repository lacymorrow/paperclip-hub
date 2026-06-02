import { readdirSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";
import Link from "next/link";

import { PluginSubmissionForm } from "@/components/forms/plugin-submission-form";

import "../plugins/hub.css";

function getExistingRegistrySlugs(): string[] {
  try {
    const dir = join(process.cwd(), "registry", "plugins");
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

const SUBMIT_TITLE = "Submit a Paperclip plugin — Paperclip Hub";
const SUBMIT_DESCRIPTION =
  "Add your npm package to the Paperclip plugin directory. The form pre-fills a GitHub pull request — CI extracts your manifest, validates npm ownership, and indexes the plugin nightly.";
const SUBMIT_OG = `/og?${new URLSearchParams({
  title: "Submit a plugin",
  description: SUBMIT_DESCRIPTION,
  url: "cliphub.fyi/submit",
}).toString()}`;

export const metadata: Metadata = {
  title: SUBMIT_TITLE,
  description: SUBMIT_DESCRIPTION,
  alternates: { canonical: "https://cliphub.fyi/submit" },
  keywords: ["Paperclip plugin", "submit Paperclip plugin", "Paperclip Hub"],
  openGraph: {
    type: "website",
    url: "https://cliphub.fyi/submit",
    title: SUBMIT_TITLE,
    description: SUBMIT_DESCRIPTION,
    siteName: "Paperclip Hub",
    images: [{ url: SUBMIT_OG, width: 1200, height: 630, alt: "Submit a plugin" }],
  },
  twitter: { card: "summary_large_image", title: SUBMIT_TITLE, description: SUBMIT_DESCRIPTION, images: [SUBMIT_OG] },
};

export default function SubmitPage() {
  const existingSlugs = getExistingRegistrySlugs();
  return (
    <div className="hub-c1">
      {/* Header */}
      <header className="hc-header">
        <Link href="/" className="hc-brand">
          <span className="hc-brand-wm">
            <b>Paper</b>clip
          </span>
          <span className="hc-brand-sub">Hub</span>
        </Link>
        <nav className="hc-nav">
          <Link href="/">Browse</Link>
          <Link href="/submit" className="is-active">
            Submit
          </Link>
          <Link href="https://docs.paperclip.ing">Docs</Link>
          <Link href="https://discord.gg/m4HZY7xNG3">Discord</Link>
        </nav>
        <div className="hc-header-actions">
          <Link href="https://paperclip.ing" className="hc-btn">
            Get Paperclip →
          </Link>
        </div>
      </header>

      {/* Submit content */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "120px 24px 96px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>
            § submit — share your work
          </span>
          <h1
            style={{
              fontFamily: "var(--hub-font-serif)",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "var(--ink)",
              marginBottom: 8,
            }}
          >
            Submit a <em>plugin.</em>
          </h1>
          <p
            style={{
              fontSize: "1.0625rem",
              color: "var(--ink-2)",
              maxWidth: 520,
              lineHeight: 1.6,
            }}
          >
            Share your plugin with the Paperclip community. Fill out the form and open a pull
            request directly on GitHub — no account required here.
          </p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 36 }}>
          <span
            className="eyebrow"
            style={{
              display: "block",
              marginBottom: 12,
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            How it works
          </span>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              {
                num: "01",
                title: "Build your plugin",
                desc: "Follow the Paperclip docs at docs.paperclip.ing to build and publish your npm package.",
              },
              {
                num: "02",
                title: "Fill out the form",
                desc: "Give us your npm package name and GitHub handle. CI extracts the manifest from npm.",
              },
              {
                num: "03",
                title: "Open a PR on GitHub",
                desc: "We pre-fill the pull request — just click commit on GitHub.",
              },
            ].map((step) => (
              <div
                key={step.num}
                style={{
                  flex: "1 1 200px",
                  display: "flex",
                  gap: 12,
                  padding: 18,
                  background: "var(--paper)",
                  border: "1px solid var(--bd-1)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--hub-font-mono)",
                    fontSize: "0.75rem",
                    color: "var(--accent)",
                    fontWeight: 600,
                    minWidth: 24,
                  }}
                >
                  {step.num}
                </span>
                <div>
                  <b
                    style={{
                      display: "block",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                      marginBottom: 4,
                    }}
                  >
                    {step.title}
                  </b>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--ink-2)",
                      lineHeight: 1.5,
                    }}
                  >
                    {step.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--bd-1)",
            padding: "32px 36px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--hub-font-serif)",
              fontStyle: "italic",
              fontSize: "1.125rem",
              color: "var(--ink)",
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: "1px solid var(--bd-1)",
            }}
          >
            Plugin details
          </div>
          <PluginSubmissionForm existingSlugs={existingSlugs} />
        </div>

        {/* Manual PR alternative */}
        <div
          style={{
            marginTop: 36,
            background: "var(--ink)",
            color: "var(--paper)",
            padding: "24px 28px",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--hub-font-mono)",
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: 0.6,
              marginBottom: 10,
            }}
          >
            Prefer to open the PR yourself?
          </span>
          <p
            style={{
              fontSize: "0.875rem",
              opacity: 0.8,
              lineHeight: 1.6,
              marginBottom: 0,
            }}
          >
            Open a pull request directly against{" "}
            <a
              href="https://github.com/lacymorrow/paperclip-hub"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--paper)", textDecoration: "underline" }}
            >
              lacymorrow/paperclip-hub
            </a>{" "}
            adding a pointer file under <code>registry/plugins/</code>. CI extracts the manifest
            and validates ownership against your npm maintainers list.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="hc-foot">
        <div className="l">
          <b>Paperclip</b>
          <span>The Hub</span>
        </div>
        <div className="r">
          <Link href="/submit">Submit</Link>
          <Link href="https://docs.paperclip.ing">Docs</Link>
          <Link href="https://discord.gg/m4HZY7xNG3">Discord</Link>
          <Link href="https://github.com/paperclipai/paperclip">Paperclip</Link>
          <Link href="https://github.com/lacymorrow/paperclip-hub">Hub source</Link>
        </div>
      </footer>
    </div>
  );
}
