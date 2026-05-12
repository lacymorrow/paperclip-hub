"use client";

import {
  Activity,
  ArrowDownToLine,
  Brain,
  Code,
  KeyRound,
  Link2,
  MessageCircle,
  Package2,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CATEGORY_COLORS, type Plugin } from "@/data/plugins";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  auth: KeyRound,
  provider: Package2,
  tools: Wrench,
  chat: MessageCircle,
  integration: Link2,
  observability: Activity,
  memory: Brain,
};

const DARK_CATEGORY_META: Record<string, { bg: string; color: string }> = {
  auth: { bg: "rgba(99,102,241,0.15)", color: "#818CF8" },
  provider: { bg: "rgba(236,72,153,0.15)", color: "#F472B6" },
  tools: { bg: "rgba(245,158,11,0.15)", color: "#FBBF24" },
  integration: { bg: "rgba(16,185,129,0.15)", color: "#34D399" },
  observability: { bg: "rgba(244,63,94,0.15)", color: "#FB7185" },
  memory: { bg: "rgba(6,182,212,0.15)", color: "#22D3EE" },
};

const DARK_BADGE_STYLES: Record<string, { background: string; color: string; border: string }> = {
  auth: { background: "rgba(99,102,241,0.12)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.2)" },
  provider: { background: "rgba(236,72,153,0.12)", color: "#F472B6", border: "1px solid rgba(236,72,153,0.2)" },
  tools: { background: "rgba(245,158,11,0.12)", color: "#FBBF24", border: "1px solid rgba(245,158,11,0.2)" },
  integration: { background: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.2)" },
  observability: { background: "rgba(244,63,94,0.12)", color: "#FB7185", border: "1px solid rgba(244,63,94,0.2)" },
  memory: { background: "rgba(6,182,212,0.12)", color: "#22D3EE", border: "1px solid rgba(6,182,212,0.2)" },
};

function formatInstalls(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

interface PluginCardProps {
  plugin: Plugin;
  href: string;
  dark?: boolean;
}

export const PluginCard = ({ plugin, href, dark }: PluginCardProps) => {
  const Icon = CATEGORY_ICONS[plugin.category] ?? Code;

  if (dark) {
    const iconMeta = DARK_CATEGORY_META[plugin.category] ?? {
      bg: "rgba(124,107,255,0.15)",
      color: "#A78BFA",
    };
    const badgeStyle = DARK_BADGE_STYLES[plugin.category] ?? {
      background: "rgba(124,107,255,0.12)",
      color: "#A78BFA",
      border: "1px solid rgba(124,107,255,0.2)",
    };

    return (
      <a
        href={href}
        className="group flex flex-col h-full rounded-2xl border border-[#1E2335] bg-[#161922] p-5 transition-all hover:border-[#3A4260] hover:-translate-y-0.5"
        style={{
          position: "relative",
          overflow: "hidden",
          textDecoration: "none",
        }}
      >
        {/* Hover gradient overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,107,255,0.05) 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />

        {/* Icon */}
        <div
          className="w-11 h-11 rounded-[10px] flex items-center justify-center mb-3 relative z-10"
          style={{ background: iconMeta.bg }}
        >
          <Icon style={{ width: "20px", height: "20px", color: iconMeta.color }} />
        </div>

        {/* Name + author */}
        <div className="mb-2 relative z-10">
          <p className="font-semibold text-sm leading-tight text-[#E8ECF4] group-hover:text-[#A78BFA] transition-colors">
            {plugin.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#565E73" }}>
            by {plugin.author.name}
          </p>
        </div>

        {/* Badge */}
        <span
          className="self-start inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-mono font-medium mb-3 relative z-10"
          style={badgeStyle}
        >
          {plugin.category}
        </span>

        {/* Description */}
        <p
          className="text-sm leading-[1.55] flex-1 mb-4 relative z-10 line-clamp-2"
          style={{ color: "#8891A5" }}
        >
          {plugin.description}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3 border-t relative z-10"
          style={{
            borderColor: "#1E2335",
            fontSize: "0.75rem",
            color: "#565E73",
          }}
        >
          <span className="flex items-center gap-1">
            <ArrowDownToLine style={{ width: "14px", height: "14px" }} />
            {formatInstalls(plugin.installs)}/wk
          </span>
          <span className="font-mono" style={{ color: "#3A4260" }}>
            {plugin.version !== "unknown" ? `v${plugin.version}` : plugin.npmPackage}
          </span>
        </div>
      </a>
    );
  }

  return (
    <a href={href} className="group block">
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                  {plugin.name}
                </h3>
                <p className="text-xs text-muted-foreground">{plugin.author.name}</p>
              </div>
            </div>
            <Badge variant="outline" className={CATEGORY_COLORS[plugin.category] ?? ""}>
              {plugin.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {plugin.description}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowDownToLine className="h-3.5 w-3.5" />
              {formatInstalls(plugin.installs)}/wk
            </span>
            <span className="font-mono text-muted-foreground/60">
              {plugin.version !== "unknown" ? `v${plugin.version}` : plugin.npmPackage}
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
};
