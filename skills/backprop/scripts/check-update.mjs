#!/usr/bin/env node
// Deterministic zero-dependency self-update checker for the Backprop agent skill.
// Usage:
//   node scripts/check-update.mjs           # prints JSON update report
//   node scripts/check-update.mjs --apply   # runs `npx -y skills update backprop -y` if outdated

import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localMetaPath = join(__dirname, '..', 'assets', 'version.json');
const applyUpdate = process.argv.includes('--apply');

function compareSemver(a, b) {
  const pa = String(a).split('-')[0].split('.').map(Number);
  const pb = String(b).split('-')[0].split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const da = Number.isFinite(pa[i]) ? pa[i] : 0;
    const db = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (da !== db) return da < db ? -1 : 1;
  }
  return String(a).localeCompare(String(b));
}

async function fetchJsonWithTimeout(url, timeoutMs = 4000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const local = JSON.parse(await readFile(localMetaPath, 'utf8'));
  const installedVersion = local.version;

  // 1. Primary source: live Backprop MCP unauthenticated version endpoint
  let remote = await fetchJsonWithTimeout(local.server_version_url);
  let source = 'mcp_server';

  // 2. Fallback source: public GitHub skill repository metadata
  if (!remote || !remote.latest_version) {
    const ghMeta = await fetchJsonWithTimeout(local.github_version_url);
    if (ghMeta && ghMeta.version) {
      remote = {
        skill_name: local.skill_name,
        latest_version: ghMeta.version,
        skill_repository: local.skill_repository,
        update_command: local.update_command,
      };
      source = 'github_raw';
    }
  }

  if (!remote || !remote.latest_version) {
    console.log(JSON.stringify({
      ok: true,
      checked: false,
      reason: 'offline_or_unreachable',
      installed_version: installedVersion,
      update_available: false,
    }, null, 2));
    return;
  }

  const updateAvailable = compareSemver(installedVersion, remote.latest_version) < 0;
  const report = {
    ok: true,
    checked: true,
    source,
    skill_name: local.skill_name,
    installed_version: installedVersion,
    latest_version: remote.latest_version,
    update_available: updateAvailable,
    update_command: remote.update_command ?? local.update_command,
  };

  if (updateAvailable && applyUpdate) {
    const upd = spawnSync('npx', ['-y', 'skills', 'update', local.skill_name, '-y'], {
      stdio: 'inherit',
    });
    report.applied = upd.status === 0;
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  console.error(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
