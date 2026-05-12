"use client";

import { useState } from "react";

interface InstallCardProps {
  cliCommand: string;
  npmCommand: string;
  pluginName: string;
}

export function InstallCard({ cliCommand, npmCommand, pluginName }: InstallCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1400);
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
      <div className="hc-d-install-cmd">
        <span className="prompt">$</span>
        <span className="cmd">{cliCommand}</span>
        <button type="button" onClick={() => copy("cli", cliCommand)}>
          {copiedKey === "cli" ? "✓ copied" : "Copy"}
        </button>
      </div>
      <div className="hc-d-install-or">
        <span />
        or
        <span />
      </div>
      <div className="hc-d-install-cmd alt">
        <span className="prompt">npm</span>
        <span className="cmd">{npmCommand}</span>
        <button type="button" onClick={() => copy("npm", `npm ${npmCommand}`)}>
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
