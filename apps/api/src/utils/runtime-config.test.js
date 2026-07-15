const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const apiRoot = path.resolve(__dirname, '../..');

function runConfigCheck(secret) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'api-runtime-config-'));
  const script = `const { _internals } = require(${JSON.stringify(path.join(apiRoot, 'server.js'))}); _internals.assertRuntimeConfig();`;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: apiRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      AUTH_SECRET: secret,
      DB_PATH: path.join(root, 'db.sqlite'),
      COURSES_DIR: path.join(root, 'courses'),
      MATERIALS_DIR: path.join(root, 'materials'),
      PORTAL_DIR: path.join(root, 'portal'),
      UPLOAD_DIR: path.join(root, 'uploads'),
      LOG_DIR: path.join(root, 'logs'),
      ASSESSMENT_DIR: path.join(root, 'assessments'),
      WEB_ROOT: path.join(root, 'web')
    }
  });
  fs.rmSync(root, { recursive: true, force: true });
  return result;
}

test('production runtime rejects missing and short auth secrets', () => {
  assert.notEqual(runConfigCheck('').status, 0);
  assert.notEqual(runConfigCheck('too-short').status, 0);
  assert.equal(runConfigCheck('a'.repeat(32)).status, 0);
});

function runInviteCheck(role, configuredCode, suppliedCode) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'api-invite-config-'));
  const script = `const { _internals } = require(${JSON.stringify(path.join(apiRoot, 'server.js'))});\n`
    + `process.stdout.write(String(_internals.canRegister${role}(${JSON.stringify(suppliedCode)})));`;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: apiRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      AUTH_SECRET: 'test-secret',
      [`${role.toUpperCase()}_INVITE_CODE`]: configuredCode,
      DB_PATH: path.join(root, 'db.sqlite'),
      COURSES_DIR: path.join(root, 'courses'),
      MATERIALS_DIR: path.join(root, 'materials'),
      PORTAL_DIR: path.join(root, 'portal'),
      UPLOAD_DIR: path.join(root, 'uploads'),
      LOG_DIR: path.join(root, 'logs'),
      ASSESSMENT_DIR: path.join(root, 'assessments'),
      WEB_ROOT: path.join(root, 'web')
    }
  });
  fs.rmSync(root, { recursive: true, force: true });
  return result.stdout.trim();
}

test('teacher and judge registration stay closed without configured invite codes', () => {
  assert.equal(runInviteCheck('Teacher', '', 'anything'), 'false');
  assert.equal(runInviteCheck('Judge', '', 'anything'), 'false');
  assert.equal(runInviteCheck('Teacher', 'teacher-code', 'teacher-code'), 'true');
  assert.equal(runInviteCheck('Judge', 'judge-code', 'judge-code'), 'true');
});
