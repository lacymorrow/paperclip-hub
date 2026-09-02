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
# - Plugin mutations require BOARD ACCESS on the target instance. Run this from a
#   board-authenticated context. Inside a Paperclip agent run the agent token
#   lacks board access, so PAPERCLIP_API_KEY is unset below to fall back to the
#   stored board credential; even then the run may 403 if no board creds exist.
# - Uses `--json` for every step and parses with node (always present, since the
#   CLI itself runs on node) so parsing does not depend on human-readable output.

set -euo pipefail

PLUGIN="${TEST_PLUGIN:-paperclip-theme}"
CLI="${CLI:-npx -y paperclipai@latest}"

# Prefer the stored board credential over an agent token for board-gated ops.
unset PAPERCLIP_API_KEY 2>/dev/null || true

fail() { echo "FAIL: $1" >&2; exit 1; }
step() { echo "--- $1"; }

# Extract a top-level string field from a JSON blob on stdin.
json_field() {
  node -e '
    let raw = "";
    process.stdin.on("data", d => raw += d);
    process.stdin.on("end", () => {
      try {
        const obj = JSON.parse(raw);
        const v = obj && obj["'"$1"'"];
        process.stdout.write(v == null ? "" : String(v));
      } catch { process.stdout.write(""); }
    });
  '
}

# Return 0 if the plugin-list JSON on stdin contains a plugin with the given key.
list_has_key() {
  node -e '
    const key = process.argv[1];
    let raw = "";
    process.stdin.on("data", d => raw += d);
    process.stdin.on("end", () => {
      try {
        const rows = JSON.parse(raw);
        const arr = Array.isArray(rows) ? rows : (rows && rows.plugins) || [];
        process.exit(arr.some(p => p && (p.pluginKey === key || p.id === key)) ? 0 : 1);
      } catch { process.exit(2); }
    });
  ' "$1"
}

step "Target instance"
$CLI plugin target || fail "could not reach target Paperclip instance"

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
