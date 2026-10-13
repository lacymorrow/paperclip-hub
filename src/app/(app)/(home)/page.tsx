import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BuildAndServeLink } from "@/components/site/build-and-serve-link";
import { SiteFooter } from "@/components/site/site-footer";
import { CATEGORIES, filterPlugins } from "@/data/plugins";
import { getPlugins } from "@/lib/registry";

import "../plugins/hub.css";

const HOME_TITLE = "Paperclip Hub | Plugins for Paperclip";
const HOME_DESCRIPTION =
  "The plugin directory for Paperclip. Browse connectors, providers, tools, and memory backends, published by the community and installable with one command.";
const HOME_OG_IMAGE = `/og?${new URLSearchParams({
  title: "Paperclip Hub",
  description: "The plugin directory for Paperclip.",
  url: "cliphub.fyi",
}).toString()}`;

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "https://cliphub.fyi/",
    types: { "application/json": "/plugins.json" },
  },
  keywords: [
    "Paperclip",
    "Paperclip plugin",
    "Paperclip plugins",
    "Paperclip registry",
    "Paperclip Hub",
    "agent plugin",
    "AI agent plugin",
  ],
  openGraph: {
    type: "website",
    url: "https://cliphub.fyi/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    siteName: "Paperclip Hub",
    images: [{ url: HOME_OG_IMAGE, width: 1200, height: 630, alt: "Paperclip Hub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [HOME_OG_IMAGE],
  },
};

interface HomePageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}

const SORT_LABELS: Record<string, string> = {
  popular: "Most downloaded",
  newest: "Newest",
};

function fmtK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

function handle(name: string): string {
  return name.replace(/^@/, "").toLowerCase();
}

function shortDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function buildHref(
  base: string,
  params: { q?: string; category?: string; sort?: string; page?: string },
  patch: Record<string, string | undefined>
): string {
  const merged = { ...params, ...patch };
  if (!("page" in patch)) delete merged.page;
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

  const isSearching = Boolean(params.q);
  const baseResults = results;
  const PAGE_SIZE = 8;
  const page = Math.max(1, Number.parseInt(params.page ?? "", 10) || 1);
  const totalPages = Math.ceil(baseResults.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const gridStart = (safePage - 1) * PAGE_SIZE;
  const grid = baseResults.slice(gridStart, gridStart + PAGE_SIZE);

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

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "https://cliphub.fyi/",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: allPlugins.length,
      itemListElement: allPlugins.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://cliphub.fyi/plugins/${p.slug}`,
        name: p.name,
      })),
    },
  };

  return (
    <div className="hub-c1">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      {/* Header */}
      <header className={`hc-header${isSearching ? "" : " hc-header--ondark"}`}>
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
          {!isSearching && (
            <form action="/" method="get" className="hc-hd-search" aria-label="Search plugins">
              <Search size={16} aria-hidden />
              <input name="q" placeholder="Search the library" aria-label="Search plugins" />
            </form>
          )}
          <Link href="https://paperclip.ing" className="hc-btn">
            Get Paperclip →
          </Link>
        </div>
      </header>

      {isSearching ? (
        <section className="hc-search-bar">
          <h1 className="sr-only">Search results</h1>
          <form action="/" method="get" className="hc-hero-search" aria-label="Search plugins">
            <Search size={20} aria-hidden />
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
          {/* Hero — "Signal" (board-approved, LAC-3358) */}
          <section className="hc-signal">
            <div className="hc-signal-arc" aria-hidden>
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="hc-signal-fade" aria-hidden />
            <div className="hc-signal-in">
              <h1>
                Every tool your
                <br />
                agents need.
              </h1>
              <p>
                The open directory of plugins for Paperclip. Connectors, providers, tools and
                memory, installed in one line.
              </p>
              <div>
                <Link href="#directory" className="hc-signal-cta">
                  Browse the library
                </Link>
              </div>
              <div className="hc-signal-alt">
                or run <code>npx paperclipai plugin install</code>
              </div>
              <div className="hc-signal-stats">
                <span>
                  <b>{allPlugins.length}</b> plugins
                </span>
                <span className="sep">·</span>
                <span>
                  <b>{publisherCount}</b> publishers
                </span>
                <span className="sep">·</span>
                <span>
                  <b>{totalInstallsLabel}</b> downloads / wk
                </span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Section header */}
      <div className="hc-section-hd" id="directory">
        <div className="l">
          <span className="eyebrow">The directory</span>
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
              aria-current={c.key === activeCategory ? "true" : undefined}
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
              <ChevronDown size={11} aria-hidden />
            </summary>
            <div className="hc-sort-menu">
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <Link
                  key={key}
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
            {isSearching ? (
              <>
                <b>No plugin for that yet.</b>
                <p>
                  <BuildAndServeLink placement="empty-search">Build &amp; Serve</BuildAndServeLink>{" "}
                  builds custom Paperclip plugins.
                </p>
              </>
            ) : (
              <b>Nothing in this view.</b>
            )}
            <div className="hc-empty-actions">
              <Link href="/">Clear filters</Link>
              <Link href="/submit">Submit a plugin</Link>
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
                    <span>@{handle(p.author.name)}</span>
                  </div>
                  <span className="hc-btn-mock" aria-hidden>
                    Install
                    <ArrowRight size={11} aria-hidden />
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
              Publish a package to npm with a Paperclip manifest, then open a pull request. CI
              checks the manifest and your npm ownership, and the Hub indexes it.
            </p>
            <Link href="/submit" className="hc-submit-cta">
              Submit a plugin →
            </Link>
            <p className="hc-submit-feature">
              <Link href="/support#business">Feature your plugin</Link>
            </p>
          </div>
        </aside>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="hc-pagination">
          <div className="hc-pagination-info">
            Page {safePage} of {totalPages}
          </div>
          <div className="hc-pagination-arrows">
            {safePage > 1 ? (
              <Link
                href={buildHref("/", params, { page: String(safePage - 1) })}
                className="hc-pagination-link"
              >
                <ChevronLeft size={14} aria-hidden />
                Previous
              </Link>
            ) : (
              <span className="hc-pagination-link is-disabled">
                <ChevronLeft size={14} aria-hidden />
                Previous
              </span>
            )}
            {safePage < totalPages ? (
              <Link
                href={buildHref("/", params, { page: String(safePage + 1) })}
                className="hc-pagination-link"
              >
                Next
                <ChevronRight size={14} aria-hidden />
              </Link>
            ) : (
              <span className="hc-pagination-link is-disabled">
                Next
                <ChevronRight size={14} aria-hidden />
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recently shipped */}
      <section className="hc-recent">
        <div className="hc-recent-hd">
          <div>
            <span className="eyebrow">Recently added</span>
            <h2>
              Newest <em>additions.</em>
            </h2>
          </div>
        </div>
        <div className="hc-recent-row">
          {recent.map((p) => (
            <Link key={p.id} href={`/plugins/${p.slug}`} className="hc-recent-card">
              <span className="stamp">{p.version !== "unknown" ? `v${p.version}` : "new"}</span>
              <b>{p.name}</b>
              <p>{p.description.split(".")[0]}.</p>
              <div className="meta">
                <span>@{handle(p.author.name)}</span>
                <span className="ver">{shortDate(p.submittedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
