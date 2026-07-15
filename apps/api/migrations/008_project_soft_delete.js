module.exports.up = function up(db, { ensureColumn, ensureLookupIndex }) {
  ensureColumn(db, 'projects', 'deleted_at', 'deleted_at TEXT');
  ensureColumn(db, 'projects', 'deleted_by', 'deleted_by INTEGER');
  ensureColumn(db, 'projects', 'delete_reason', 'delete_reason TEXT');
  ensureLookupIndex(db, 'idx_projects_deleted_at', 'projects', 'deleted_at');
};
