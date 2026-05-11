"use client";

import { Check, ClipboardCopy } from "lucide-react";
import { useCallback, useState } from "react";

export const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded-md p-1.5 hover:bg-secondary transition-colors"
      aria-label={copied ? "Copied" : "Copy install command"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <ClipboardCopy className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
};
