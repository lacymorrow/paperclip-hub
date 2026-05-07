import { Suspense } from "react";
import { SearchBar } from "./search-bar";

export const Hero = () => (
  <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-secondary/20 pb-16 pt-20 sm:pt-28">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
    <div className="container relative mx-auto max-w-4xl px-4 text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Open plugin ecosystem
      </div>
      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        Extend Paperclip.
        <br />
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Build anything.
        </span>
      </h1>
      <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
        Discover plugins that connect your agents to the tools you already use.
        Connectors, automations, UI extensions, and more — built by the community.
      </p>
      <Suspense fallback={<div className="h-12" />}>
        <SearchBar className="mx-auto max-w-xl" />
      </Suspense>
      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span>Popular:</span>
        <a href="/plugins?q=github" className="underline-offset-4 hover:underline hover:text-foreground transition-colors">GitHub</a>
        <a href="/plugins?q=slack" className="underline-offset-4 hover:underline hover:text-foreground transition-colors">Slack</a>
        <a href="/plugins?q=code-review" className="underline-offset-4 hover:underline hover:text-foreground transition-colors">Code Review</a>
        <a href="/plugins?q=sandbox" className="underline-offset-4 hover:underline hover:text-foreground transition-colors">Sandbox</a>
      </div>
    </div>
  </section>
);
