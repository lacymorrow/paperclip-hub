import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { Plugin } from "@/data/plugins";
import { getPluginBySlug, getPlugins } from "@/lib/registry";

import "../hub.css";
import { DetailTabs } from "./detail-tabs";
import { InstallCard } from "./install-card";

interface PluginDetailPageProps {
  params: Promise<{ slug: string }>;
}

const OFFICIAL_AUTHORS = new Set(["paperclipai", "paperclip-official", "paperclip"]);

export async function generateStaticParams() {
  const plugins = await getPlugins();
  return plugins.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PluginDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const plugin = await getPluginBySlug(slug);
  if (!plugin) return {};
  return {
    title: `${plugin.name} — Paperclip Hub`,
    description: plugin.description,
  };
}

function fmtK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

function longDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isVerified(p: Plugin): boolean {
  return OFFICIAL_AUTHORS.has(p.author.name.toLowerCase());
}

function describeCapability(cap: string): string {
  const map: Record<string, string> = {
    event: "Subscribe to runtime events emitted by Paperclip and other plugins.",
    "events.subscribe": "Subscribe to runtime events emitted by Paperclip and its other plugins.",
    "issues.read": "Read issues and their metadata from the Paperclip board.",
    "issues.write": "Create, update, and close issues on the Paperclip board.",
    "agent.tools.register": "Register tools the agent can call during a run.",
    "jobs.schedule": "Schedule background jobs that run on Paperclip's worker pool.",
    "environment.drivers.register": "Register isolated execution environments for agent code.",
    "ui.slots.register": "Register custom UI slots in the Paperclip dashboard.",
    "database.access": "Scoped read/write access to the configured Paperclip database.",
    "webhooks.receive": "Receive webhooks from external services and route them to agents.",
    "projects.write": "Create and modify projects on the Paperclip board.",
    auth: "Provide authentication credentials to the runtime.",
    tool: "Register a callable tool surface for the agent.",
    provider: "Provide a model or inference backend to the runtime.",
  };
  return map[cap] ?? "Custom capability registered by this plugin.";
}

function camelize(pkgName: string): string {
  return pkgName
    .replace(/^@[^/]+\//, "")
    .split(/[-_/]/)
    .map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
    .join("");
}

export default async function PluginDetailPage({ params }: PluginDetailPageProps) {
  const { slug } = await params;
  const plugin = await getPluginBySlug(slug);
  if (!plugin) notFound();

  const allPlugins = await getPlugins();

  const cliCommand = plugin.installCommand;
  const npmCommand = `install ${plugin.npmPackage}`;
  const verified = isVerified(plugin);

  const related = allPlugins
    .filter((p) => p.category === plugin.category && p.slug !== plugin.slug)
    .slice(0, 3);

  const sourceHost = plugin.sourceRepo
    ? plugin.sourceRepo.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;
  const releasesUrl = plugin.sourceRepo ? `${plugin.sourceRepo.replace(/\/$/, "")}/releases` : null;

  const versionTab =
    plugin.version === "unknown" ? (
      <p className="hc-d-empty">npm registry hasn't responded yet — try again in a moment.</p>
    ) : (
      <>
        <div className="hc-d-versions">
          <div className="hc-d-version-row">
            <span className="v">v{plugin.version}</span>
            <span className="d">{longDate(plugin.submittedAt)}</span>
            <span className="t latest">Latest · published</span>
            {releasesUrl ? (
              <a href={releasesUrl} target="_blank" rel="noreferrer">
                view release →
              </a>
            ) : (
              <span className="hc-d-version-diff" aria-hidden>
                —
              </span>
            )}
          </div>
        </div>
        <p className="hc-d-empty" style={{ marginTop: 18 }}>
          Older versions live on{" "}
          {releasesUrl ? (
            <a href={releasesUrl} target="_blank" rel="noreferrer">
              GitHub releases
            </a>
          ) : (
            <a
              href={`https://www.npmjs.com/package/${plugin.npmPackage}?activeTab=versions`}
              target="_blank"
              rel="noreferrer"
            >
              the npm registry
            </a>
          )}
          .
        </p>
      </>
    );

  const changelogTab = (
    <p className="hc-d-empty">
      The Hub doesn't ingest changelogs yet.{" "}
      {releasesUrl ? (
        <>
          See{" "}
          <a href={releasesUrl} target="_blank" rel="noreferrer">
            {sourceHost}/releases
          </a>{" "}
          for the maintained changelog.
        </>
      ) : (
        <>
          Browse{" "}
          <a
            href={`https://www.npmjs.com/package/${plugin.npmPackage}`}
            target="_blank"
            rel="noreferrer"
          >
            {plugin.npmPackage} on npm
          </a>{" "}
          for past releases.
        </>
      )}
    </p>
  );

  const tabs = [
    {
      key: "readme",
      label: "Readme",
      content: (
        <article className="hc-d-readme">
          <h2>Getting started</h2>
          <p>{plugin.description}</p>
          <pre>{`import { paperclip } from "@paperclip/core";
import ${camelize(plugin.npmPackage)} from "${plugin.npmPackage}";

paperclip.use(${camelize(plugin.npmPackage)}({
  // configuration goes here
}));`}</pre>
          <h2>Configuration</h2>
          <p>
            The plugin reads its configuration from environment variables by default, but every
            option can be overridden inline. Pass <code>debug: true</code> while wiring it up to get
            verbose logs scoped to this plugin only.
          </p>
          <h2>Capabilities</h2>
          <p>
            This plugin registers <code>{plugin.capabilities.length}</code>{" "}
            {plugin.capabilities.length === 1 ? "capability" : "capabilities"} with the Paperclip
            runtime — switch to the <em>Capabilities</em> tab for the full list.
          </p>
        </article>
      ),
    },
    {
      key: "capabilities",
      label: `Capabilities · ${plugin.capabilities.length}`,
      content: (
        <div className="hc-d-caps">
          {plugin.capabilities.map((c, i) => (
            <div key={c} className="hc-d-cap">
              <span className="rk">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <b>{c}</b>
                <small>{describeCapability(c)}</small>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "versions",
      label: plugin.version === "unknown" ? "Versions" : "Versions · 1",
      content: versionTab,
    },
    {
      key: "changelog",
      label: "Changelog",
      content: changelogTab,
    },
  ];

  const ownerPluginCount = allPlugins.filter((p) => p.category === plugin.category).length;

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
          <Link href="/" className="is-active">
            Browse
          </Link>
          <Link href="/?sort=newest">Collections</Link>
          <Link href="/?category=provider">Publishers</Link>
          <Link href="/submit">Submit</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="hc-header-actions">
          <Link href="https://paperclip.ing" className="hc-btn">
            Get Paperclip →
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="hc-d-crumb">
        <Link href="/">← back to the library</Link>
        <span>·</span>
        <Link href="/">Browse</Link>
        <span>/</span>
        <Link href={`/?category=${plugin.category}`}>{plugin.category}</Link>
        <span>/</span>
        <b>{plugin.name}</b>
      </div>

      {/* Title */}
      <section className="hc-d-title">
        <div className="hc-d-title-l">
          <div className="hc-d-cat">
            <span className="d" />
            {plugin.category}
            {verified && <span className="vfd">· verified · official</span>}
          </div>
          <h1>{plugin.name}.</h1>
          <p className="hc-d-tag">
            <em>{plugin.description}</em>
          </p>
          <div className="hc-d-meta">
            <div>
              <b>{fmtK(plugin.installs)}</b>
              <small>npm downloads / wk</small>
            </div>
            <div>
              <b>{plugin.version !== "unknown" ? `v${plugin.version}` : "—"}</b>
              <small>shipped {longDate(plugin.submittedAt)}</small>
            </div>
            <div>
              <b>{plugin.capabilities.length}</b>
              <small>{plugin.capabilities.length === 1 ? "capability" : "capabilities"}</small>
            </div>
            <div>
              <b>MIT</b>
              <small>license</small>
            </div>
          </div>
        </div>
        <div>
          <InstallCard cliCommand={cliCommand} npmCommand={npmCommand} pluginName={plugin.name} />
        </div>
      </section>

      {/* Tabs */}
      <section className="hc-d-tabs-wrap">
        <DetailTabs
          tabs={tabs}
          lastUpdated={`shipped ${longDate(plugin.submittedAt)}`}
          sidebar={
            <aside className="hc-d-side">
              <div className="hc-d-side-card">
                <div className="hc-d-side-hd">
                  <span className="eyebrow">§ author</span>
                </div>
                <div className="hc-d-author">
                  <div className="avatar">{plugin.author.name[0]?.toUpperCase()}</div>
                  <div>
                    <b>{plugin.author.name.toLowerCase()}</b>
                    <small>
                      {verified ? "Verified publisher · core team" : "Community publisher"}
                    </small>
                  </div>
                </div>
                <div className="hc-d-provenance">
                  {sourceHost && (
                    <div className="row">
                      <span>Published from</span>
                      <b>{sourceHost}</b>
                    </div>
                  )}
                  <div className="row">
                    <span>Package</span>
                    <b>{plugin.npmPackage}</b>
                  </div>
                  <div className="row">
                    <span>Submitted</span>
                    <b>{longDate(plugin.submittedAt)}</b>
                  </div>
                </div>
                <Link href={`/?category=${plugin.category}`} className="hc-d-author-link">
                  View all {ownerPluginCount} plugin{ownerPluginCount === 1 ? "" : "s"} in{" "}
                  {plugin.category} →
                </Link>
              </div>

              <div className="hc-d-side-card">
                <div className="hc-d-side-hd">
                  <span className="eyebrow">§ related plugins</span>
                </div>
                <div className="hc-d-related">
                  {related.length === 0 ? (
                    <span
                      style={{
                        fontFamily: "var(--hub-font-mono)",
                        fontSize: 11,
                        color: "var(--ink-3)",
                      }}
                    >
                      Nothing related yet.
                    </span>
                  ) : (
                    related.map((r) => (
                      <Link key={r.id} href={`/plugins/${r.slug}`} className="hc-d-related-row">
                        <div className="t">
                          <b>{r.name}</b>
                          <small>{r.npmPackage}</small>
                        </div>
                        <span className="m">{fmtK(r.installs)} dl/wk</span>
                      </Link>
                    ))
                  )}
                  <Link href={`/?category=${plugin.category}`} className="hc-d-related-more">
                    All in {plugin.category} →
                  </Link>
                </div>
              </div>

              <div className="hc-d-side-card">
                <div className="hc-d-side-hd">
                  <span className="eyebrow">§ links</span>
                </div>
                <div className="hc-d-links">
                  {plugin.sourceRepo && sourceHost && (
                    <a href={plugin.sourceRepo} target="_blank" rel="noreferrer">
                      ↗ {sourceHost}
                    </a>
                  )}
                  <a
                    href={`https://www.npmjs.com/package/${plugin.npmPackage}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ↗ npm · {plugin.npmPackage}
                  </a>
                  {plugin.sourceRepo && (
                    <a href={`${plugin.sourceRepo}/issues/new`} target="_blank" rel="noreferrer">
                      ↗ Report an issue
                    </a>
                  )}
                  <a
                    href={`https://github.com/sponsors/${plugin.author.name.toLowerCase()}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ↗ Sponsor this plugin
                  </a>
                </div>
              </div>
            </aside>
          }
        />
      </section>

      {/* Footer */}
      <footer className="hc-foot">
        <div className="l">
          <b>Paperclip</b>
          <span>The Hub — May 2026</span>
        </div>
        <div className="r">
          <Link href="/docs">Docs</Link>
          <Link href="/submit">Submit</Link>
          <Link href="https://github.com/lacymorrow/paperclip-hub">GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
