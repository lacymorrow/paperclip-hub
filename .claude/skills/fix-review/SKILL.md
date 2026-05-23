---
name: fix-review
description: Fetch, triage, and apply AI/human code-review feedback on a GitHub PR. Use when the user wants to address, tackle, resolve, or apply review comments (e.g. from Gemini, Claude, CodeRabbit, or a human reviewer) on a pull request. Triggers on phrases like "fix the review", "address review feedback", "apply Gemini's suggestions", "tackle PR #N reviews".
---

# Fix Review

Apply code-review feedback on a GitHub pull request in a controlled, human-gated
way. The goal is to remove the tedium of reading scattered review comments and
applying suggestions — **not** to auto-commit unsupervised changes. The user
stays the approver.

## When to use

Invoke when the user asks to address review feedback on a PR, e.g.:
- "tackle the reviews for PR 56"
- "apply Gemini's suggestions"
- "fix the review comments"

If no PR number is given, resolve it from the current branch (see Step 1).

## Environment notes (this repo)

- `gh` is **not** on the default PATH. Use the full path on Windows:
  `& 'C:\Program Files\GitHub CLI\gh.exe'` (PowerShell), or prepend
  `$env:Path += ";C:\Program Files\GitHub CLI"` once per session.
- Repo: `lacymorrow/paperclip-hub`. Pass `--repo lacymorrow/paperclip-hub` to
  `gh` calls when the remote is ambiguous (the `origin` host alias is custom).
- Package manager is **bun**. Run `bun run lint` and `bun run typecheck` after
  applying changes, before pushing.
- Commits in this repo omit the `Co-Authored-By` trailer.

## Workflow

### Step 1 — Identify the PR
- If the user gave a PR number, use it.
- Otherwise get it from the current branch:
  `gh pr view --json number,title,headRefName,url`
- Confirm the PR and branch out loud before proceeding.

### Step 2 — Gather all review feedback
Fetch both the top-level reviews and the inline comments — Gemini and Claude
put their actionable items in inline comments, not the summary:

```
gh api repos/lacymorrow/paperclip-hub/pulls/<PR>/reviews
gh api repos/lacymorrow/paperclip-hub/pulls/<PR>/comments
```

For each inline comment capture: author, file `path`, `line`, severity
(🔴 critical / 🟠 high / 🟡 medium / 🟢 low, or the textual label), the comment
body, and any ```suggestion``` block.

### Step 3 — Assess each finding critically against the CURRENT code
A reviewer — especially an AI reviewer — can be wrong, outdated, or commenting
on code that has since changed. **Do not take any comment at face value.**
Before forming a stance, ground every finding in the code as it exists now:

- **Open the file and read the referenced lines** (Read/Grep). Confirm the code
  the comment describes actually exists and still says what the reviewer claims.
  Review line anchors drift after later commits — the comment may point at the
  wrong line or at code that was already changed.
- **Verify the premise.** If the comment asserts a fact ("X is deprecated",
  "this allows arbitrary execution", "this value is unused"), check it against
  the current code, the installed dependency version (`package.json` /
  lockfile), and repo conventions in `CLAUDE.md`. State what you checked.
- **Check it isn't already handled.** The fix may already be present elsewhere,
  or the concern may be moot in context.
- **Reproduce where cheap.** For correctness/security claims, trace the actual
  code path rather than trusting the description.

### Step 4 — Triage and present a plan
Group findings by severity, highest first. For each, show:
- File + line, one-line description, the proposed change.
- Your stance: **agree / disagree / needs-judgment**, with a one-line reason
  **citing what you found in the current code** (e.g. "confirmed: line 11 still
  has the broad glob" / "stale: that line now reads X" / "wrong: dep is at
  0.31.9 where `pull` exists, so the claim holds").
- Flag suggestions that conflict with repo conventions, are factually off
  against the current code, or would break something — and propose the correct
  fix instead of the reviewer's verbatim one.

Present this as a short checklist and **ask the user which items to apply**
(default: all the ones you verified and agree with). Use AskUserQuestion if the
choice is non-trivial.

### Step 5 — Apply the approved changes
- Make sure you're on the PR's head branch (`git switch <headRefName>`); never
  apply review fixes onto `main`.
- Edit the files. Match surrounding style. Preserve existing comments.
- For `suggestion` blocks, apply them but verify line alignment — reviewers'
  suggested line anchors can drift after other commits.

### Step 6 — Verify
- Run `bun run lint` and `bun run typecheck`.
- If config/schema files changed, sanity-check they still parse (e.g. JSON
  validity for `.claude/settings.json`).
- Report results faithfully: if a check fails, say so with the output.

### Step 7 — Hand back to the user
- Show a concise diff summary of what changed and what you skipped (with why).
- **Do not push or commit unless the user asks.** When they do:
  - commit message: `fix: address review feedback (PR #<N>)` or scoped per the
    repo's conventional-commit style; no `Co-Authored-By` trailer.
  - push to the PR branch.
- Optionally offer to reply to the reviewer / resolve threads via
  `gh api ... /comments` once changes are pushed.

## Guardrails

- **Security-sensitive files** (`.claude/settings*.json`, CI workflows, anything
  granting permissions or secrets): always require explicit user confirmation
  before applying, even for "agreed" suggestions. These are exactly the changes
  that should not be auto-applied.
- Never widen a permission or disable a check just because a comment suggested
  it without understanding why.
- If a suggestion is wrong, say so and propose the correct fix instead of
  applying it verbatim.
