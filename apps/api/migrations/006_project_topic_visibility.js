module.exports.up = function up(db, { ensureColumn, ensureLookupIndex }) {
  ensureColumn(db, 'project_topics', 'visibility', "visibility TEXT NOT NULL DEFAULT 'public'");
  ensureColumn(db, 'project_topics', 'visible_to_roles', 'visible_to_roles TEXT');
  ensureColumn(db, 'project_topics', 'visible_to_user_ids', 'visible_to_user_ids TEXT');
  ensureColumn(db, 'project_topics', 'visible_to_class_names', 'visible_to_class_names TEXT');
  ensureLookupIndex(db, 'idx_project_topics_visibility', 'project_topics', 'visibility');
};
