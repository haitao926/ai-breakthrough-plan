const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const migration = require('./009_assignment_submission_attachments');

test('009 backfill is idempotent and reports malformed legacy attachment data', () => {
  const db = new Database(':memory:');
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE assignment_submissions (
      id INTEGER PRIMARY KEY,
      attachments TEXT,
      submitted_at TEXT,
      updated_at TEXT
    );
  `);
  db.prepare('INSERT INTO assignment_submissions VALUES (?, ?, ?, ?)').run(
    1,
    JSON.stringify([
      { path: 'project-1/final/report.pdf', name: 'report.pdf', size: 12, mimeType: 'application/pdf' },
      { path: '../outside.txt', name: 'outside.txt' },
      { path: 'project-1/final/report.pdf', name: 'report.pdf' }
    ]),
    '2026-07-16T00:00:00.000Z',
    '2026-07-16T00:00:00.000Z'
  );
  db.prepare('INSERT INTO assignment_submissions VALUES (?, ?, ?, ?)').run(2, '{bad', null, null);
  db.prepare('INSERT INTO assignment_submissions VALUES (?, ?, ?, ?)').run(3, JSON.stringify({ path: 'not-array' }), null, null);

  migration.up(db, { queryAll: (target, sql, params = []) => target.prepare(sql).all(...params) });
  const rows = db.prepare('SELECT submission_id, storage_key FROM assignment_submission_attachments').all();
  assert.deepEqual(rows, [{ submission_id: 1, storage_key: 'project-1/final/report.pdf' }]);

  migration.up(db, { queryAll: (target, sql, params = []) => target.prepare(sql).all(...params) });
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM assignment_submission_attachments').get().count, 1);
  db.close();
});
