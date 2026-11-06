import Link from "next/link";

/**
 * The site wordmark. One definition, used by every header, so the name can't
 * drift page to page. The visible mark splits across two spans for the serif
 * "Paperclip" + mono "Hub" treatment, so the link carries an explicit
 * accessible name: screen readers and Google both get "Paperclip Hub".
 */
export function SiteBrand() {
  return (
    <Link href="/" className="hc-brand" aria-label="Paperclip Hub">
      <span className="hc-brand-wm">
        <b>Paper</b>clip
      </span>
      <span className="hc-brand-sub">Hub</span>
    </Link>
  );
}
