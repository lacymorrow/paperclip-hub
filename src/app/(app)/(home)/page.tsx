import { Suspense } from "react";
import { Activity, ArrowRight, BookOpen, Brain, Code2, KeyRound, Package2, Wrench } from "lucide-react";
import type { Metadata } from "next";

import { CategoryTabs } from "@/components/marketplace/category-tabs";
import { PluginCard } from "@/components/marketplace/plugin-card";
import { SearchBar } from "@/components/marketplace/search-bar";
import { SortSelect } from "@/components/marketplace/sort-select";
import { CATEGORIES } from "@/data/plugins";
import { filterPlugins } from "@/data/plugins";
import { getPlugins } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Paperclip Hub — Plugin Marketplace for AI Agents",
  description:
    "Discover, install, and share plugins that give your Paperclip agents new capabilities — from auth providers to observability hooks.",
};

const PAPERCLIP_ICON = (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" />
    <path d="M16 8v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4V8" />
    <path d="M8 12v4a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-4" />
    <line x1="12" y1="20" x2="12" y2="22" />
  </svg>
);

const CATEGORY_META: Record<
  string,
  { icon: React.ElementType; bg: string; color: string; description: string }
> = {
  auth: {
    icon: KeyRound,
    bg: "rgba(99,102,241,0.12)",
    color: "#818CF8",
    description:
      "Authentication providers for Claude, GitHub Copilot, Anthropic, Gemini, and GitLab.",
  },
  provider: {
    icon: Package2,
    bg: "rgba(236,72,153,0.12)",
    color: "#F472B6",
    description: "LLM and service provider integrations that extend agent capabilities.",
  },
  tools: {
    icon: Wrench,
    bg: "rgba(245,158,11,0.12)",
    color: "#FBBF24",
    description: "Extend your agent with new tools — shell commands, file operations, workflows.",
  },
  integration: {
    icon: Code2,
    bg: "rgba(16,185,129,0.12)",
    color: "#34D399",
    description:
      "Connect agents to external services — CI/CD, version control, code review tools.",
  },
  observability: {
    icon: Activity,
    bg: "rgba(244,63,94,0.12)",
    color: "#FB7185",
    description: "Tracing, metrics, and logging with OpenTelemetry, Langfuse, and Braintrust.",
  },
  memory: {
    icon: Brain,
    bg: "rgba(6,182,212,0.12)",
    color: "#22D3EE",
    description: "Persistent memory and context management for long-running agent sessions.",
  },
};

const QUICK_TAGS = ["auth", "opentelemetry", "langfuse", "anthropic", "memory", "gemini"];

interface HomePageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [params, allPlugins] = await Promise.all([searchParams, getPlugins()]);

  const isFiltered = !!(
    params.q ||
    (params.category && params.category !== "all") ||
    params.sort
  );

  const results = isFiltered
    ? filterPlugins(allPlugins, {
        search: params.q,
        category: params.category,
        sort: params.sort,
      })
    : allPlugins;

  const topPlugins = [...allPlugins]
    .sort((a, b) => b.installs - a.installs)
    .slice(0, 6);

  const recent = [...allPlugins]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 6);

  const categoryCounts = allPlugins.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  const totalInstalls = allPlugins.reduce((sum, p) => sum + p.installs, 0);

  function formatNum(n: number): string {
    if (n >= 1000) return `${Math.round(n / 1000)}k+`;
    return n.toString();
  }

  return (
    <div className="bg-[#06070B] min-h-screen text-[#E8ECF4] overflow-x-hidden">
      {/* Noise overlay */}
      <div
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
        aria-hidden="true"
      />

      {/* ===== DARK NAV ===== */}
      <nav
        className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between gap-4 px-6 border border-[#1E2335] rounded-2xl"
        style={{
          height: "60px",
          background: "rgba(10,12,19,0.72)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        }}
      >
        <a href="/" className="flex items-center gap-2 font-bold text-[#E8ECF4] text-lg">
          {PAPERCLIP_ICON}
          <span>Paperclip Hub</span>
        </a>

        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0 text-sm font-medium">
          <li>
            <a href="/" className="text-[#A78BFA] transition-colors">
              Plugins
            </a>
          </li>
          <li>
            <a
              href="/docs/plugins"
              className="text-[#8891A5] hover:text-[#E8ECF4] transition-colors"
            >
              Docs
            </a>
          </li>
          <li>
            <a
              href="/submit"
              className="text-[#8891A5] hover:text-[#E8ECF4] transition-colors"
            >
              Submit
            </a>
          </li>
        </ul>

        <a
          href="/submit"
          className="hidden md:inline-flex items-center text-sm font-semibold text-white px-3.5 py-1.5 rounded-[10px] transition-all hover:-translate-y-px"
          style={{
            background: "#7C6BFF",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "#A78BFA";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "#7C6BFF";
          }}
        >
          Submit Plugin
        </a>
      </nav>

      {isFiltered ? (
        /* ===== BROWSE MODE ===== */
        <div className="pt-28">
          {/* Grid bg */}
          <div
            className="absolute inset-0 z-0 pointer-events-none opacity-35 top-16"
            style={{
              backgroundImage:
                "linear-gradient(#1E2335 1px, transparent 1px), linear-gradient(90deg, #1E2335 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage:
                "radial-gradient(ellipse 60% 50% at 50% 20%, black 20%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 50% at 50% 20%, black 20%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-6xl px-6 relative z-10">
            <div className="mb-6">
              <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-[#E8ECF4]">
                Browse Plugins
              </h1>
              <p className="text-[#8891A5] text-sm mt-1">
                {results.length} of {allPlugins.length} plugin
                {allPlugins.length !== 1 ? "s" : ""} in registry
              </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 py-5 border-b border-[#1E2335] mb-6">
              <div className="flex-1 min-w-0">
                <Suspense fallback={<div className="h-10" />}>
                  <CategoryTabs />
                </Suspense>
              </div>
              <div className="flex items-center gap-3">
                <Suspense fallback={<div className="h-[44px] w-56" />}>
                  <SearchBar className="w-56" dark />
                </Suspense>
                <Suspense fallback={<div className="h-[44px] w-36" />}>
                  <SortSelect dark />
                </Suspense>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#262D42] p-16 text-center">
                <p className="text-[#E8ECF4] font-medium text-lg">No plugins found</p>
                <p className="mt-1 text-sm text-[#565E73]">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((plugin) => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    href={`/plugins/${plugin.slug}`}
                    dark
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===== MARKETING MODE ===== */
        <>
          {/* ===== HERO ===== */}
          <section
            className="relative overflow-hidden"
            style={{ paddingTop: "140px", paddingBottom: "96px" }}
          >
            {/* Grid background */}
            <div
              className="absolute inset-0 z-0 pointer-events-none opacity-35"
              style={{
                backgroundImage:
                  "linear-gradient(#1E2335 1px, transparent 1px), linear-gradient(90deg, #1E2335 1px, transparent 1px)",
                backgroundSize: "64px 64px",
                maskImage:
                  "radial-gradient(ellipse 60% 50% at 50% 40%, black 20%, transparent 70%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 60% 50% at 50% 40%, black 20%, transparent 70%)",
              }}
              aria-hidden="true"
            />

            {/* Glow blobs */}
            <div
              className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
              style={{
                background: "radial-gradient(circle, #7C6BFF 0%, transparent 70%)",
                opacity: 0.12,
              }}
              aria-hidden="true"
            />
            <div
              className="absolute bottom-[-50px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
              style={{
                background: "radial-gradient(circle, #FF6B4A 0%, transparent 70%)",
                opacity: 0.08,
              }}
              aria-hidden="true"
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none z-0"
              style={{
                background: "radial-gradient(circle, #2DD4BF 0%, transparent 70%)",
                opacity: 0.06,
              }}
              aria-hidden="true"
            />

            {/* Constellation */}
            <div
              className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden md:block"
              aria-hidden="true"
            >
              <svg viewBox="0 0 1400 600" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1050" y1="120" x2="1180" y2="200" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1180" y1="200" x2="1250" y2="350" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1050" y1="120" x2="1100" y2="280" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1100" y1="280" x2="1250" y2="350" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1100" y1="280" x2="1180" y2="200" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1250" y1="350" x2="1320" y2="250" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1180" y1="200" x2="1320" y2="250" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1050" y1="120" x2="980" y2="220" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="980" y1="220" x2="1100" y2="280" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1250" y1="350" x2="1200" y2="450" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1100" y1="280" x2="1050" y2="400" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="1050" y1="400" x2="1200" y2="450" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="980" y1="220" x2="900" y2="320" />
                <line stroke="#1E2335" strokeWidth="0.5" opacity="0.5" x1="900" y1="320" x2="1050" y2="400" />
                <circle cx="1050" cy="120" r="4" fill="#A78BFA" />
                <circle cx="1180" cy="200" r="3" fill="#262D42" />
                <circle cx="1250" cy="350" r="3" fill="#FF8A70" />
                <circle cx="1100" cy="280" r="3" fill="#262D42" />
                <circle cx="1320" cy="250" r="3" fill="#5EEAD4" />
                <circle cx="980" cy="220" r="3" fill="#262D42" />
                <circle cx="1200" cy="450" r="3" fill="#262D42" />
                <circle cx="1050" cy="400" r="3" fill="#262D42" />
                <circle cx="900" cy="320" r="3" fill="#262D42" />
                <circle cx="850" cy="150" r="1.5" fill="#262D42" opacity="0.4" />
                <circle cx="1350" cy="180" r="1.5" fill="#262D42" opacity="0.3" />
                <circle cx="920" cy="430" r="1.5" fill="#262D42" opacity="0.5" />
              </svg>
            </div>

            {/* Hero content */}
            <div className="container mx-auto max-w-6xl px-6 relative z-10">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-6"
                style={{
                  background: "rgba(124,107,255,0.15)",
                  color: "#A78BFA",
                  border: "1px solid rgba(124,107,255,0.2)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] inline-block" />
                Open plugin ecosystem
              </div>

              {/* Title */}
              <h1
                className="font-extrabold tracking-[-0.035em] leading-[1.05] max-w-[720px] mb-6 text-[#E8ECF4]"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
              >
                Extend your agents
                <br />
                with{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #A78BFA 0%, #FF8A70 50%, #5EEAD4 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  community plugins
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="text-[#8891A5] max-w-[540px] leading-[1.6] mb-8"
                style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)" }}
              >
                Discover, install, and share plugins that give your Paperclip agents new
                capabilities — from auth providers to observability hooks.
              </p>

              {/* Hero search */}
              <div className="max-w-[520px] w-full relative">
                <Suspense fallback={<div className="h-14" />}>
                  <SearchBar dark heroSize />
                </Suspense>
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {QUICK_TAGS.map((tag) => (
                  <a
                    key={tag}
                    href={`/?category=${tag}`}
                    className="text-xs px-3 py-1 rounded-full border border-[#1E2335] text-[#565E73] transition-all hover:border-[#7C6BFF] hover:text-[#A78BFA]"
                    style={{ background: "transparent" }}
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* ===== STATS STRIP ===== */}
          <div className="container mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap gap-8 py-8 border-t border-b border-[#1E2335]">
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold leading-none text-[#A78BFA]">
                  {allPlugins.length}
                </span>
                <span className="text-[#565E73] text-sm mt-1">Plugins</span>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold leading-none text-[#FF8A70]">
                  {CATEGORIES.filter((c) => c.value !== "all").length}
                </span>
                <span className="text-[#565E73] text-sm mt-1">Categories</span>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold leading-none text-[#5EEAD4]">9</span>
                <span className="text-[#565E73] text-sm mt-1">Hook types</span>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold leading-none text-[#E8ECF4]">
                  {formatNum(totalInstalls)}
                </span>
                <span className="text-[#565E73] text-sm mt-1">Weekly installs</span>
              </div>
            </div>
          </div>

          {/* ===== CATEGORIES ===== */}
          <section className="container mx-auto max-w-6xl px-6 py-24">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[#E8ECF4]">
                  Browse by category
                </h2>
                <p className="text-[#8891A5] mt-1 text-[0.9375rem]">
                  Find the right plugin for your use case
                </p>
              </div>
            </div>

            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.filter((c) => c.value !== "all").map((cat) => {
                const meta = CATEGORY_META[cat.value];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <a
                    key={cat.value}
                    href={`/?category=${cat.value}`}
                    className="group flex flex-col gap-3 p-6 rounded-2xl border border-[#1E2335] bg-[#161922] transition-all hover:border-[#3A4260] hover:-translate-y-0.5"
                    style={{
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-[10px] flex items-center justify-center"
                      style={{ background: meta.bg }}
                    >
                      <Icon style={{ width: "24px", height: "24px", color: meta.color }} />
                    </div>
                    <div>
                      <h3 className="text-[1.125rem] font-semibold text-[#E8ECF4]">{cat.label}</h3>
                      <span
                        className="text-xs font-mono"
                        style={{ color: "#565E73" }}
                      >
                        {categoryCounts[cat.value] ?? 0} plugins
                      </span>
                    </div>
                    <p className="text-sm text-[#8891A5] leading-[1.5]">{meta.description}</p>
                  </a>
                );
              })}
            </div>
          </section>

          {/* ===== POPULAR PLUGINS ===== */}
          <section className="container mx-auto max-w-6xl px-6 pb-24">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[#E8ECF4]">
                  Popular plugins
                </h2>
                <p className="text-sm text-[#8891A5] mt-1">Most downloaded this week</p>
              </div>
              <a
                href="/?sort=popular"
                className="flex items-center gap-1 text-sm font-medium text-[#A78BFA] hover:text-[#7C6BFF] transition-colors"
              >
                View all <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topPlugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  href={`/plugins/${plugin.slug}`}
                  dark
                />
              ))}
            </div>
          </section>

          {/* ===== RECENTLY ADDED ===== */}
          <section className="container mx-auto max-w-6xl px-6 pb-24">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[#E8ECF4]">
                  Recently added
                </h2>
                <p className="text-sm text-[#8891A5] mt-1">New arrivals in the registry</p>
              </div>
              <a
                href="/?sort=newest"
                className="flex items-center gap-1 text-sm font-medium text-[#A78BFA] hover:text-[#7C6BFF] transition-colors"
              >
                View all <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  href={`/plugins/${plugin.slug}`}
                  dark
                />
              ))}
            </div>
          </section>

          {/* ===== CTA ===== */}
          <section className="container mx-auto max-w-6xl px-6 pb-24">
            {/* Glow line */}
            <div
              className="w-full h-px mb-16 opacity-40"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #7C6BFF, #FF6B4A, transparent)",
              }}
            />

            <div
              className="relative overflow-hidden rounded-2xl border border-[#1E2335] px-8 py-16 text-center sm:px-12"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,107,255,0.08) 0%, rgba(255,107,74,0.06) 100%)",
              }}
            >
              {/* Top glow line */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-[400px] opacity-60"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #7C6BFF, transparent)",
                }}
                aria-hidden="true"
              />

              <h2
                className="font-bold tracking-tight text-[#E8ECF4] mb-4"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
              >
                Built something useful?
                <br />
                Share it with the community.
              </h2>
              <p className="text-[#8891A5] max-w-[480px] mx-auto mb-8 text-[1.0625rem]">
                Submit your plugin to the registry and let thousands of agent developers discover
                it.
              </p>

              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a
                  href="/submit"
                  className="inline-flex items-center gap-2 font-semibold text-white px-7 py-3.5 rounded-[10px] transition-all hover:-translate-y-px"
                  style={{
                    background: "#FF6B4A",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    fontSize: "1rem",
                  }}
                >
                  Submit a plugin
                </a>
                <a
                  href="/docs/plugins"
                  className="inline-flex items-center gap-2 font-semibold text-[#8891A5] px-7 py-3.5 rounded-[10px] border border-[#262D42] transition-all hover:bg-[#1C2030] hover:text-[#E8ECF4] hover:border-[#3A4260]"
                  style={{ fontSize: "1rem" }}
                >
                  Read the SDK docs
                </a>
              </div>

              {/* Code block */}
              <div
                className="max-w-[480px] mx-auto mt-8 text-left rounded-[10px] border border-[#1E2335] px-[18px] py-[14px] font-mono text-[0.8125rem] leading-[1.7] overflow-x-auto"
                style={{ background: "#0A0C13", color: "#8891A5" }}
              >
                <span style={{ color: "#5EEAD4" }}>$</span>{" "}
                <span style={{ color: "#E8ECF4" }}>paperclip plugin create my-plugin</span>
                <br />
                <span style={{ color: "#565E73" }}># scaffold → build → publish → submit</span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ===== DARK FOOTER ===== */}
      <footer
        className="border-t border-[#1E2335] mt-24"
        style={{ padding: "48px 0" }}
      >
        <div className="container mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#565E73] text-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" />
              <path d="M16 8v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4V8" />
              <path d="M8 12v4a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-4" />
              <line x1="12" y1="20" x2="12" y2="22" />
            </svg>
            <span>Paperclip Hub &copy; 2025</span>
          </div>
          <div className="flex gap-8 text-sm">
            <a href="https://github.com/paperclip-ai" className="text-[#8891A5] hover:text-[#E8ECF4] transition-colors">
              GitHub
            </a>
            <a href="/docs/plugins" className="text-[#8891A5] hover:text-[#E8ECF4] transition-colors">
              Docs
            </a>
            <a href="/contact" className="text-[#8891A5] hover:text-[#E8ECF4] transition-colors">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
