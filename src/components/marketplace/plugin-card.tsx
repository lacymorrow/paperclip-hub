"use client";

import { CATEGORY_COLORS, type Plugin } from "@/data/plugins";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowDownToLine, Code, KeyRound, MessageCircle, Package2, Wrench } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  auth: KeyRound,
  provider: Package2,
  tools: Wrench,
  chat: MessageCircle,
};

function formatInstalls(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export const PluginCard = ({ plugin, href }: { plugin: Plugin; href: string }) => {
  const Icon = CATEGORY_ICONS[plugin.category] ?? Code;

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
            <Badge
              variant="outline"
              className={CATEGORY_COLORS[plugin.category] ?? ""}
            >
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
