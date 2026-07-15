module.exports.up = function up(db, { ensureColumn, ensureLookupIndex }) {
  ensureColumn(db, 'projects', 'visibility', "visibility TEXT NOT NULL DEFAULT 'public'");
  ensureColumn(db, 'projects', 'visible_to_roles', 'visible_to_roles TEXT');
  ensureColumn(db, 'projects', 'visible_to_user_ids', 'visible_to_user_ids TEXT');
  ensureColumn(db, 'projects', 'visible_to_class_names', 'visible_to_class_names TEXT');
  ensureLookupIndex(db, 'idx_projects_visibility', 'projects', 'visibility');
};
