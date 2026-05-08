import { Badge } from "@/components/ui/badge";
import { getPluginBySlug, getPlugins } from "@/lib/registry";
import {
  ArrowDownToLine,
  ArrowLeft,
  Calendar,
  ClipboardCopy,
  ExternalLink,
  Package,
  Shield,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PluginDetailPageProps {
  params: Promise<{ slug: string }>;
}

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

function formatInstalls(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  auth: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  provider: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  tools: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  chat: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export default async function PluginDetailPage({ params }: PluginDetailPageProps) {
  const { slug } = await params;
  const plugin = await getPluginBySlug(slug);
  if (!plugin) notFound();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <a
        href="/plugins"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to plugins
      </a>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{plugin.name}</h1>
              <p className="text-sm text-muted-foreground">
                by{" "}
                {plugin.author.url ? (
                  <a
                    href={plugin.author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    {plugin.author.name}
                  </a>
                ) : (
                  plugin.author.name
                )}
              </p>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">{plugin.description}</p>

          <div>
            <h2 className="text-lg font-semibold mb-3">Installation</h2>
            <div className="flex items-center gap-2 rounded-lg border bg-secondary/30 p-4 font-mono text-sm">
              <code className="flex-1 overflow-x-auto">{plugin.installCommand}</code>
              <button
                className="shrink-0 rounded-md p-1.5 hover:bg-secondary transition-colors"
                title="Copy command"
              >
                <ClipboardCopy className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Capabilities</h2>
            <div className="flex flex-wrap gap-2">
              {plugin.capabilities.map((cap) => (
                <div
                  key={cap}
                  className="flex items-center gap-1.5 rounded-md border bg-secondary/30 px-3 py-1.5 text-xs font-mono"
                >
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  {cap}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            {plugin.sourceRepo ? (
              <a
                href={plugin.sourceRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <ExternalLink className="h-4 w-4" />
                View Source
              </a>
            ) : null}

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Weekly downloads</span>
                <span className="font-medium flex items-center gap-1">
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  {formatInstalls(plugin.installs)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium font-mono">
                  {plugin.version !== "unknown" ? `v${plugin.version}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">npm</span>
                <a
                  href={`https://www.npmjs.com/package/${plugin.npmPackage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium font-mono text-xs flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {plugin.npmPackage}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge
                  variant="outline"
                  className={CATEGORY_COLORS[plugin.category] ?? ""}
                >
                  {plugin.category}
                </Badge>
              </div>
              <hr />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Added</span>
                <span className="font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(plugin.submittedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
