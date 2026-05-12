"use client";

import { type ReactNode, useState } from "react";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

interface DetailTabsProps {
  tabs: Tab[];
  lastUpdated: string;
  sidebar: ReactNode;
}

export function DetailTabs({ tabs, lastUpdated, sidebar }: DetailTabsProps) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <>
      <div className="hc-d-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`hc-d-tab${active === t.key ? " is-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
        <div className="hc-d-tab-meta">last updated · {lastUpdated}</div>
      </div>

      <div className="hc-d-tabs-body">
        <div>{activeTab?.content}</div>
        {sidebar}
      </div>
    </>
  );
}
