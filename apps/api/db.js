const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DEFAULT_DB_PATH = path.join(__dirname, '../../storage/db/db.sqlite');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function queryAll(db, sql, params = []) {
  return db.prepare(sql).all(...params);
}

function queryGet(db, sql, params = []) {
  return db.prepare(sql).get(...params);
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

function ensureLookupIndex(db, indexName, tableName, columns, where = '') {
  const safeIndex = String(indexName || '').replace(/[^a-zA-Z0-9_]/g, '');
  const safeTable = String(tableName || '').replace(/[^a-zA-Z0-9_]/g, '');
  const safeColumns = String(columns || '');
  if (!safeIndex || !safeTable || !safeColumns) return;
  db.exec(`CREATE INDEX IF NOT EXISTS ${safeIndex} ON ${safeTable} (${safeColumns}) ${where}`);
}

function applyMigrations(db) {
  if (!fs.existsSync(MIGRATIONS_DIR)) return;
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql') || file.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b));
  if (!files.length) return;

  const bootstrapPath = path.join(MIGRATIONS_DIR, '001_create_migrations_table.sql');
  if (fs.existsSync(bootstrapPath)) {
    db.exec(fs.readFileSync(bootstrapPath, 'utf8'));
  }

  const table = queryGet(
    db,
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_migrations'"
  );
  if (!table) return;

  const applied = new Set(
    queryAll(db, 'SELECT name FROM _migrations ORDER BY id ASC').map(row => row.name)
  );

  const applyOne = db.transaction((name, migration) => {
    if (typeof migration === 'string') {
      db.exec(migration);
    } else {
      migration(db, {
        queryAll,
        queryGet,
        ensureColumn,
        ensureIndex,
        ensureLookupIndex
      });
    }
    db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(name, new Date().toISOString());
  });

  files.forEach((file) => {
    if (applied.has(file)) return;
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (file.endsWith('.sql')) {
      applyOne(file, fs.readFileSync(filePath, 'utf8'));
      return;
    }
    delete require.cache[require.resolve(filePath)];
    const migrationModule = require(filePath);
    const migration = typeof migrationModule === 'function' ? migrationModule : migrationModule?.up;
    if (typeof migration !== 'function') {
      throw new Error(`Migration ${file} must export a function or { up() }`);
    }
    applyOne(file, migration);
  });
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      username TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      gitea_username TEXT,
      gitea_synced_at TEXT,
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

    CREATE TABLE IF NOT EXISTS competition_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_slug TEXT NOT NULL,
      student_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      target_group TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      read_at TEXT,
      FOREIGN KEY(student_id) REFERENCES users(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      school_stage TEXT,
      grade_level TEXT,
      class_name TEXT,
      interest_tags TEXT,
      skill_tags TEXT,
      target_tags TEXT,
      weekly_hours INTEGER,
      experience_level TEXT,
      preferred_team_size TEXT,
      device_access TEXT,
      notes TEXT,
      profile_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS teacher_student_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(teacher_id, student_id),
      FOREIGN KEY(teacher_id) REFERENCES users(id),
      FOREIGN KEY(student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS match_taxonomy_terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term_type TEXT NOT NULL,
      term_key TEXT NOT NULL,
      label TEXT NOT NULL,
      aliases TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS match_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 0,
      eligibility_status TEXT NOT NULL,
      rule_breakdown TEXT,
      reasons TEXT,
      gaps TEXT,
      ai_summary TEXT,
      ai_advice TEXT,
      rule_version TEXT,
      ai_version TEXT,
      source_snapshot TEXT,
      computed_at TEXT NOT NULL,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS match_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      target_type TEXT,
      target_key TEXT,
      event_type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS match_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      interaction_type TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS match_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      override_type TEXT NOT NULL,
      note TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS match_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      candidate_bucket TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      background TEXT,
      goals TEXT,
      difficulty TEXT,
      tags TEXT,
      required_skills TEXT,
      estimated_hours INTEGER,
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

    CREATE TABLE IF NOT EXISTS knowledge_disciplines (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_learning_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discipline_id TEXT NOT NULL UNIQUE,
      data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(discipline_id) REFERENCES knowledge_disciplines(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_series (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source_url TEXT,
      data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_series_videos (
      id TEXT PRIMARY KEY,
      series_id TEXT NOT NULL,
      episode TEXT,
      title TEXT NOT NULL,
      bvid TEXT,
      duration_minutes REAL,
      url TEXT,
      embed_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(series_id) REFERENCES knowledge_series(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_open_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discipline_id TEXT NOT NULL,
      episode_key TEXT NOT NULL,
      prompt_id TEXT NOT NULL,
      prompt_type TEXT,
      prompt TEXT NOT NULL,
      options_json TEXT,
      correct_answer TEXT,
      expectation TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(discipline_id) REFERENCES knowledge_disciplines(id),
      UNIQUE(discipline_id, episode_key, prompt_id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discipline_id TEXT NOT NULL,
      episode_key TEXT,
      episode_index INTEGER,
      user_id INTEGER,
      display_name TEXT NOT NULL,
      focus TEXT,
      answers TEXT NOT NULL,
      summary TEXT,
      ai_score REAL,
      ai_feedback TEXT,
      ai_rubric TEXT,
      score_provider TEXT,
      learner_token TEXT,
      viewer_token TEXT NOT NULL,
      passed INTEGER NOT NULL DEFAULT 0,
      share_publicly INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Legacy column backfills now live in versioned migrations so startup no longer
  // depends on a growing list of ad hoc runtime schema patches.
}

function createDatabase(dbPath = DEFAULT_DB_PATH) {
  ensureDir(path.dirname(dbPath));
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  initSchema(db);
  applyMigrations(db);

  const runInternal = (sql, params = []) => {
    const info = db.prepare(sql).run(...params);
    return {
      lastInsertRowid: Number.isFinite(Number(info.lastInsertRowid)) ? Number(info.lastInsertRowid) : null,
      changes: info.changes || 0
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
      if (!Array.isArray(params)) {
        actualParams = [];
      }
      return runInternal(sql, actualParams);
    },
    exec(sql) {
      db.exec(sql);
    },
    transaction(fn) {
      return db.transaction(() => fn({
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
      }))();
    }
  };
}

module.exports = {
  createDatabase,
  DEFAULT_DB_PATH,
  MIGRATIONS_DIR
};
