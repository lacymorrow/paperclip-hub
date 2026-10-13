import Link from "next/link";
import { BuildAndServeLink } from "./build-and-serve-link";

export function SiteFooter() {
  return (
    <footer className="hc-foot">
      <div className="l">
        <b>Paperclip</b>
        <span>The Hub</span>
      </div>
      <p className="hc-foot-bas">
        Need a custom plugin?{" "}
        <BuildAndServeLink placement="footer">Build &amp; Serve</BuildAndServeLink> builds them.
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
