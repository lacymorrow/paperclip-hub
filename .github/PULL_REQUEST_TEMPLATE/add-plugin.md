<!-- Use this template only for new plugin submissions. For everything else, use the default template. -->

## New plugin submission

**Plugin package:** `<npmPackage>`
**Author:** @<your-github-handle>

## Submitter checklist

- [ ] The plugin is published to npm
- [ ] My GitHub username equals my npm username (so the ownership check can match them automatically). If they differ, the hub maintainer will need to apply the `submitted-on-behalf` label after verifying you're the npm maintainer.
- [ ] The package's `package.json` includes a `paperclipPlugin.manifest` field
- [ ] The plugin works locally (`paperclip plugin install <npmPackage>`)
- [ ] The filename `registry/plugins/<slug>.json` matches the package name (with `@scope/` stripped)
- [ ] My GitHub account is at least 30 days old

CI will run the full validator pipeline against this PR. Failures will be commented inline.
After all checks pass, a hub maintainer will review the extracted manifest (also commented on this PR) and merge.

The form at https://cliphub.fyi/submit generates a correctly-shaped pointer file for you.
