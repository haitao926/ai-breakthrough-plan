module.exports.up = function up(db, { ensureColumn }) {
  ensureColumn(db, 'assignment_submissions', 'attachments', 'attachments TEXT');
};
