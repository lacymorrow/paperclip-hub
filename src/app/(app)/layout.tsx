import type { Metadata, Viewport } from "next";
import type React from "react";
import { Suspense } from "react";

import { AppRouterLayout } from "@/components/layouts/app-router-layout";
import { FontSelector } from "@/components/modules/devtools/font-selector";
import { ReactGrab } from "@/components/modules/devtools/react-grab";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { fontSans, fontSerif } from "@/config/fonts";
import { siteConfig } from "@/config/site-config";
import {
  metadata as defaultMetadata,
  type HeadLinkHint,
  headLinkHints,
  viewport as sharedViewport,
} from "@/config/metadata";
import { env } from "@/env";
import { initializePaymentProviders } from "@/server/providers";
import Script from "next/script";

export const fetchCache = "default-cache";
export const metadata: Metadata = defaultMetadata;
export const viewport: Viewport = sharedViewport;

await initializePaymentProviders();

export default async function Layout({
  children,
  ...slots
}: {
  children: React.ReactNode;
  [key: string]: React.ReactNode;
}) {
  // Intercepting routes
  const resolvedSlots = (
    await Promise.all(
      Object.entries(slots).map(async ([key, slot]) => {
        const resolvedSlot = slot instanceof Promise ? await slot : slot;
        if (
          !resolvedSlot ||
          (typeof resolvedSlot === "object" && Object.keys(resolvedSlot).length === 0)
        ) {
          return null;
        }
        return [key, resolvedSlot] as [string, React.ReactNode];
      })
    )
  ).filter((item): item is [string, React.ReactNode] => item !== null);

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
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
        {headLinkHints.map((l: HeadLinkHint) => (
          <link key={`${l.rel}-${l.href}`} rel={l.rel} href={l.href} crossOrigin={l.crossOrigin} />
        ))}


        {env.NEXT_PUBLIC_FEATURE_DEVTOOLS_ENABLED && (
          <script
            async
            defer
            crossOrigin="anonymous"
            src="https://tweakcn.com/live-preview.min.js"
          />
        )}
      </head>
      {/* Ensure portaled UI (e.g. Radix primitives) inherits the sans-serif family */}
      <body
        className={`${fontSans.variable} ${fontSerif.variable} min-h-screen font-sans antialiased`}
      >
        <AppRouterLayout>
          <main>{children}</main>

          {/* Dynamically render all available slots */}
          {resolvedSlots.map(([key, slot]) => (
            <Suspense key={`slot-${key}`} fallback={<SuspenseFallback />}>
              {slot}
            </Suspense>
          ))}

        </AppRouterLayout>

        {/* Add devtools only in development */}
        {process.env.NODE_ENV === "development" &&
          env.NEXT_PUBLIC_FEATURE_DEVTOOLS_FONT_SELECTOR_ENABLED && (
            <>
              {/* React Grab — select elements and edit with AI agents */}
              <Suspense fallback={null}>
                <ReactGrab />
              </Suspense>

              <Suspense fallback={null}>
                <FontSelector />
              </Suspense>
            </>
          )}
      </body>
    </html>
  );
}
