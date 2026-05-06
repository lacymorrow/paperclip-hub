const SHIPKIT_URL = "https://shipkit.io";

const consoleScript = `
(function() {
  if (typeof console === 'undefined') return;
  var styles = [
    'color: #fff',
    'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'padding: 8px 16px',
    'border-radius: 4px',
    'font-size: 14px',
    'font-weight: bold',
    'text-shadow: 1px 1px 2px rgba(0,0,0,0.2)',
  ].join(';');
  var subtleStyles = [
    'color: #888',
    'font-size: 11px',
  ].join(';');
  console.log(
    '%c\\u{1F680} Built with shipkit.io %c\\n${SHIPKIT_URL}',
    styles,
    subtleStyles
  );
})();
`;

export const ShipkitBranding = () => {
  return (
    <>
      {/* HTML source attribution */}
      {/* Built with shipkit.io */}
      <meta name="made-with" content="shipkit.io" />
      <link rel="author" href="/humans.txt" />
      {/* Styled console attribution — bypasses Next.js removeConsole since it's an inline script */}
      <script
        dangerouslySetInnerHTML={{ __html: consoleScript }}
      />
    </>
  );
};
