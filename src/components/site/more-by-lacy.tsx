"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    moreByLacy?: () => void;
  }
}

/** One quiet "Also by Lacy Morrow" line, rendered by https://www.lacymorrow.com/more.js. */
export function MoreByLacy({ className }: { className?: string }) {
  useEffect(() => {
    window.moreByLacy?.();
  }, []);

  return (
    <>
      <div data-more-by-lacy className={className} />
      <Script src="https://www.lacymorrow.com/more.js" strategy="afterInteractive" />
    </>
  );
}
