"use client";

import { useEffect, useRef, useState } from "react";

interface InstallCardProps {
  cliCommand: string;
  npmCommand: string;
  pluginName: string;
}

export function InstallCard({ cliCommand, npmCommand, pluginName }: InstallCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCopiedKey(null);
        timeoutRef.current = null;
      }, 1400);
    } catch {
      // ignored — clipboard not available
    }
  };

  return (
    <div className="hc-d-install">
      <div className="hc-d-install-hd">
        <span>Install</span>
        <span className="kbd">paperclip CLI · v2026.05</span>
      </div>
      <div className="hc-d-install-cmd" onClick={() => copy("cli", cliCommand)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") copy("cli", cliCommand); }}>
        <span className="prompt">$</span>
        <span className="cmd">{cliCommand}</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); copy("cli", cliCommand); }}>
          {copiedKey === "cli" ? "✓ copied" : "Copy"}
        </button>
      </div>
      <div className="hc-d-install-or">
        <span />
        or
        <span />
      </div>
      <div className="hc-d-install-cmd alt" onClick={() => copy("npm", `npm ${npmCommand}`)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") copy("npm", `npm ${npmCommand}`); }}>
        <span className="prompt">npm</span>
        <span className="cmd">{npmCommand}</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); copy("npm", `npm ${npmCommand}`); }}>
          {copiedKey === "npm" ? "✓ copied" : "Copy"}
        </button>
      </div>
      <button
        type="button"
        className="hc-d-install-primary"
        onClick={() => copy("primary", cliCommand)}
        aria-label={`Install ${pluginName}`}
      >
        {copiedKey === "primary" ? "✓ Copied — paste into your terminal" : "Add to project →"}
      </button>
    </div>
  );
}
