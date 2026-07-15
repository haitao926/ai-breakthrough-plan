module.exports.up = function up(db, { queryAll }) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignment_submission_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      original_name TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(submission_id, storage_key),
      FOREIGN KEY(submission_id) REFERENCES assignment_submissions(id)
    );
    CREATE INDEX IF NOT EXISTS idx_assignment_submission_attachments_submission
      ON assignment_submission_attachments(submission_id, sort_order, id);
  `);

  const rows = queryAll(db,
    'SELECT id, attachments, submitted_at, updated_at FROM assignment_submissions WHERE attachments IS NOT NULL AND TRIM(attachments) != ?',
    ['']
  );
  let migrated = 0;
  rows.forEach((row) => {
    let parsed;
    try {
      parsed = JSON.parse(row.attachments);
    } catch (_err) {
      parsed = [];
    }
    if (!Array.isArray(parsed)) return;
    parsed.forEach((item, index) => {
      const source = typeof item === 'string' ? { path: item } : item;
      const storageKey = String(source?.path || '').trim().replace(/\\/g, '/');
      if (!storageKey) return;
      const originalName = String(source?.name || storageKey.split('/').pop() || '附件').trim();
      const fileSize = Number(source?.size);
      const result = db.prepare(
        `INSERT OR IGNORE INTO assignment_submission_attachments
         (submission_id, original_name, storage_key, mime_type, file_size, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        row.id,
        originalName || '附件',
        storageKey,
        String(source?.mimeType || source?.mime_type || '').trim() || null,
        Number.isFinite(fileSize) && fileSize >= 0 ? fileSize : 0,
        index,
        row.updated_at || row.submitted_at || new Date().toISOString()
      );
      migrated += result.changes;
    });
  });

  // Keep this value in process output only; the JSON column remains for one
  // compatibility cycle so an older binary can still read submissions.
  if (migrated > 0) process.stdout.write(`[migration 009] migrated ${migrated} assignment attachments\n`);
};
