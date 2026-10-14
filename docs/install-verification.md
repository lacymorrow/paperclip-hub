# Install verification

Run date: 2026-10-13. CLI: `paperclipai` 2026.1012.0 (npm latest). Host: throwaway local instance (`--data-dir` under scratch, own port, own `HOME`), one empty company, local_trusted mode.

Each entry was installed with the exact command the site shows, checked in `plugin list`, then removed with `plugin uninstall <pluginKey> --force`. Driver: `scripts/verify-installs.sh`.

Result: **39 of 53 install, 14 fail**. All 14 failures are quarantined. One more entry installs but is quarantined because its manifest cannot be extracted.

## Install commands by kind (CLI 2026.1012.0)

| Kind | Command | Notes |
|---|---|---|
| plugin | `npx paperclipai@latest plugin install <package>` | All registry entries are plugins. |
| adapter | `npx paperclipai@latest adapter install --payload-json '{"packageName":"<package>"}'` | Only for external adapters whose main entry exports `createServerAdapter()`. Verified: `hermes-paperclip-adapter` and `@paperclipai/adapter-openclaw-gateway` are rejected with "does not export createServerAdapter()". Both ship inside Paperclip already (`hermes_local` and `openclaw_gateway` are builtin adapter types), so there is nothing to install. |
| library / SDK | none | e.g. `@paperclipai/plugin-sdk`. Not installable, never listed. `kind: "library"` entries are excluded from the site and index. |

`plugin install` on an adapter or SDK is wrong: it fails manifest validation.

## Results

| Package | Version | Kind | Command | Result | Reason |
|---|---|---|---|---|---|
| `@acnlabs/paperclip-plugin-acn` | 0.3.0 | plugin | `npx paperclipai@latest plugin install @acnlabs/paperclip-plugin-acn` | FAIL | Install fails on paperclipai 2026.1012.0: worker setup() calls config.get without a company context and the host rejects it. Needs a plugin update. |
| `@agent-analytics/paperclip-live-analytics-plugin` | 0.1.11 | plugin | `npx paperclipai@latest plugin install @agent-analytics/paperclip-live-analytics-plugin` | PASS |  |
| `@anneal-memory/paperclip-plugin` | 0.0.2 | plugin | `npx paperclipai@latest plugin install @anneal-memory/paperclip-plugin` | FAIL | Install fails on paperclipai 2026.1012.0: worker setup() calls config.get without a company context and the host rejects it. Needs a plugin update. |
| `@avirajkhare00/agent-commerce-bridge` | 0.1.4 | plugin | `npx paperclipai@latest plugin install @avirajkhare00/agent-commerce-bridge` | PASS |  |
| `@bbugs280/plugin-bitly` | 0.2.0 | plugin | `npx paperclipai@latest plugin install @bbugs280/plugin-bitly` | FAIL | Install fails on paperclipai 2026.1012.0: worker setup() calls config.get without a company context and the host rejects it. Needs a plugin update. |
| `@bbugs280/plugin-substack` | 0.1.0 | plugin | `npx paperclipai@latest plugin install @bbugs280/plugin-substack` | PASS |  |
| `@blaze283/social-agent-plugin` | 0.7.3 | plugin | `npx paperclipai@latest plugin install @blaze283/social-agent-plugin` | FAIL | Install fails on paperclipai 2026.1012.0: worker setup() calls config.get without a company context and the host rejects it. Needs a plugin update. |
| `@bopen-io/clawnet-plugin` | 0.0.12 | plugin | `npx paperclipai@latest plugin install @bopen-io/clawnet-plugin` | PASS |  |
| `@bopen-io/tortuga-plugin` | 0.0.11 | plugin | `npx paperclipai@latest plugin install @bopen-io/tortuga-plugin` | PASS |  |
| `@codewithahsan/paperclip-plugin-gsd` | 0.1.0 | plugin | `npx paperclipai@latest plugin install @codewithahsan/paperclip-plugin-gsd` | PASS |  |
| `@farhoodlabs/paperclip-plugin-k8s` | 0.3.7 | plugin | `npx paperclipai@latest plugin install @farhoodlabs/paperclip-plugin-k8s` | PASS |  |
| `@gaud_erp/paperclip-plugin-agentmemory` | 0.6.0 | plugin | `npx paperclipai@latest plugin install @gaud_erp/paperclip-plugin-agentmemory` | FAIL | Install fails on paperclipai 2026.1012.0: worker setup() calls skills.managed.reconcile without a company context and the host rejects it. Needs a plugin update. |
| `@gaud_erp/papperclip_observability` | 0.3.3 | plugin | `npx paperclipai@latest plugin install @gaud_erp/papperclip_observability` | PASS |  |
| `@gaud_erp/social-networking` | 0.1.0 | plugin | `npx paperclipai@latest plugin install @gaud_erp/social-networking` | FAIL | Install rejected by paperclipai 2026.1012.0: plugin migrations must use fully qualified schema names. |
| `@honcho-ai/paperclip-honcho` | 0.1.2 | plugin | `npx paperclipai@latest plugin install @honcho-ai/paperclip-honcho` | FAIL | Install fails on paperclipai 2026.1012.0: worker setup() calls config.get without a company context and the host rejects it. Needs a plugin update. |
| `@jk3labs/file-browser` | 0.1.3 | plugin | `npx paperclipai@latest plugin install @jk3labs/file-browser` | PASS |  |
| `@magneto-ai/paperclip-plugin` | 0.1.2 | plugin | `npx paperclipai@latest plugin install @magneto-ai/paperclip-plugin` | PASS |  |
| `@marsbdigital/paperclip-content-sprint-plugin` | 0.1.3 | plugin | `npx paperclipai@latest plugin install @marsbdigital/paperclip-content-sprint-plugin` | PASS |  |
| `@niubitli/plugin-feishu-connector-v2` | 0.3.3-connector-feishu | plugin | `npx paperclipai@latest plugin install @niubitli/plugin-feishu-connector-v2` | FAIL | Install rejected by paperclipai 2026.1012.0: manifest declares unknown capability issue.attachments.create. |
| `@octofloworg/paperclip-plugin-driftwatch` | 0.1.10 | plugin | `npx paperclipai@latest plugin install @octofloworg/paperclip-plugin-driftwatch` | PASS |  |
| `@oldharlem/paperclip-plugin-linear` | 0.7.0 | plugin | `npx paperclipai@latest plugin install @oldharlem/paperclip-plugin-linear` | FAIL | Install fails on paperclipai 2026.1012.0: worker setup() calls config.get without a company context and the host rejects it. Needs a plugin update. |
| `@paperclipai/plugin-cloudflare-sandbox` | 2026.529.0 | plugin | `npx paperclipai@latest plugin install @paperclipai/plugin-cloudflare-sandbox` | PASS |  |
| `@paperclipai/plugin-daytona` | 2026.529.0 | plugin | `npx paperclipai@latest plugin install @paperclipai/plugin-daytona` | PASS |  |
| `@paperclipai/plugin-e2b` | 2026.529.0 | plugin | `npx paperclipai@latest plugin install @paperclipai/plugin-e2b` | PASS |  |
| `@paperclipai/plugin-exe-dev` | 2026.529.0 | plugin | `npx paperclipai@latest plugin install @paperclipai/plugin-exe-dev` | PASS |  |
| `@paperclipai/plugin-modal` | 2026.529.0 | plugin | `npx paperclipai@latest plugin install @paperclipai/plugin-modal` | PASS |  |
| `@sergioconejo/paperclip-plugin-agent-chat` | 0.5.0 | plugin | `npx paperclipai@latest plugin install @sergioconejo/paperclip-plugin-agent-chat` | PASS |  |
| `@smara/paperclip-plugin-memory` | 0.1.1 | plugin | `npx paperclipai@latest plugin install @smara/paperclip-plugin-memory` | FAIL | Install fails on paperclipai 2026.1012.0: worker setup() calls config.get without a company context and the host rejects it. Needs a plugin update. |
| `@tomismeta/paperclip-aperture` | 0.4.5 | plugin | `npx paperclipai@latest plugin install @tomismeta/paperclip-aperture` | PASS |  |
| `@vectorize-io/hindsight-paperclip` | 0.2.3 | plugin | `npx paperclipai@latest plugin install @vectorize-io/hindsight-paperclip` | PASS |  |
| `@vlbog/paperclip-plugin-workflow-studio` | 0.1.3 | plugin | `npx paperclipai@latest plugin install @vlbog/paperclip-plugin-workflow-studio` | PASS |  |
| `@webprismdev/paperclip-plugin-chat` | 0.1.12 | plugin | `npx paperclipai@latest plugin install @webprismdev/paperclip-plugin-chat` | PASS |  |
| `@wil0x91/paperclip-plugin-github-issues` | 0.2.4 | plugin | `npx paperclipai@latest plugin install @wil0x91/paperclip-plugin-github-issues` | FAIL | Not on npm: registry.npmjs.org returns 404, so the install cannot work. |
| `@yesterday-ai/paperclip-plugin-company-wizard` | 0.1.16 | plugin | `npx paperclipai@latest plugin install @yesterday-ai/paperclip-plugin-company-wizard` | PASS |  |
| `paperclip-file-viewer` | 0.3.1 | plugin | `npx paperclipai@latest plugin install paperclip-file-viewer` | PASS |  |
| `paperclip-hermes-file-access-manager` | 0.3.0 | plugin | `npx paperclipai@latest plugin install paperclip-hermes-file-access-manager` | PASS | Listed again 2026-10-13: the walker now resolves string concatenation in bundled manifests. |
| `paperclip-goals-workspace` | 1.2.2 | plugin | `npx paperclipai@latest plugin install paperclip-goals-workspace` | PASS | Added 2026-10-13 from community PR #70; same concatenation fix. |
| `paperclip-plugin-agent-usage` | 0.1.3 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-agent-usage` | PASS |  |
| `paperclip-plugin-bcp-commerce` | 0.1.0 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-bcp-commerce` | PASS |  |
| `paperclip-plugin-claude-config-editor` | 1.0.1 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-claude-config-editor` | PASS |  |
| `paperclip-plugin-compass` | 1.1.8 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-compass` | FAIL | Install fails on paperclipai 2026.1012.0: worker setup() calls agents.list without a company context and the host rejects it. Needs a plugin update. |
| `paperclip-plugin-discord` | 0.9.1 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-discord` | PASS |  |
| `paperclip-plugin-knok` | 0.1.3 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-knok` | FAIL | Install fails on paperclipai 2026.1012.0: worker setup() calls config.get without a company context and the host rejects it. Needs a plugin update. |
| `paperclip-plugin-line` | 1.0.0 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-line` | PASS |  |
| `paperclip-plugin-navigator` | 0.2.1 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-navigator` | PASS |  |
| `paperclip-plugin-notification-sound` | 1.0.3 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-notification-sound` | PASS |  |
| `paperclip-plugin-slack` | 2.0.8 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-slack` | PASS |  |
| `paperclip-plugin-telegram` | 0.6.1 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-telegram` | PASS |  |
| `paperclip-plugin-zernio` | 0.4.1 | plugin | `npx paperclipai@latest plugin install paperclip-plugin-zernio` | PASS |  |
| `paperclip-theme` | 0.2.2 | plugin | `npx paperclipai@latest plugin install paperclip-theme` | PASS |  |
| `paperclip-workspace-browser` | 0.1.28 | plugin | `npx paperclipai@latest plugin install paperclip-workspace-browser` | PASS |  |
| `peak6-x-intelligence-plugin` | 0.1.9 | plugin | `npx paperclipai@latest plugin install peak6-x-intelligence-plugin` | PASS |  |
| `peak6-x-publishing-plugin` | 0.2.3 | plugin | `npx paperclipai@latest plugin install peak6-x-publishing-plugin` | PASS |  |

## Caveats

- Failures with "company context is required" are deterministic host rejections: the worker `setup()` calls a company-scoped API before any company is configured. The empty test company does not cause them.
- Installs share one npm project under `$HOME/.paperclip/plugins`. Parallel installs corrupt each other (ENOTEMPTY, "Package directory not found"), and leftovers from failed installs can break later ones (`@farhoodlabs/paperclip-plugin-k8s` failed in a polluted tree and passed in a clean one). Verify serially or on a clean prefix.
- Plugin packages are installed under the server's `os.homedir()`. A throwaway instance must run with a throwaway `HOME`, not just `--data-dir`.
- Plugin worker code ran on install. No real secrets were present.

## Packages with no public source repo

A missing `repository` field is not a reason to hold a plugin back: npm does not require one. Before listing one, download the tarball and check it for install scripts, subprocess and `eval` use, and every outbound host. Reviewed 2026-10-14:

- `@bbugs280/plugin-bitly`: source lives in a personal Paperclip fork (`bbugs280/paperclip`, issues off). Only calls the Bitly API. OK.
- `@blaze283/social-agent-plugin`: only calls the LinkedIn API. OK.
- `@niubitli/plugin-feishu-connector-v2`: spawns Feishu's official `lark-cli` (its declared `@larksuite/cli` dependency). OK.
- `@betaform/paperclaw-dashboard`: delisted. It is betaform's internal sales dashboard, hardcoded to their booking link, Buffer and OpenAI accounts. Not malicious, but useless to anyone else.

The three OK packages stay quarantined only because they still fail to install on the current CLI.
