import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import type React from "react";
import { Umami } from "@/components/site/umami";
import { fontSans, fontSerif } from "@/config/fonts";
import {
  metadata as defaultMetadata,
  type HeadLinkHint,
  headLinkHints,
  viewport as sharedViewport,
} from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import "@/styles/globals.css";

export const metadata: Metadata = defaultMetadata;
export const viewport: Viewport = sharedViewport;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: siteConfig.title,
              description: siteConfig.description,
              url: siteConfig.url,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: siteConfig.creator.name,
                url: siteConfig.creator.url,
              },
              codeRepository: siteConfig.repo.url,
              programmingLanguage: ["TypeScript", "JavaScript"],
              runtimePlatform: "Node.js",
              isBasedOn: {
                "@type": "SoftwareApplication",
                name: "Paperclip",
                url: "https://paperclip.ing",
                applicationCategory: "DeveloperApplication",
              },
            }),
          }}
        />
        {/* Hub fonts as a parallel stylesheet link; a CSS @import chains the request behind hub.css. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
        />
        {headLinkHints.map((l: HeadLinkHint) => (
          <link key={`${l.rel}-${l.href}`} rel={l.rel} href={l.href} crossOrigin={l.crossOrigin} />
        ))}
      </head>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} min-h-screen font-sans antialiased`}
      >
        <main>{children}</main>
        <Analytics />
        <SpeedInsights />
        <Umami />
      </body>
    </html>
  );
}
