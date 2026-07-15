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
  let sourceRows = 0;
  let sourceItems = 0;
  let migrated = 0;
  let duplicates = 0;
  let invalidJson = 0;
  let invalidShape = 0;
  let invalidStorageKey = 0;
  rows.forEach((row) => {
    sourceRows += 1;
    let parsed;
    try {
      parsed = JSON.parse(row.attachments);
    } catch (_err) {
      invalidJson += 1;
      return;
    }
    if (!Array.isArray(parsed)) {
      invalidShape += 1;
      return;
    }
    parsed.forEach((item, index) => {
      sourceItems += 1;
      const source = typeof item === 'string' ? { path: item } : item;
      if (!source || typeof source !== 'object') {
        invalidShape += 1;
        return;
      }
      const storageKey = String(source?.path || '').trim().replace(/\\/g, '/');
      if (!storageKey || storageKey.startsWith('/') || storageKey.split('/').some(part => part === '..' || part === '.')) {
        invalidStorageKey += 1;
        return;
      }
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
      if (result.changes) migrated += 1;
      else duplicates += 1;
    });
  });

  // Keep this value in process output only; the JSON column remains for one
  // compatibility cycle so an older binary can still read submissions. The
  // reconciliation counters make malformed legacy data visible before launch.
  process.stdout.write(
    `[migration 009] source_rows=${sourceRows} source_items=${sourceItems} migrated=${migrated} `
    + `duplicates=${duplicates} invalid_json=${invalidJson} invalid_shape=${invalidShape} `
    + `invalid_storage_key=${invalidStorageKey}\n`
  );
};
