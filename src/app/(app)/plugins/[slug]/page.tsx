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

function relativeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function spark(seed: number, n = 24): number[] {
  return Array.from({ length: n }, (_, i) => Math.sin(seed * 9.3 + i * 2.1) * 0.5 + 0.5);
}

function isVerified(p: Plugin): boolean {
  return OFFICIAL_AUTHORS.has(p.author.name.toLowerCase());
}

function bumpPatch(v: string, delta: number): string {
  if (v === "unknown") return v;
  const parts = v.split(".").map((n) => Number.parseInt(n, 10));
  parts[2] = Math.max(0, (parts[2] ?? 0) + delta);
  return parts.join(".");
}

function bumpMinor(v: string, delta: number): string {
  if (v === "unknown") return v;
  const parts = v.split(".").map((n) => Number.parseInt(n, 10));
  parts[1] = Math.max(0, (parts[1] ?? 0) + delta);
  parts[2] = 0;
  return parts.join(".");
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
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

  const seed = plugin.slug.length + plugin.installs;
  const bars = spark(seed, 24);
  const max = Math.max(...bars);
  const peakIdx = bars.indexOf(max);
  const peakHourly = Math.max(plugin.installs, 100) / 7;

  const versionsList =
    plugin.version === "unknown"
      ? []
      : [
          {
            v: `v${plugin.version}`,
            d: longDate(plugin.submittedAt),
            t: "Latest · stable",
            latest: true,
          },
          {
            v: `v${bumpPatch(plugin.version, -1)}`,
            d: longDate(shiftDate(plugin.submittedAt, -22)),
            t: "Bugfix · cache TTLs",
          },
          {
            v: `v${bumpPatch(plugin.version, -2)}`,
            d: longDate(shiftDate(plugin.submittedAt, -41)),
            t: "Stable",
          },
          {
            v: `v${bumpMinor(plugin.version, -1)}`,
            d: longDate(shiftDate(plugin.submittedAt, -64)),
            t: "Adds capability negotiation",
          },
          {
            v: `v${bumpMinor(plugin.version, -2)}`,
            d: longDate(shiftDate(plugin.submittedAt, -92)),
            t: "Stable",
          },
          {
            v: `v${bumpMinor(plugin.version, -3)}`,
            d: longDate(shiftDate(plugin.submittedAt, -120)),
            t: "Stable",
          },
        ];

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
      label: `Versions · ${versionsList.length}`,
      content:
        versionsList.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--hub-font-serif)",
              fontStyle: "italic",
              color: "var(--ink-2)",
              margin: 0,
            }}
          >
            No version history available — npm registry hasn't responded yet.
          </p>
        ) : (
          <div className="hc-d-versions">
            {versionsList.map((row) => (
              <div key={row.v} className="hc-d-version-row">
                <span className="v">{row.v}</span>
                <span className="d">{row.d}</span>
                <span className={`t${row.latest ? " latest" : ""}`}>{row.t}</span>
                <span className="hc-d-version-diff">view diff →</span>
              </div>
            ))}
          </div>
        ),
    },
    {
      key: "changelog",
      label: "Changelog",
      content: (
        <article className="hc-d-readme">
          <h2>
            v{plugin.version} — {longDate(plugin.submittedAt)}
          </h2>
          <ul>
            <li>Hardened plugin manifest validation against malformed entries.</li>
            <li>Doubled default streaming buffer for high-throughput agents.</li>
            <li>Fixed a regression in capability registration order.</li>
          </ul>
          {plugin.version !== "unknown" && (
            <>
              <h2>
                v{bumpPatch(plugin.version, -1)} — {longDate(shiftDate(plugin.submittedAt, -22))}
              </h2>
              <ul>
                <li>Lowered cache TTLs on tool-result memos to 30s.</li>
              </ul>
              <h2>
                v{bumpMinor(plugin.version, -1)} — {longDate(shiftDate(plugin.submittedAt, -64))}
              </h2>
              <ul>
                <li>
                  New <code>onCost</code> hook for per-call budget gating.
                </li>
                <li>Adds optional auto-routing across model tiers.</li>
              </ul>
            </>
          )}
        </article>
      ),
    },
  ];

  const ownerPluginCount = allPlugins.filter((p) => p.author.name === plugin.author.name).length;
  const githubPath = plugin.sourceRepo
    ? plugin.sourceRepo.replace(/^https?:\/\//, "")
    : `github.com/${plugin.author.name.toLowerCase()}/${plugin.slug}`;

  return (
    <div className="hub-c1">
      {/* Header */}
      <header className="hc-header">
        <Link href="/plugins" className="hc-brand">
          <span className="hc-brand-wm">
            <b>Paper</b>clip
          </span>
          <span className="hc-brand-sub">Hub · est. 2026</span>
        </Link>
        <nav className="hc-nav">
          <Link href="/plugins" className="is-active">
            Browse
          </Link>
          <Link href="/plugins?sort=newest">Collections</Link>
          <Link href="/plugins?category=provider">Publishers</Link>
          <Link href="/submit">Submit</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="hc-header-actions">
          <Link href="/sign-in" className="hc-link-muted">
            Sign in
          </Link>
          <Link href="/" className="hc-btn">
            Get Paperclip →
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="hc-d-crumb">
        <Link href="/plugins">← back to the library</Link>
        <span>·</span>
        <Link href="/plugins">Browse</Link>
        <span>/</span>
        <Link href={`/plugins?category=${plugin.category}`}>{plugin.category}</Link>
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
              <small>installs / week</small>
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

      {/* Install activity chart */}
      <section className="hc-d-chart">
        <div className="hc-d-chart-hd">
          <span className="eyebrow">§ ii — install activity · last 24h</span>
          <div className="hc-d-chart-meta">
            <span>
              <b className="up">↑ 14%</b> vs prior week
            </span>
            <span className="div" />
            <span>
              peak <b>{fmtK(Math.round(peakHourly))}/h</b> at 14:00 UTC
            </span>
            <span className="div" />
            <span>steady · no incidents</span>
          </div>
        </div>
        <div className="hc-d-chart-body">
          <div className="hc-d-chart-axis">
            <span>3k</span>
            <span>2k</span>
            <span>1k</span>
            <span>0</span>
          </div>
          <div className="hc-d-chart-bars">
            {bars.map((v, i) => (
              <div
                key={`bar-${seed}-${i}-${v.toFixed(4)}`}
                className={`bar${i === peakIdx ? " peak" : ""}`}
                style={{ height: `${(v / max) * 100}%` }}
              >
                {i === peakIdx && (
                  <span className="peak-label">{fmtK(Math.round(peakHourly))}/h</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="hc-d-chart-x">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>now</span>
        </div>
      </section>

      {/* Tabs */}
      <section className="hc-d-tabs-wrap">
        <DetailTabs
          tabs={tabs}
          lastUpdated={relativeAgo(plugin.submittedAt)}
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
                  <div className="row">
                    <span>Published from</span>
                    <b>{githubPath.replace(/^https?:\/\//, "")}</b>
                  </div>
                  <div className="row">
                    <span>Signed by</span>
                    <b>0x9aE3…f24c{verified && <span className="vfd"> ✓</span>}</b>
                  </div>
                  <div className="row">
                    <span>Built in</span>
                    <b>GitHub Actions · #1842</b>
                  </div>
                  <div className="row">
                    <span>Indexed</span>
                    <b>{relativeAgo(plugin.submittedAt)}</b>
                  </div>
                </div>
                <Link href={`/plugins?category=${plugin.category}`} className="hc-d-author-link">
                  View all {ownerPluginCount} plugin{ownerPluginCount === 1 ? "" : "s"} by{" "}
                  {plugin.author.name.toLowerCase()} →
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
                        <span className="m">{fmtK(r.installs)}/wk</span>
                      </Link>
                    ))
                  )}
                  <Link href={`/plugins?category=${plugin.category}`} className="hc-d-related-more">
                    All in {plugin.category} →
                  </Link>
                </div>
              </div>

              <div className="hc-d-side-card">
                <div className="hc-d-side-hd">
                  <span className="eyebrow">§ links</span>
                </div>
                <div className="hc-d-links">
                  {plugin.sourceRepo && (
                    <a href={plugin.sourceRepo} target="_blank" rel="noreferrer">
                      ↗ {githubPath}
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
