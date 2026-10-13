"use client";

import { type ReactNode, useState } from "react";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

interface DetailTabsProps {
  tabs: Tab[];
  sidebar: ReactNode;
}

export function DetailTabs({ tabs, sidebar }: DetailTabsProps) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <>
      <div className="hc-d-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls="tab-panel"
            onClick={() => setActive(t.key)}
            className={`hc-d-tab${active === t.key ? " is-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="hc-d-tabs-body">
        <div role="tabpanel" id="tab-panel" aria-labelledby={`tab-${activeTab?.key}`}>
          {activeTab?.content}
        </div>
        {sidebar}
      </div>
    </>
  );
}
