# Security Policy

## Reporting a vulnerability

Please **do not** open public GitHub issues for security vulnerabilities.

Use one of these private channels instead:

1. **GitHub Security Advisory** (preferred) — [open a private advisory](https://github.com/lacymorrow/paperclip-hub/security/advisories/new).
2. **Email** — `security@paperclip.ing` (use the same address for any Paperclip-platform issue that touches the hub).

You should expect:

- An acknowledgement within **3 business days**.
- An initial assessment (confirmed / not-reproducible / out-of-scope) within **10 business days**.
- Coordinated disclosure with credit to the reporter once a fix ships.

## In scope

Paperclip Hub is a public web app and plugin registry. Specifically in scope:

- Authentication and session handling (NextAuth + Better Auth + Payload credentials)
- Authorization / role escalation (admin endpoints, ownership boundaries)
- SSRF / open redirects / injection in any user-facing input
- Plugin manifest parsing — anything that lets a published npm package compromise the hub or its viewers
- Indexer-side issues — anything that lets a malicious package break, poison, or pivot through the nightly indexer
- Payment / billing flows (Lemon Squeezy, Stripe, Polar) that bypass authorization or leak data
- Stored or reflected XSS, CSRF on state-changing endpoints
- Secret or PII exposure in API responses, logs, or error pages

## Out of scope

- Vulnerabilities that require an already-compromised admin account
- Best-practice findings without a working PoC (missing headers, outdated lib versions with no exploit, etc.) — feel free to file these as normal issues
- Denial of service from naive volumetric attacks
- Issues in third-party plugins themselves — report those to the plugin author

## Supported versions

Only the deployed production version (`main`) is supported. Forks and self-hosted deployments are the responsibility of the operator.
