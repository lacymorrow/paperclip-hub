import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="hc-foot">
      <div className="l">
        <b>Paperclip</b>
        <span>The Hub</span>
      </div>
      <p className="hc-foot-bas">
        <Link href="/support" className="hc-bas-link">
          Support the Hub
        </Link>
      </p>
      <nav className="r" aria-label="Footer">
        <Link href="/submit">Submit</Link>
        <Link href="https://docs.paperclip.ing">Docs</Link>
        <Link href="https://discord.gg/m4HZY7xNG3">Discord</Link>
        <Link href="https://github.com/paperclipai/paperclip">Paperclip</Link>
        <Link href="https://github.com/lacymorrow/paperclip-hub">Hub source</Link>
      </nav>
    </footer>
  );
}
