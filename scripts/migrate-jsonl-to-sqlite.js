const fs = require('fs');
const path = require('path');
const { createDatabase, DEFAULT_DB_PATH } = require('../apps/api/db');

const ROOT_DIR = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT_DIR, 'storage', 'uploads');
const JSONL_PATH = process.env.JSONL_PATH || path.join(UPLOAD_DIR, 'submissions.jsonl');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

function safeIsoDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function readJsonLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').filter(Boolean);
}

function sanitizeSegment(value) {
  return String(value || '').replace(/[\\/]/g, '').trim();
}

async function main() {
  if (!fs.existsSync(JSONL_PATH)) {
    console.error(`未找到 submissions.jsonl：${JSONL_PATH}`);
    process.exit(1);
  }

  const db = await createDatabase(DB_PATH);
  const lines = readJsonLines(JSONL_PATH);

  let inserted = 0;
  let skipped = 0;
  let missing = 0;

  db.transaction(tx => {
    const existingPaths = new Set(
      tx.all('SELECT file_path FROM attachments').map(row => row.file_path)
    );
    const projectMap = new Map();

    lines.forEach(line => {
      let entry;
      try {
        entry = JSON.parse(line);
      } catch (err) {
        skipped += 1;
        return;
      }

      const legacyProject = String(entry.project || '').trim();
      const filename = String(entry.filename || '').trim();
      const studentName = sanitizeSegment(entry.studentName);
      if (!legacyProject || !filename) {
        skipped += 1;
        return;
      }

      const candidateDirs = [path.join(UPLOAD_DIR, legacyProject)];
      if (studentName) {
        candidateDirs.push(path.join(UPLOAD_DIR, legacyProject, studentName));
      }
      const absolutePath = candidateDirs
        .map(dir => path.join(dir, filename))
        .find(candidate => fs.existsSync(candidate));
      if (!absolutePath) {
        missing += 1;
        return;
      }
      const relativePath = path.relative(UPLOAD_DIR, absolutePath).split(path.sep).join('/');
      if (existingPaths.has(relativePath)) {
        skipped += 1;
        return;
      }

      let projectId = projectMap.get(legacyProject);
      if (!projectId) {
        const existingProject = tx.get(
          'SELECT id FROM projects WHERE legacy_key = ?',
          [legacyProject]
        );
        if (existingProject) {
          projectId = existingProject.id;
        } else {
          const createdAt = safeIsoDate(entry.savedAt || entry.createdAt);
          const info = tx.run(
            `INSERT INTO projects (title, summary, team_members, class_name, status, created_at, updated_at, legacy_key)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `Legacy ${legacyProject}`,
              '历史数据迁移',
              '',
              '',
              'archived',
              createdAt,
              createdAt,
              legacyProject
            ]
          );
          projectId = info.lastInsertRowid;
        }
        projectMap.set(legacyProject, projectId);
      }

      const createdAt = safeIsoDate(entry.savedAt || entry.createdAt);
      const details = {
        studentName: entry.studentName || '',
        mimeType: entry.mimeType || '',
        legacyProject,
        savedAt: entry.savedAt || ''
      };

      const submissionInfo = tx.run(
        `INSERT INTO submissions (project_id, type, title, content, details, attachments, status, feedback, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          'legacy',
          filename,
          entry.studentName || '',
          JSON.stringify(details),
          null,
          'submitted',
          '',
          createdAt
        ]
      );

      const stats = fs.statSync(absolutePath);
      tx.run(
        'INSERT INTO attachments (submission_id, file_name, file_path, file_size, created_at) VALUES (?, ?, ?, ?, ?)',
        [
          submissionInfo.lastInsertRowid,
          filename,
          relativePath,
          stats.size || entry.size || 0,
          createdAt
        ]
      );

      existingPaths.add(relativePath);
      inserted += 1;
    });
  });

  console.log(`迁移完成：新增 ${inserted} 条，跳过 ${skipped} 条，缺失文件 ${missing} 条。`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
