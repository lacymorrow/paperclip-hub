#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { execSync, spawnSync } = require('child_process');

// Resolve deps from script's own node_modules
const scriptDir = __dirname;
const AjvModule = require(path.join(scriptDir, 'node_modules', 'ajv'));
const Ajv = AjvModule.default || AjvModule;
const addFormats = require(path.join(scriptDir, 'node_modules', 'ajv-formats'));

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;
const REPO = process.env.REPO;
const BASE_SHA = process.env.BASE_SHA;
const HEAD_SHA = process.env.HEAD_SHA;
const GITHUB_HEAD_REF = process.env.GITHUB_HEAD_REF;
const WORKSPACE = process.env.GITHUB_WORKSPACE || process.cwd();

const COMMENT_MARKER = '<!-- paperclip-plugin-validator -->';
// Fields auto-added by this script; stripped before schema validation on re-runs
const ENRICHED_FIELDS = [
  '_npmVersion', '_npmLicense', '_npmDescription',
  '_npmLastPublished', '_npmWeeklyDownloads',
];

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'paperclip-hub-validator/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

function checkUrlAccessible(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.request({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'HEAD',
        headers: { 'User-Agent': 'paperclip-hub-validator/1.0' },
      }, (res) => resolve(res.statusCode < 400));
      req.on('error', () => resolve(false));
      req.setTimeout(8000, () => { req.destroy(); resolve(false); });
      req.end();
    } catch { resolve(false); }
  });
}

async function getNpmMetadata(packageName) {
  const encoded = packageName.startsWith('@')
    ? packageName.split('/').map(encodeURIComponent).join('/')
    : encodeURIComponent(packageName);

  const [pkgRes, dlRes] = await Promise.all([
    httpGet(`https://registry.npmjs.org/${encoded}`).catch(() => ({ status: 0, body: null })),
    httpGet(`https://api.npmjs.org/downloads/point/last-week/${encoded}`).catch(() => ({ status: 0, body: null })),
  ]);

  if (pkgRes.status !== 200 || !pkgRes.body) return { exists: false };

  const pkg = pkgRes.body;
  const latest = pkg['dist-tags']?.latest;
  const versionInfo = latest ? pkg.versions?.[latest] : null;

  return {
    exists: true,
    version: latest || null,
    license: versionInfo?.license || pkg.license || null,
    description: pkg.description || null,
    lastPublished: latest ? (pkg.time?.[latest] || null) : null,
    weeklyDownloads: dlRes.body?.downloads ?? 0,
  };
}

async function apiRequest(method, urlPath, body) {
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: urlPath,
      method,
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'paperclip-hub-validator',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function upsertPRComment(body) {
  const fullBody = `${COMMENT_MARKER}\n${body}`;
  const listRes = await apiRequest('GET', `/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`);
  const existing = Array.isArray(listRes.body)
    ? listRes.body.find(c => c.body?.includes(COMMENT_MARKER))
    : null;

  if (existing) {
    await apiRequest('PATCH', `/repos/${REPO}/issues/comments/${existing.id}`, { body: fullBody });
  } else {
    await apiRequest('POST', `/repos/${REPO}/issues/${PR_NUMBER}/comments`, { body: fullBody });
  }
}

async function main() {
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);

  const schemaPath = path.join(WORKSPACE, 'registry', 'schema.json');
  if (!fs.existsSync(schemaPath)) {
    console.error('registry/schema.json not found — LAC-812 must be merged first.');
    process.exit(1);
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const validateFn = ajv.compile(schema);

  // Find plugin files added/modified in this PR
  const diff = execSync(
    `git diff --name-only --diff-filter=ACM ${BASE_SHA} ${HEAD_SHA}`,
    { encoding: 'utf8', cwd: WORKSPACE }
  );
  const changedPlugins = diff
    .split('\n')
    .map(f => f.trim())
    .filter(f => /^registry\/plugins\/.+\.json$/.test(f));

  if (changedPlugins.length === 0) {
    console.log('No plugin files changed — skipping.');
    return;
  }

  console.log(`Validating ${changedPlugins.length} plugin file(s):`);

  const results = [];
  let allPassed = true;

  for (const relPath of changedPlugins) {
    console.log(`\n--- ${relPath} ---`);
    const absPath = path.join(WORKSPACE, relPath);
    const result = { file: relPath, errors: [], warnings: [], npm: null };

    let plugin;
    try {
      plugin = JSON.parse(fs.readFileSync(absPath, 'utf8'));
    } catch (e) {
      result.errors.push(`JSON parse error: ${e.message}`);
      results.push(result);
      allPassed = false;
      continue;
    }

    // Strip auto-enriched fields before schema validation (makes workflow idempotent)
    const dataToValidate = { ...plugin };
    for (const k of ENRICHED_FIELDS) delete dataToValidate[k];

    const valid = validateFn(dataToValidate);
    if (!valid) {
      for (const err of validateFn.errors || []) {
        const loc = err.instancePath || `(${err.schemaPath})`;
        result.errors.push(`Schema \`${loc}\`: ${err.message}`);
      }
      allPassed = false;
    } else {
      console.log('  ✓ schema valid');
    }

    // npm package check
    const pkgName = plugin.npmPackage;
    if (pkgName) {
      console.log(`  Checking npm: ${pkgName}`);
      const npm = await getNpmMetadata(pkgName);
      if (!npm.exists) {
        result.errors.push(`npm package \`${pkgName}\` not found on the npm registry`);
        allPassed = false;
      } else {
        result.npm = npm;
        console.log(`  ✓ ${pkgName}@${npm.version} — ${npm.weeklyDownloads} weekly downloads`);
      }
    }

    // Source repo URL check (warning only — repos may have auth gates)
    if (plugin.sourceRepo) {
      console.log(`  Checking sourceRepo: ${plugin.sourceRepo}`);
      const accessible = await checkUrlAccessible(plugin.sourceRepo);
      if (!accessible) {
        result.warnings.push(`Source repo URL is not reachable (may require auth): \`${plugin.sourceRepo}\``);
      } else {
        console.log('  ✓ sourceRepo accessible');
      }
    }

    results.push(result);
  }

  // Build PR comment
  const overallLabel = allPassed ? '✅ Passed' : '❌ Failed';
  const lines = [
    `## Plugin Validation — ${overallLabel}`,
    '',
    `Checked **${results.length}** plugin file(s) · commit \`${HEAD_SHA.slice(0, 7)}\``,
    '',
  ];

  for (const r of results) {
    const fileName = path.basename(r.file);
    const icon = r.errors.length === 0 ? '✅' : '❌';
    lines.push(`### ${icon} \`${fileName}\``);
    lines.push('');

    if (r.errors.length > 0) {
      lines.push('**Errors** *(must fix before merge)*:');
      for (const e of r.errors) lines.push(`- ${e}`);
      lines.push('');
    }

    if (r.warnings.length > 0) {
      lines.push('**Warnings** *(non-blocking)*:');
      for (const w of r.warnings) lines.push(`- ⚠️ ${w}`);
      lines.push('');
    }

    if (r.npm) {
      const n = r.npm;
      lines.push('**npm package info:**');
      lines.push('');
      lines.push('| | |');
      lines.push('|---|---|');
      lines.push(`| Version | \`${n.version ?? '—'}\` |`);
      lines.push(`| License | ${n.license ?? '—'} |`);
      lines.push(`| Description | ${n.description ?? '—'} |`);
      if (n.lastPublished) {
        lines.push(`| Last published | ${new Date(n.lastPublished).toISOString().split('T')[0]} |`);
      }
      lines.push(`| Weekly downloads | ${(n.weeklyDownloads ?? 0).toLocaleString()} |`);
      lines.push('');
    }
  }

  lines.push('---');
  if (allPassed) {
    lines.push('*All checks passed. npm metadata has been auto-enriched and committed to this branch.*');
  } else {
    lines.push('*Fix the errors above, push again, and this check will re-run automatically.*');
  }

  await upsertPRComment(lines.join('\n'));

  // Enrich JSON with npm metadata and push back to PR branch
  if (allPassed) {
    let anyChanged = false;

    for (const r of results) {
      if (!r.npm) continue;
      const absPath = path.join(WORKSPACE, r.file);
      const current = JSON.parse(fs.readFileSync(absPath, 'utf8'));

      const enriched = {
        ...current,
        _npmVersion: r.npm.version,
        _npmLicense: r.npm.license,
        _npmDescription: r.npm.description,
        _npmLastPublished: r.npm.lastPublished,
        _npmWeeklyDownloads: r.npm.weeklyDownloads,
      };

      const serialized = JSON.stringify(enriched, null, 2) + '\n';
      if (serialized !== fs.readFileSync(absPath, 'utf8')) {
        fs.writeFileSync(absPath, serialized);
        anyChanged = true;
        console.log(`\nEnriched: ${r.file}`);
      }
    }

    if (anyChanged) {
      execSync('git config user.name "github-actions[bot]"', { cwd: WORKSPACE });
      execSync('git config user.email "github-actions[bot]@users.noreply.github.com"', { cwd: WORKSPACE });

      const filesToAdd = changedPlugins.map(f => path.join(WORKSPACE, f));
      execSync(`git add ${filesToAdd.map(f => JSON.stringify(f)).join(' ')}`, { cwd: WORKSPACE });

      const commit = spawnSync('git', [
        'commit', '-m',
        'chore: auto-enrich plugin npm metadata [skip ci]\n\nCo-Authored-By: Paperclip <noreply@paperclip.ing>',
      ], { encoding: 'utf8', cwd: WORKSPACE });

      if (commit.status !== 0) {
        console.log('Commit skipped (nothing changed or error):', commit.stderr || commit.stdout);
      } else {
        execSync(`git push origin HEAD:${GITHUB_HEAD_REF}`, { cwd: WORKSPACE });
        console.log('Enriched metadata pushed to PR branch.');
      }
    }
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
