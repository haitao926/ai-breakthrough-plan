#!/usr/bin/env node

/**
 * Production release guardrails.
 *
 * The script is intentionally dependency-light so it can run before the API is
 * started. It verifies the SQLite file, creates a restorable backup, records
 * content/upload hashes, and optionally checks the running HTTP service.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const process = require('node:process');
const Database = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'better-sqlite3'));

const ROOT = path.resolve(__dirname, '..');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

function envPath(name, fallback) {
  const value = String(process.env[name] || fallback);
  return path.isAbsolute(value) ? value : path.resolve(ROOT, value);
}

function parseArgs(argv) {
  const options = {
    checkOnly: false,
    skipSmoke: false,
    smokeUrl: process.env.SMOKE_BASE_URL || `http://127.0.0.1:${process.env.PORT || 8090}`
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--check-only') options.checkOnly = true;
    else if (value === '--skip-smoke') options.skipSmoke = true;
    else if (value === '--smoke-url') options.smokeUrl = argv[++index] || options.smokeUrl;
    else if (value === '--help' || value === '-h') {
      console.log('Usage: node scripts/release-preflight.js [--check-only] [--skip-smoke] [--smoke-url URL]');
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  return options;
}

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function collectFiles(root, relative = '') {
  if (!fs.existsSync(root)) return [];
  const current = path.join(root, relative);
  const entries = fs.readdirSync(current, { withFileTypes: true });
  const files = [];
  entries.forEach((entry) => {
    const childRelative = path.join(relative, entry.name);
    const childPath = path.join(root, childRelative);
    if (entry.isDirectory()) files.push(...collectFiles(root, childRelative));
    else if (entry.isFile()) {
      const stat = fs.statSync(childPath);
      files.push({
        path: childRelative.split(path.sep).join('/'),
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        sha256: sha256File(childPath)
      });
    }
  });
  return files;
}

function writeManifest(name, root, outputDir) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    root,
    files: collectFiles(root)
  };
  const output = path.join(outputDir, `${name}-${timestamp}.json`);
  fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`[preflight] ${name}: ${manifest.files.length} files -> ${output}`);
  return manifest;
}

function auditDatabase(dbPath, reportDir) {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database not found: ${dbPath}`);
  }
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const integrity = db.pragma('integrity_check', { simple: true });
    if (integrity !== 'ok') throw new Error(`PRAGMA integrity_check failed: ${integrity}`);
    const foreignKeys = db.pragma('foreign_key_check');
    if (foreignKeys.length) {
      throw new Error(`PRAGMA foreign_key_check returned ${foreignKeys.length} rows`);
    }

    const report = {
      generatedAt: new Date().toISOString(),
      dbPath,
      integrityCheck: integrity,
      foreignKeyViolations: foreignKeys.length,
      migrations: db.prepare('SELECT name, applied_at FROM _migrations ORDER BY id').all(),
      attachmentReconciliation: reconcileLegacyAttachments(db)
    };
    const reportPath = path.join(reportDir, `database-${timestamp}.json`);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`[preflight] database integrity: ok -> ${reportPath}`);
    return report;
  } finally {
    db.close();
  }
}

function reconcileLegacyAttachments(db) {
  const result = {
    legacyRows: 0,
    legacyItems: 0,
    normalizedRows: 0,
    malformedJson: 0,
    malformedShape: 0
  };
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='assignment_submissions'").get();
  if (!table) return result;
  const normalizedTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='assignment_submission_attachments'").get();
  if (normalizedTable) {
    result.normalizedRows = Number(db.prepare('SELECT COUNT(*) AS count FROM assignment_submission_attachments').get().count || 0);
  }
  const rows = db.prepare("SELECT attachments FROM assignment_submissions WHERE attachments IS NOT NULL AND TRIM(attachments) != ''").all();
  rows.forEach((row) => {
    result.legacyRows += 1;
    let parsed;
    try { parsed = JSON.parse(row.attachments); } catch (_error) {
      result.malformedJson += 1;
      return;
    }
    if (!Array.isArray(parsed)) {
      result.malformedShape += 1;
      return;
    }
    result.legacyItems += parsed.length;
  });
  return result;
}

async function backupDatabase(dbPath, backupDir) {
  const destination = path.join(backupDir, `db-${timestamp}.sqlite`);
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    await db.backup(destination);
  } finally {
    db.close();
  }
  const stat = fs.statSync(destination);
  if (!stat.size) throw new Error(`Empty database backup: ${destination}`);
  console.log(`[preflight] database backup: ${destination} (${stat.size} bytes)`);
  return destination;
}

async function smokeTest(baseUrl) {
  async function request(pathname, expectedStatus, description) {
    const url = new URL(pathname, baseUrl).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const body = await response.text();
    if (response.status !== expectedStatus) {
      throw new Error(`HTTP smoke ${description} expected ${expectedStatus}, got ${response.status}: ${body.slice(0, 200)}`);
    }
    console.log(`[preflight] HTTP smoke: ${description} -> ${response.status}`);
    return { response, body };
  }

  const health = await request('/api/v1/health', 200, 'health');
  if (!health.body.includes('"ok":true')) {
    throw new Error(`HTTP smoke health payload is invalid: ${health.body.slice(0, 200)}`);
  }
  await request('/uploads/release-preflight-probe.txt', 404, 'legacy uploads closed');
  await request('/api/v1/courses/not.valid.json', 400, 'invalid course id rejected');
  await request('/api/v1/files/demo-project?path=../storage', 400, 'path traversal rejected');
  await request('/api/v1/projects', 401, 'anonymous project API rejected');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const dbPath = envPath('DB_PATH', path.join(ROOT, 'storage/db/db.sqlite'));
  const backupDir = envPath('BACKUP_DIR', path.join(ROOT, 'storage/backups'));
  const reportDir = path.join(backupDir, 'preflight');
  ensureDir(backupDir);
  ensureDir(reportDir);

  auditDatabase(dbPath, reportDir);
  if (!options.checkOnly) {
    await backupDatabase(dbPath, backupDir);
    const roots = [
      ['uploads', envPath('UPLOAD_DIR', path.join(ROOT, 'storage/uploads'))],
      ['courses', envPath('COURSES_DIR', path.join(ROOT, 'content/courses'))],
      ['materials', envPath('MATERIALS_DIR', path.join(ROOT, 'content/materials'))],
      ['portal', envPath('PORTAL_DIR', path.join(ROOT, 'content/portal'))]
    ];
    roots.forEach(([name, directory]) => writeManifest(name, directory, reportDir));
  }
  if (!options.skipSmoke) await smokeTest(options.smokeUrl);
  console.log('[preflight] release checks passed');
}

main().catch((error) => {
  console.error(`[preflight] FAILED: ${error.message}`);
  process.exitCode = 1;
});
