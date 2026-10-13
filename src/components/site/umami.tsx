import Script from "next/script";

/** Loads Umami only when a website id is configured. */
export function Umami() {
  const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!id) return null;
  const src = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://analytics.lacy.sh/script.js";
  return <Script src={src} data-website-id={id} strategy="afterInteractive" />;
}
