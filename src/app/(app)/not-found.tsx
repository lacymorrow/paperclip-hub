import Link from "next/link";
import "./plugins/hub.css";

export default function NotFound() {
  return (
    <div className="hub-c1">
      <header className="hc-header">
        <Link href="/" className="hc-brand">
          <span className="hc-brand-wm">
            <b>Paper</b>clip
          </span>
          <span className="hc-brand-sub">Hub</span>
        </Link>
        <nav className="hc-nav">
          <Link href="/">Browse</Link>
          <Link href="/submit">Submit</Link>
          <Link href="https://github.com/lacymorrow/paperclip-hub#readme">Docs</Link>
        </nav>
        <div className="hc-header-actions">
          <Link href="https://paperclip.ing" className="hc-btn">
            Get Paperclip →
          </Link>
        </div>
      </header>

      <section
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "120px 24px 96px",
        }}
      >
        <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>
          § 404 — not in the library
        </span>
        <h1
          style={{
            fontFamily: "var(--hub-font-serif)",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            color: "var(--ink)",
            marginBottom: 12,
          }}
        >
          That page isn't <em>on the shelves.</em>
        </h1>
        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--ink-2)",
            maxWidth: 520,
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          The URL you tried doesn't match a plugin we've indexed. Head back to the directory or
          search for what you were after.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link href="/" className="hc-btn">
            ← Back to the library
          </Link>
          <Link
            href="/submit"
            className="hc-btn"
            style={{ background: "transparent", border: "1px solid var(--bd-1)", color: "var(--ink)" }}
          >
            Submit a plugin
          </Link>
        </div>
      </section>

      <footer className="hc-foot">
        <div className="l">
          <b>Paperclip</b>
          <span>The Hub</span>
        </div>
        <div className="r">
          <Link href="/submit">Submit</Link>
          <Link href="https://github.com/lacymorrow/paperclip-hub">GitHub</Link>
        </div>
      </footer>
    </div>
  );
}
