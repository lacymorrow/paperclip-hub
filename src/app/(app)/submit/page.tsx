import { Github } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GitHubSignInButton } from "@/components/buttons/github-sign-in-button";
import { PluginSubmissionForm } from "@/components/forms/plugin-submission-form";
import { auth } from "@/server/auth";

import "../plugins/hub.css";

export const metadata: Metadata = {
  title: "Submit a Plugin — Paperclip Hub",
  description:
    "Submit your plugin to the Paperclip Hub registry. Open a pull request directly from your browser.",
};

export default async function SubmitPage() {
  const session = await auth();
  const user = session?.user;
  const githubUsername = user?.githubUsername ?? null;

  return (
    <div className="hub-c1">
      {/* Header */}
      <header className="hc-header">
        <Link href="/" className="hc-brand">
          <span className="hc-brand-wm">
            <b>Paper</b>clip
          </span>
          <span className="hc-brand-sub">Hub · est. 2026</span>
        </Link>
        <nav className="hc-nav">
          <Link href="/">Browse</Link>
          <Link href="/?sort=newest">Collections</Link>
          <Link href="/?category=provider">Publishers</Link>
          <Link href="/submit" className="is-active">
            Submit
          </Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="hc-header-actions">
          <Link href="/sign-in" className="hc-link-muted">
            Sign in
          </Link>
          <a href="https://github.com/paperclipai/paperclip-hub" className="hc-btn" target="_blank" rel="noopener noreferrer">
            Get Paperclip →
          </a>
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
            Share your plugin with the Paperclip community. We&apos;ll open a pull request to the
            registry on your behalf.
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
                desc: "Follow the Plugin SDK docs to create and publish your npm package.",
              },
              {
                num: "02",
                title: "Fill out the form",
                desc: "Tell us about your plugin — name, capabilities, and npm package.",
              },
              {
                num: "03",
                title: "We open a PR",
                desc: "A pull request is created automatically for review and merge.",
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
          {!user ? (
            <div style={{ textAlign: "center", padding: "36px 0" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "var(--bg)",
                  border: "1px solid var(--bd-1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Github style={{ width: 28, height: 28, color: "var(--ink)" }} />
              </div>
              <h2
                style={{
                  fontFamily: "var(--hub-font-serif)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  fontSize: "1.25rem",
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Sign in with GitHub
              </h2>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--ink-2)",
                  maxWidth: 380,
                  margin: "0 auto 24px",
                }}
              >
                We use your GitHub account to open the pull request on your behalf.
              </p>
              <GitHubSignInButton callbackUrl="/submit" />
            </div>
          ) : !githubUsername ? (
            <div style={{ textAlign: "center", padding: "36px 0" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "var(--bg)",
                  border: "1px solid var(--bd-1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Github style={{ width: 28, height: 28, color: "var(--ink)" }} />
              </div>
              <h2
                style={{
                  fontFamily: "var(--hub-font-serif)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  fontSize: "1.25rem",
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Connect your GitHub account
              </h2>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--ink-2)",
                  maxWidth: 380,
                  margin: "0 auto 24px",
                }}
              >
                Your account isn&apos;t linked to GitHub yet. Connect it so we can open the PR on
                your behalf.
              </p>
              <GitHubSignInButton callbackUrl="/submit" />
            </div>
          ) : (
            <>
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
              <PluginSubmissionForm githubUsername={githubUsername} />
            </>
          )}
        </div>

        {/* CLI alternative */}
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
            Prefer the CLI?
          </span>
          <p
            style={{
              fontSize: "0.875rem",
              opacity: 0.8,
              lineHeight: 1.6,
              marginBottom: 14,
            }}
          >
            You can also submit a plugin by manually opening a pull request to{" "}
            <a
              href="https://github.com/lacymorrow/paperclip-hub"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--paper)", textDecoration: "underline" }}
            >
              lacymorrow/paperclip-hub
            </a>
            .
          </p>
          <pre
            style={{
              fontFamily: "var(--hub-font-mono)",
              fontSize: "0.8125rem",
              lineHeight: 1.7,
              opacity: 0.75,
              overflow: "auto",
            }}
          >
            <span style={{ color: "#b13a2a" }}>$</span> paperclip plugin submit \{"\n"}
            {"  "}--name &quot;My Plugin&quot; \{"\n"}
            {"  "}--package my-plugin-npm \{"\n"}
            {"  "}--category tools \{"\n"}
            {"  "}--capabilities event,tool
          </pre>
        </div>
      </div>

      {/* Footer */}
      <footer className="hc-foot">
        <div className="l">
          <b>Paperclip</b>
          <span>The Hub · vol. 19 — May 2026</span>
        </div>
        <div className="r">
          <Link href="/about">About</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/docs/api">API</Link>
          <Link href="/docs/cli">CLI</Link>
          <Link href="https://github.com">GitHub</Link>
          <Link href="/status">Status</Link>
        </div>
      </footer>
    </div>
  );
}
