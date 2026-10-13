#!/usr/bin/env bash
# Install -> list -> uninstall every registry entry against a THROWAWAY Paperclip
# instance, using the exact command the site shows. Prints one TSV row per
# package: package, PASS|FAIL-install|FAIL-list|FAIL-uninstall, pluginKey, error.
#
# Required env:
#   PC_DATA_DIR   data dir of the throwaway instance (never ~/.paperclip)
#   PC_API_BASE   e.g. http://127.0.0.1:3101 (never your real instance)
# Optional env:
#   CLI           default "npx -y paperclipai@latest"
#   JOBS          parallelism, default 4
#
# Setup the instance so it cannot touch your real one:
#   HOME=<scratch>/home npx paperclipai@latest run -d "$PC_DATA_DIR"
# Plugin packages are npm-installed under $HOME/.paperclip/plugins by the SERVER
# process (os.homedir()), so the server MUST run with a throwaway HOME. The
# instance also needs one company, or workers fail with "company context is
# required":  curl -X POST $PC_API_BASE/api/companies -H 'content-type: application/json' -d '{"name":"verify"}'
#
# Usage:
#   scripts/verify-installs.sh                      # all of registry/plugins
#   scripts/verify-installs.sh @scope/pkg other     # specific packages
set -uo pipefail

: "${PC_DATA_DIR:?set PC_DATA_DIR to a throwaway data dir}"
: "${PC_API_BASE:?set PC_API_BASE to the throwaway instance URL}"
case "$PC_DATA_DIR" in "$HOME/.paperclip"*) echo "refusing to use ~/.paperclip" >&2; exit 2;; esac
case "$PC_API_BASE" in *:3100|*:3099) echo "refusing 3100/3099" >&2; exit 2;; esac
unset PAPERCLIP_API_KEY
export CLI="${CLI:-npx -y paperclipai@latest}"
export PC_DATA_DIR PC_API_BASE

one() {
  local P="$1" inst rc key lst un urc lst2 stale k
  local A="-d $PC_DATA_DIR --api-base $PC_API_BASE --json"
  cli() { $CLI "$@" $A 2>&1; }
  keys() { node -e 'let r="";process.stdin.on("data",d=>r+=d).on("end",()=>{try{const a=JSON.parse(r.slice(r.search(/[\[{]/)));console.log(a.map(p=>p.pluginKey+"|"+p.packageName).join("\n"))}catch{}})'; }
  inst=$(cli plugin install "$P"); rc=$?
  key=$(printf '%s' "$inst" | node -e 'let r="";process.stdin.on("data",d=>r+=d).on("end",()=>{try{console.log(JSON.parse(r.slice(r.search(/[\[{]/))).pluginKey||"")}catch{console.log("")}})')
  if [ $rc -ne 0 ] || [ -z "$key" ]; then
    stale=$(cli plugin list | keys | awk -F'|' -v p="$P" '$2==p{print $1}')
    for k in $stale; do cli plugin uninstall "$k" --force >/dev/null; done
    printf '%s\tFAIL-install\t\t%s\n' "$P" "$(printf '%s' "$inst" | grep -v 'npm warn' | tr '\n\t' '  ' | head -c 500)"; return
  fi
  lst=$(cli plugin list)
  printf '%s' "$lst" | keys | cut -d'|' -f1 | grep -qx "$key" || { printf '%s\tFAIL-list\t%s\t\n' "$P" "$key"; }
  un=$(cli plugin uninstall "$key" --force); urc=$?
  lst2=$(cli plugin list)
  if [ $urc -ne 0 ] || printf '%s' "$lst2" | keys | cut -d'|' -f1 | grep -qx "$key"; then
    printf '%s\tFAIL-uninstall\t%s\t%s\n' "$P" "$key" "$(printf '%s' "$un" | tr '\n\t' '  ' | head -c 300)"; return
  fi
  printf '%s\tPASS\t%s\t\n' "$P" "$key"
}
export -f one

if [ $# -gt 0 ]; then pkgs=("$@"); else
  pkgs=(); while IFS= read -r line; do pkgs+=("$line"); done < <(node -e 'const fs=require("fs");for(const f of fs.readdirSync("registry/plugins")){const p=JSON.parse(fs.readFileSync("registry/plugins/"+f));if(!p.quarantine&&(p.kind||"plugin")==="plugin")console.log(p.npmPackage)}')
fi
printf '%s\n' "${pkgs[@]}" | xargs -P "${JOBS:-4}" -I{} bash -c 'one "$@"' _ {}
