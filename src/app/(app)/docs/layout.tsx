import Link from "next/link";
import type { ReactNode } from "react";
import { getDocsNavigation } from "@/lib/docs";
import { DocsSearch } from "./_components/docs-search";
import { DocsSidebar } from "./_components/docs-sidebar";
import "../plugins/hub.css";
import "./styles.css";

interface DocsLayoutProps {
  children: ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const navigation = getDocsNavigation();

  return (
    <div className="hub-c1">
      {/* Header — same shell as the home / submit pages */}
      <header className="hc-header">
        <Link href="/" className="hc-brand">
          <span className="hc-brand-wm">
            <b>Paper</b>clip
          </span>
          <span className="hc-brand-sub">Hub</span>
        </Link>
        <nav className="hc-nav">
          <Link href="/">Browse</Link>
          <Link href="/?sort=newest">Collections</Link>
          <Link href="/?category=provider">Publishers</Link>
          <Link href="/submit">Submit</Link>
          <Link href="/docs" className="is-active">
            Docs
          </Link>
        </nav>
        <div className="hc-header-actions">
          <DocsSearch />
          <Link href="https://paperclip.ing" className="hc-btn">
            Get Paperclip →
          </Link>
        </div>
      </header>

      {/* Body — sidebar + article */}
      <div className="docs-shell">
        <aside className="docs-aside">
          <DocsSidebar navigation={navigation} />
        </aside>
        <main className="docs-main">{children}</main>
      </div>

      {/* Footer — same shell as the rest of the hub */}
      <footer className="hc-foot">
        <div className="l">
          <b>Paperclip</b>
          <span>The Hub — Docs</span>
        </div>
        <div className="r">
          <Link href="/docs">Docs</Link>
          <Link href="/submit">Submit</Link>
          <Link href="https://github.com/lacymorrow/paperclip-hub">GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
