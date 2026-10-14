#!/usr/bin/env bash
# Plugin install/uninstall smoke test.
#
# Exercises the full plugin lifecycle against the target Paperclip instance via
# the public `paperclipai` CLI:
#   install -> verify present -> uninstall -> verify absent
# Exits 0 on PASS, non-zero on FAIL.
#
# Usage:
#   ./scripts/test-plugin-install.sh
#   TEST_PLUGIN=@acme/plugin-linear ./scripts/test-plugin-install.sh
#   CLI="npx -y paperclipai@2026.831.1" ./scripts/test-plugin-install.sh   # pin CLI version
#
# Notes:
# - TEST_PLUGIN MUST be a disposable fixture. The test uninstalls it with
#   --force (purging all state/config) both before and after the cycle, so never
#   point it at a plugin whose config you care about. The default is a benign
#   workspace plugin that is not normally installed.
# - Plugin mutations require BOARD ACCESS on the target instance. Run this from a
#   board-authenticated context. Inside a Paperclip agent run the agent token
#   lacks board access, so PAPERCLIP_API_KEY is unset below to fall back to the
#   stored board credential; even then the run may 403 if no board creds exist.
# - Uses `--json` for every step and parses with node (always present, since the
#   CLI itself runs on node) so parsing does not depend on human-readable output.
#   npm/npx prints warnings (e.g. the repo `.npmrc` `shamefully-hoist` notice) to
#   stderr, which `2>&1` folds into the captured output; the node parsers below
#   strip everything before the first JSON token so that noise never breaks
#   JSON.parse.

set -euo pipefail

PLUGIN="${TEST_PLUGIN:-paperclip-plugin-navigator}"
CLI="${CLI:-npx -y paperclipai@latest}"

# Prefer the stored board credential over an agent token for board-gated ops.
unset PAPERCLIP_API_KEY 2>/dev/null || true

fail() { echo "FAIL: $1" >&2; exit 1; }
step() { echo "--- $1"; }

# Extract a top-level string field from a JSON blob on stdin. Tolerates leading
# non-JSON noise (npm/npx warnings) by slicing from the first JSON token.
json_field() {
  node -e '
    let raw = "";
    process.stdin.on("data", d => raw += d);
    process.stdin.on("end", () => {
      try {
        const m = raw.search(/[{\[]/);
        const obj = JSON.parse(m >= 0 ? raw.slice(m) : raw);
        const v = obj && obj["'"$1"'"];
        process.stdout.write(v == null ? "" : String(v));
      } catch { process.stdout.write(""); }
    });
  '
}

# Return 0 if the plugin-list JSON on stdin contains a plugin with the given key.
# Tolerates leading non-JSON noise the same way as json_field.
list_has_key() {
  node -e '
    const key = process.argv[1];
    let raw = "";
    process.stdin.on("data", d => raw += d);
    process.stdin.on("end", () => {
      try {
        const m = raw.search(/[{\[]/);
        const rows = JSON.parse(m >= 0 ? raw.slice(m) : raw);
        const arr = Array.isArray(rows) ? rows : (rows && rows.plugins) || [];
        process.exit(arr.some(p => p && (p.pluginKey === key || p.id === key)) ? 0 : 1);
      } catch { process.exit(2); }
    });
  ' "$1"
}

step "Target instance"
$CLI plugin target || fail "could not reach target Paperclip instance"

# Pre-clean: if the fixture is already installed (e.g. a prior aborted run),
# remove it first so the install step exercises a real create, not a 409/400.
step "Ensuring fixture is absent before install: $PLUGIN"
pre_list=$($CLI plugin list --json 2>&1) || fail "list failed: $pre_list"
if list_has_key "$PLUGIN" <<<"$pre_list"; then
  echo "Fixture already present; uninstalling to start clean"
  $CLI plugin uninstall "$PLUGIN" --force --json >/dev/null 2>&1 || \
    fail "could not uninstall pre-existing fixture $PLUGIN"
fi

step "Installing plugin: $PLUGIN"
install_json=$($CLI plugin install "$PLUGIN" --json 2>&1) || fail "install failed: $install_json"
echo "$install_json"
plugin_key=$(printf '%s' "$install_json" | json_field pluginKey)
[ -n "$plugin_key" ] || fail "could not parse pluginKey from install output"
echo "Plugin key: $plugin_key"

step "Verifying plugin appears in list"
list_json=$($CLI plugin list --json 2>&1) || fail "list failed: $list_json"
list_has_key "$plugin_key" <<<"$list_json" || fail "plugin $plugin_key not found in list after install"
echo "Verified: $plugin_key is installed"

step "Uninstalling plugin: $plugin_key"
uninstall_out=$($CLI plugin uninstall "$plugin_key" --force --json 2>&1) || fail "uninstall failed: $uninstall_out"
echo "$uninstall_out"

step "Verifying plugin is removed"
list_after=$($CLI plugin list --json 2>&1) || fail "list after uninstall failed: $list_after"
if list_has_key "$plugin_key" <<<"$list_after"; then
  fail "plugin $plugin_key still present after uninstall"
fi
echo "Verified: $plugin_key is removed"

echo "--- PASS: plugin install/uninstall cycle for $PLUGIN ($plugin_key)"
