"use client";

import { useEffect, useRef, useState } from "react";

interface InstallCardProps {
  cliCommand: string;
  pluginName: string;
}

export function InstallCard({ cliCommand, pluginName }: InstallCardProps) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  const cmdRef = useRef<HTMLElement | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cliCommand);
      setState("copied");
    } catch {
      // Clipboard blocked: select the command so the person can copy it by hand.
      const el = cmdRef.current;
      const selection = window.getSelection();
      if (el && selection) {
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setState("manual");
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setState("idle");
      timeoutRef.current = null;
    }, 2000);
  };

  const label =
    state === "copied"
      ? "Copied. Paste it into your terminal."
      : state === "manual"
        ? "Selected. Press ⌘C or Ctrl+C to copy."
        : "Copy install command";

  return (
    <div className="hc-d-install">
      <div className="hc-d-install-hd">
        <span>Install</span>
        <span className="kbd">via paperclipai</span>
      </div>
      <div className="hc-d-install-cmd">
        <span className="prompt" aria-hidden="true">
          $
        </span>
        <code className="cmd" ref={cmdRef}>
          {cliCommand}
        </code>
      </div>
      <button
        type="button"
        className="hc-d-install-primary"
        onClick={copy}
        aria-label={state === "idle" ? `Copy the install command for ${pluginName}` : undefined}
      >
        <span aria-live="polite">{label}</span>
      </button>
    </div>
  );
}
