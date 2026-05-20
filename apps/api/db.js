const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DEFAULT_DB_PATH = path.join(__dirname, '../../storage/db/db.sqlite');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryGet(db, sql, params = []) {
  return queryAll(db, sql, params)[0];
}

function ensureColumn(db, tableName, columnName, columnDef) {
  const columns = queryAll(db, `PRAGMA table_info(${tableName})`);
  const exists = columns.some(col => col.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
  }
}

function ensureIndex(db, indexName, tableName, columns, where = '') {
  const safeIndex = String(indexName || '').replace(/[^a-zA-Z0-9_]/g, '');
  const safeTable = String(tableName || '').replace(/[^a-zA-Z0-9_]/g, '');
  const safeColumns = String(columns || '');
  if (!safeIndex || !safeTable || !safeColumns) return;
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ${safeIndex} ON ${safeTable} (${safeColumns}) ${where}`);
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      class_name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(team_id) REFERENCES teams(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT,
      team_members TEXT,
      class_name TEXT,
      team_id INTEGER,
      created_by INTEGER,
      legacy_key TEXT,
      gitea_repo_url TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      submitted_by INTEGER,
      type TEXT NOT NULL,
      title TEXT,
      content TEXT,
      details TEXT,
      attachments TEXT,
      status TEXT NOT NULL,
      feedback TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(submission_id) REFERENCES submissions(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(submission_id) REFERENCES submissions(id),
      FOREIGN KEY(teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS review_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      scores TEXT,
      total_score REAL,
      comment TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(submission_id) REFERENCES submissions(id),
      FOREIGN KEY(reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS score_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      criteria TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS dev_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS resource_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      requester_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'hardware' or 'token'
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT,
      status TEXT NOT NULL, -- 'pending', 'approved', 'rejected'
      reply TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(requester_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS help_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      requester_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL, -- 'low', 'normal', 'high', 'urgent'
      status TEXT NOT NULL, -- 'open', 'resolved'
      resolution TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(requester_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_blueprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL UNIQUE,
      data TEXT NOT NULL, -- JSON: { strategy: {...}, wbs: [...] }
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS project_tool_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      tool_key TEXT NOT NULL,
      data TEXT NOT NULL,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(created_by) REFERENCES users(id),
      FOREIGN KEY(updated_by) REFERENCES users(id),
      UNIQUE(project_id, tool_key)
    );

    CREATE TABLE IF NOT EXISTS project_milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      parent_id INTEGER,
      sort_order INTEGER,
      assignee TEXT,
      start_date TEXT,
      end_date TEXT,
      deadline TEXT,
      status TEXT NOT NULL, -- 'pending', 'submitted', 'approved', 'rejected'
      deliverables TEXT, -- JSON: { code_url, images: [], video_url, doc_url }
      source TEXT,
      source_key TEXT,
      ai_review TEXT, -- JSON: { score, comments, suggestions }
      teacher_score REAL,
      teacher_comment TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(parent_id) REFERENCES project_milestones(id)
    );

    CREATE TABLE IF NOT EXISTS assessment_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id TEXT NOT NULL,
      lesson_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      requirements TEXT,
      due_at TEXT,
      submit_type TEXT NOT NULL,
      rubric TEXT,
      status TEXT NOT NULL,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      content TEXT,
      link TEXT,
      attachment_note TEXT,
      status TEXT NOT NULL,
      score REAL,
      feedback TEXT,
      reviewed_by INTEGER,
      submitted_at TEXT NOT NULL,
      reviewed_at TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(assignment_id) REFERENCES assignments(id),
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS competition_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_slug TEXT NOT NULL,
      student_id INTEGER NOT NULL,
      team_name TEXT,
      class_name TEXT,
      members TEXT,
      materials TEXT,
      status TEXT NOT NULL,
      note TEXT,
      teacher_feedback TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      background TEXT,
      goals TEXT,
      difficulty TEXT,
      suggested_team_size TEXT,
      deliverables TEXT,
      related_course_id TEXT,
      related_competition_slug TEXT,
      status TEXT NOT NULL,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );
  `);

  ensureColumn(db, 'users', 'avatar_url', 'avatar_url TEXT');
  ensureColumn(db, 'projects', 'team_id', 'team_id INTEGER');
  ensureColumn(db, 'projects', 'created_by', 'created_by INTEGER');
  ensureColumn(db, 'projects', 'legacy_key', 'legacy_key TEXT');
  ensureColumn(db, 'projects', 'gitea_repo_url', 'gitea_repo_url TEXT');

  ensureColumn(db, 'submissions', 'submitted_by', 'submitted_by INTEGER');
  ensureColumn(db, 'submissions', 'details', 'details TEXT');
  ensureColumn(db, 'project_milestones', 'parent_id', 'parent_id INTEGER');
  ensureColumn(db, 'project_milestones', 'sort_order', 'sort_order INTEGER');
  ensureColumn(db, 'project_milestones', 'assignee', 'assignee TEXT');
  ensureColumn(db, 'project_milestones', 'start_date', 'start_date TEXT');
  ensureColumn(db, 'project_milestones', 'end_date', 'end_date TEXT');
  ensureColumn(db, 'project_milestones', 'source', 'source TEXT');
  ensureColumn(db, 'project_milestones', 'source_key', 'source_key TEXT');
  ensureColumn(db, 'assessment_files', 'title', 'title TEXT');
  ensureColumn(db, 'assessment_files', 'uploaded_by', 'uploaded_by INTEGER');

  ensureColumn(db, 'assignments', 'lesson_id', 'lesson_id TEXT');
  ensureColumn(db, 'assignments', 'rubric', 'rubric TEXT');
  ensureColumn(db, 'assignment_submissions', 'link', 'link TEXT');
  ensureColumn(db, 'assignment_submissions', 'attachment_note', 'attachment_note TEXT');
  ensureColumn(db, 'competition_registrations', 'teacher_feedback', 'teacher_feedback TEXT');
  ensureColumn(db, 'project_topics', 'related_course_id', 'related_course_id TEXT');
  ensureColumn(db, 'project_topics', 'related_competition_slug', 'related_competition_slug TEXT');

  ensureIndex(db, 'idx_project_tool_data_unique', 'project_tool_data', 'project_id, tool_key');
  ensureIndex(
    db,
    'idx_project_milestones_source_unique',
    'project_milestones',
    'project_id, source, source_key',
    'WHERE source IS NOT NULL AND source_key IS NOT NULL'
  );
}

async function createDatabase(dbPath = DEFAULT_DB_PATH) {
  ensureDir(path.dirname(dbPath));

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
  });

  const fileExists = fs.existsSync(dbPath);
  const db = new SQL.Database(fileExists ? fs.readFileSync(dbPath) : undefined);
  initSchema(db);

  const persist = () => {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  };

  persist();

  const runInternal = (sql, params = []) => {
    db.run(sql, params);
    const last = queryGet(db, 'SELECT last_insert_rowid() AS id');
    const changes = db.getRowsModified();
    return {
      lastInsertRowid: last ? last.id : null,
      changes
    };
  };

  return {
    all(sql, params = []) {
      return queryAll(db, sql, params);
    },
    get(sql, params = []) {
      return queryGet(db, sql, params);
    },
    run(sql, params = [], options = {}) {
      let actualParams = params;
      let actualOptions = options;
      if (!Array.isArray(params)) {
        actualOptions = params || {};
        actualParams = [];
      }
      const result = runInternal(sql, actualParams);
      if (!actualOptions.skipPersist) {
        persist();
      }
      return result;
    },
    exec(sql, options = {}) {
      db.exec(sql);
      if (!options.skipPersist) {
        persist();
      }
    },
    transaction(fn) {
      db.exec('BEGIN');
      try {
        const result = fn({
          all(sql, params = []) {
            return queryAll(db, sql, params);
          },
          get(sql, params = []) {
            return queryGet(db, sql, params);
          },
          run(sql, params = []) {
            return runInternal(sql, params);
          },
          exec(sql) {
            db.exec(sql);
          }
        });
        db.exec('COMMIT');
        persist();
        return result;
      } catch (err) {
        db.exec('ROLLBACK');
        persist();
        throw err;
      }
    }
  };
}

module.exports = {
  createDatabase,
  DEFAULT_DB_PATH
};
