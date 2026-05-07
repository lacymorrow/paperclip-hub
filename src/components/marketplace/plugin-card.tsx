"use client";

import type { Plugin } from "@/data/plugins";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ArrowDownToLine,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Brain,
  Bug,
  Code,
  Database,
  GitBranch,
  Import,
  Link,
  MessageSquare,
  Star,
  Terminal,
  Workflow,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  link: Link,
  "git-branch": GitBranch,
  "message-square": MessageSquare,
  terminal: Terminal,
  brain: Brain,
  "bar-chart-3": BarChart3,
  import: Import,
  code: Code,
  bug: Bug,
  database: Database,
  workflow: Workflow,
  "book-open": BookOpen,
};

const CATEGORY_COLORS: Record<string, string> = {
  connector: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  workspace: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  automation: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ui: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

function formatInstalls(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export const PluginCard = ({ plugin, href }: { plugin: Plugin; href: string }) => {
  const Icon = ICON_MAP[plugin.icon] ?? Code;

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
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                    {plugin.name}
                  </h3>
                  {plugin.verified && (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{plugin.author.name}</p>
              </div>
            </div>
            <Badge variant="outline" className={CATEGORY_COLORS[plugin.category]}>
              {plugin.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {plugin.description}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ArrowDownToLine className="h-3.5 w-3.5" />
                {formatInstalls(plugin.installs)}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {plugin.rating}
              </span>
            </div>
            <span className="text-muted-foreground/60">v{plugin.version}</span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
};
