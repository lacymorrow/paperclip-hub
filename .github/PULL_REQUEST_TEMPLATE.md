<!--
Thanks for the contribution! A few things that make review faster:
- Keep the PR focused on one logical change
- Use Conventional Commits in the title (feat: / fix: / chore: / docs: / refactor: / perf: / test:)
- Fill in the test plan — that's the part reviewers actually depend on
-->

## Summary

<!-- One or two sentences: what changes and why. -->

## Changes

<!-- Bullet list of notable changes. Skip if Summary already covers it. -->
-

## Test plan

<!-- How a reviewer can verify this. Be specific. -->
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun test` passes (if relevant)
- [ ] Manually verified the affected route / flow at `/...`
- [ ] DB schema changes ran cleanly via `bun run db:migrate` (delete if N/A)

## Screenshots / recordings

<!-- For UI changes. Before/after when possible. Delete if not applicable. -->

## Related issues

<!-- Closes #123 / Refs #456 -->

## Reviewer notes

<!-- Anything reviewers should focus on, risks worth flagging, follow-ups intentionally deferred. -->
