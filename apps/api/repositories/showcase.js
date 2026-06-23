function createShowcaseRepository(deps) {
  const { db, buildProjectFilters, safeParseJson, getSubmissionAttachments } = deps;

  return {
    list(filters = {}) {
      const { conditions, params } = buildProjectFilters(filters, 'p');
      let sql = `
        SELECT
          p.id AS project_id,
          p.title AS project_title,
          p.summary AS project_summary,
          p.team_members AS project_team_members,
          p.class_name AS project_class_name,
          p.status AS project_status,
          p.created_at AS project_created_at,
          p.updated_at AS project_updated_at,
          s.id AS submission_id,
          s.title AS submission_title,
          s.content AS submission_content,
          s.details AS submission_details,
          s.attachments AS submission_attachments,
          s.created_at AS submission_created_at
        FROM projects p
        JOIN submissions s ON s.project_id = p.id
        WHERE s.type = 'showcase'
      `;
      if (conditions.length) {
        sql += ` AND ${conditions.join(' AND ')}`;
      }
      sql += ' ORDER BY s.created_at DESC';

      return db.all(sql, params).map(row => ({
        project: {
          id: row.project_id,
          title: row.project_title,
          summary: row.project_summary,
          team_members: row.project_team_members,
          class_name: row.project_class_name,
          status: row.project_status,
          created_at: row.project_created_at,
          updated_at: row.project_updated_at
        },
        showcase: {
          id: row.submission_id,
          title: row.submission_title,
          content: row.submission_content,
          details: safeParseJson(row.submission_details),
          created_at: row.submission_created_at,
          attachments: getSubmissionAttachments(row.submission_id, row.submission_attachments)
        }
      }));
    }
  };
}

module.exports = { createShowcaseRepository };
