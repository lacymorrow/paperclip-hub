<div align="center">
  <h1>Paperclip Hub</h1>
  <p><strong>The plugin directory for <a href="https://paperclip.ing">Paperclip</a>.</strong></p>
  <p>Browse at <a href="https://cliphub.fyi">cliphub.fyi</a>.</p>
</div>

---

## What this repo is

The source for `cliphub.fyi` — a plugin directory for [Paperclip](https://paperclip.ing). The hub itself has no docs and no API surface; it's a thin Next.js site that reads a registry of pointer files (`registry/plugins/*.json`), pulls each plugin's manifest from npm at PR/refresh time, and serves the result.

For Paperclip itself, see:

- [docs.paperclip.ing](https://docs.paperclip.ing)
- [Discord](https://discord.gg/m4HZY7xNG3)
- [github.com/paperclipai/paperclip](https://github.com/paperclipai/paperclip)

## Submitting a plugin

The easiest path is the [submission form](https://cliphub.fyi/submit) — it pre-fills a GitHub PR for you. CI extracts the manifest from your published npm tarball, validates ownership against your npm maintainers list, and posts the resolved manifest as a PR comment.

If you'd rather open the PR by hand, add a pointer at `registry/plugins/{your-package}.json`:

```json
{
  "$schema": "../schema.json",
  "npmPackage": "your-paperclip-plugin",
  "addedBy": "your-github-handle",
  "category": "tools"
}
```

Validation rules are enforced by `.github/workflows/validate-plugin.yml`.

## Running locally

```bash
bun install
bun run registry:build-index   # builds public/plugins.json
bun dev
```

## License

MIT — see [LICENSE](LICENSE).
