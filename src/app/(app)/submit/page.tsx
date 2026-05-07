import { ArrowRight, BookOpen, Package, Terminal } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publish a Plugin — Paperclip Hub",
  description: "Submit your plugin to the Paperclip Hub marketplace. Share connectors, automations, and extensions with the community.",
};

const STEPS = [
  {
    icon: BookOpen,
    title: "Read the Plugin SDK docs",
    description: "Understand the manifest format, capabilities system, and plugin lifecycle.",
  },
  {
    icon: Terminal,
    title: "Build your plugin",
    description: "Use the Paperclip Plugin SDK to create a worker, declare capabilities, and optionally add UI slots.",
  },
  {
    icon: Package,
    title: "Publish to npm",
    description: "Package your plugin as an npm module following the paperclip-plugin-* naming convention.",
  },
  {
    icon: ArrowRight,
    title: "Submit to the Hub",
    description: "Register your plugin on the Hub. It will be reviewed and listed for the community to discover.",
  },
];

export default function SubmitPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Publish a Plugin</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Share your work with the Paperclip ecosystem. Built something useful? Get it in front of every Paperclip user.
        </p>
      </div>

      <div className="space-y-6">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-4 rounded-xl border bg-card p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
              {i + 1}
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <step.icon className="h-4 w-4" />
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
        <h2 className="text-xl font-bold">Ready to submit?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Plugin submission is coming soon. Join the waitlist to be notified when we open the registry.
        </p>
        <a
          href="/waitlist"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Join Waitlist
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
