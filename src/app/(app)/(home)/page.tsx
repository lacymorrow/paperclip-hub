import type { Metadata } from "next";
import Link from "next/link";
import type { Plugin } from "@/data/plugins";
import { CATEGORIES, filterPlugins } from "@/data/plugins";
import { getPlugins } from "@/lib/registry";

import "../plugins/hub.css";

export const metadata: Metadata = {
  title: "Paperclip Hub — A registry for autonomous teams",
  description:
    "The Paperclip Hub is a curated directory of connectors, providers, tools and memory backends for Paperclip — published by the community, indexed nightly, installed in one line.",
};

interface HomePageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

const SORT_LABELS: Record<string, string> = {
  popular: "Most downloaded",
  newest: "Newest",
};

function fmtK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

function shortDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function pickFeatured(all: Plugin[]): Plugin | undefined {
  return [...all].sort((a, b) => b.installs - a.installs)[0];
}

function buildHref(
  base: string,
  params: { q?: string; category?: string; sort?: string },
  patch: Record<string, string | undefined>
): string {
  const merged = { ...params, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [params, allPlugins] = await Promise.all([searchParams, getPlugins()]);

  const sortKey = params.sort ?? "popular";
  const activeCategory = params.category ?? "all";

  const results = filterPlugins(allPlugins, {
    search: params.q,
    category: params.category,
    sort: sortKey,
  });

  const featured = pickFeatured(allPlugins);
  const isSearching = Boolean(params.q);
  const isFiltered = activeCategory !== "all";
  const baseResults =
    featured && !isSearching && !isFiltered
      ? results.filter((p) => p.slug !== featured.slug)
      : results;
  const grid = baseResults.slice(0, isSearching ? 24 : 8);

  const trending = [...allPlugins].sort((a, b) => b.installs - a.installs).slice(0, 5);
  const recent = [...allPlugins]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 4);

  const totalInstalls = allPlugins.reduce((s, p) => s + p.installs, 0);
  const publisherCount = new Set(allPlugins.map((p) => p.author.name)).size;
  const totalInstallsLabel = totalInstalls > 0 ? `${fmtK(totalInstalls)}` : "—";

  const cats = CATEGORIES.map((c) => ({
    key: c.value,
    label: c.value === "all" ? "All plugins" : c.label.toLowerCase(),
    count:
      c.value === "all"
        ? allPlugins.length
        : allPlugins.filter((p) => p.category === c.value).length,
  })).filter((c) => c.key === "all" || c.count > 0 || c.key === activeCategory);

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

      {isSearching ? (
        <section className="hc-search-bar">
          <form action="/" method="get" className="hc-hero-search" aria-label="Search plugins">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink-2)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder={'Try "github", "memory", "discord"…'}
              aria-label="Search plugins"
            />
            <button type="submit">Search</button>
          </form>
          <span className="hc-search-count">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{params.q}&rdquo;
          </span>
        </section>
      ) : (
        <>
          {/* Hero */}
          <section className="hc-hero">
            <div className="hc-hero-l">
              <div className="hc-eyebrow">
                <span className="vol">Paperclip Hub</span>
                <span>
                  The plugin directory for{" "}
                  <Link href="https://paperclip.ing">Paperclip</Link>.
                </span>
              </div>
              <h1>
                Plugins for <em>autonomous</em>
                <span className="s">teams that build with agents.</span>
              </h1>
              <p>
                The Paperclip Hub is a curated directory of connectors, providers, tools and memory
                backends — published by the community, indexed nightly, installed in one line.
              </p>
              <form action="/" method="get" className="hc-hero-search" aria-label="Search plugins">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ink-2)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder={'Try "github", "memory", "discord"…'}
                  aria-label="Search plugins"
                />
                <button type="submit">Search</button>
              </form>
              <div className="hc-hero-meta">
                <div>
                  <b>{allPlugins.length}</b>
                  <small>plugins indexed</small>
                </div>
                <div>
                  <b>{publisherCount}</b>
                  <small>publishers</small>
                </div>
                <div>
                  <b>{totalInstallsLabel}</b>
                  <small>npm downloads / wk</small>
                </div>
              </div>
            </div>

            <div className="hc-hero-r">
              {featured && (
                <article className="hc-poster">
                  <div className="hc-poster-head">
                    <span>Featured plugin</span>
                    <span className="stamp">Top Plugin</span>
                  </div>
                  <div className="hc-poster-rule" />
                  <div className="hc-poster-cat">
                    <span className="d" />
                    {featured.category} · by @{featured.author.name.toLowerCase()}
                  </div>
                  <h2>
                    <Link href={`/plugins/${featured.slug}`}>
                      {featured.name}.<em> Wired into Paperclip.</em>
                    </Link>
                  </h2>
                  <span className="hc-poster-pkg">$ {featured.installCommand}</span>
                  <p className="hc-poster-desc">{featured.description}</p>
                  <div className="hc-poster-foot">
                    <div>
                      <b>{fmtK(featured.installs)}</b>
                      <small>downloads / wk</small>
                    </div>
                    <div>
                      <b>v{featured.version}</b>
                      <small>{shortDate(featured.submittedAt)}</small>
                    </div>
                    <Link href={`/plugins/${featured.slug}`} className="hc-poster-cta">
                      Install
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              )}
            </div>
          </section>

          {/* Ticker */}
          <div className="hc-ticker">
            <span>
              <span className="star">●</span> Registry
            </span>
            <span className="div" />
            <span>
              <b>{allPlugins.length}</b> plugins indexed
            </span>
            <span className="div" />
            <span>
              <b>{publisherCount}</b> publishers
            </span>
          </div>
        </>
      )}

      {/* Section header */}
      <div className="hc-section-hd">
        <div className="l">
          <span className="eyebrow">§ ii — the directory</span>
          <h2>
            Browse the <em>shelves.</em>
          </h2>
        </div>
        <div className="r">
          <b>{results.length}</b> plugins
        </div>
      </div>

      {/* Toolbar */}
      <div className="hc-toolbar">
        <div className="hc-pills">
          {cats.map((c) => (
            <Link
              key={c.key}
              href={buildHref("/", params, {
                category: c.key === "all" ? undefined : c.key,
              })}
              className={`hc-pill${c.key === activeCategory ? " is-active" : ""}`}
            >
              {c.key !== "all" && <span className="pl-dot" />}
              {c.label}
              <small>·{c.count}</small>
            </Link>
          ))}
        </div>
        <div className="hc-toolbar-r">
          <details className="hc-sort">
            <summary>
              <small>Sort</small>
              <b>{SORT_LABELS[sortKey] ?? SORT_LABELS.popular}</b>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <div className="hc-sort-menu" role="menu">
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <Link
                  key={key}
                  role="menuitem"
                  href={buildHref("/", params, {
                    sort: key === "popular" ? undefined : key,
                  })}
                  className={`hc-sort-item${key === sortKey ? " is-active" : ""}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Body — grid + sidebar */}
      <div className="hc-body">
        {grid.length === 0 ? (
          <div className="hc-empty-state">
            No plugins found. Try adjusting the filters.
            <div className="hc-empty-clear">
              <Link href="/">Clear all filters</Link>
            </div>
          </div>
        ) : (
          <div className="hc-grid">
            {grid.map((p) => (
              <Link key={p.id} href={`/plugins/${p.slug}`} className="hc-card">
                <div className="hc-card-cat">
                  <span className="d" />
                  {p.category}
                </div>
                <h3>
                  {p.name}{" "}
                  <span className="ver">{p.version !== "unknown" ? `v${p.version}` : "—"}</span>
                </h3>
                <span className="hc-card-pkg">{p.npmPackage}</span>
                <p className="hc-card-desc">{p.description}</p>
                <div className="hc-card-foot">
                  <div className="l">
                    <span>
                      <b>{fmtK(p.installs)}</b>/wk
                    </span>
                    <span>@{p.author.name.toLowerCase()}</span>
                  </div>
                  <span className="hc-btn-mock" aria-hidden>
                    Install
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <aside className="hc-side">
          <div className="hc-side-card">
            <div className="hc-side-hd">
              <h3>
                The <em>top five.</em>
              </h3>
            </div>
            <div className="hc-trend">
              {trending.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/plugins/${p.slug}`}
                  className={`hc-trend-row${i === 0 ? " top" : ""}`}
                >
                  <span className="rk">{String(i + 1).padStart(2, "0")}</span>
                  <div className="bd">
                    <b>{p.name}</b>
                    <small>
                      {p.category} · {fmtK(p.installs)} dl/wk
                    </small>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="hc-side-card dark hc-submit">
            <h3>
              Have a plugin? <em>Ship it.</em>
            </h3>
            <p>
              The Hub is fully open. Any npm package that exposes a Paperclip manifest gets indexed
              nightly — no review queue, no waitlist. Publish to npm, tag{" "}
              <code>paperclip-plugin</code>, we do the rest.
            </p>
            <Link href="/submit" className="hc-submit-cta">
              Submit a plugin →
            </Link>
          </div>
        </aside>
      </div>

      {/* Recently shipped */}
      <section className="hc-recent">
        <div className="hc-recent-hd">
          <div>
            <span className="eyebrow">§ iii — freshly shipped</span>
            <h2>
              Just <em>off the press.</em>
            </h2>
          </div>
          <span className="text-muted-foreground">freshly shipped</span>
        </div>
        <div className="hc-recent-row">
          {recent.map((p) => (
            <Link key={p.id} href={`/plugins/${p.slug}`} className="hc-recent-card">
              <span className="stamp">
                New · {p.version !== "unknown" ? `v${p.version}` : "fresh"}
              </span>
              <b>{p.name}</b>
              <p>{p.description.split(".")[0]}.</p>
              <div className="meta">
                <span>@{p.author.name.toLowerCase()}</span>
                <span className="ver">{shortDate(p.submittedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
