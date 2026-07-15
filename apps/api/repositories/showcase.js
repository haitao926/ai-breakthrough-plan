function createShowcaseRepository(deps) {
  const { db, buildProjectFilters, safeParseJson, getSubmissionAttachments, canReadProject } = deps;

  return {
    list(filters = {}, user = null) {
      const { conditions, params } = buildProjectFilters(filters, 'p');
      let sql = `
        SELECT
          p.id AS project_id,
          p.title AS project_title,
          p.summary AS project_summary,
          p.team_members AS project_team_members,
          p.class_name AS project_class_name,
          p.created_by AS project_created_by,
          p.visibility AS project_visibility,
          p.visible_to_roles AS project_visible_to_roles,
          p.visible_to_user_ids AS project_visible_to_user_ids,
          p.visible_to_class_names AS project_visible_to_class_names,
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
          AND s.status = 'approved'
          AND p.deleted_at IS NULL
      `;
      if (conditions.length) {
        sql += ` AND ${conditions.join(' AND ')}`;
      }
      sql += ' ORDER BY s.created_at DESC';

      return db.all(sql, params)
        .map(row => {
          const project = {
          id: row.project_id,
          title: row.project_title,
          summary: row.project_summary,
          team_members: row.project_team_members,
          class_name: row.project_class_name,
          created_by: row.project_created_by,
          visibility: row.project_visibility,
          visible_to_roles: row.project_visible_to_roles,
          visible_to_user_ids: row.project_visible_to_user_ids,
          visible_to_class_names: row.project_visible_to_class_names,
          status: row.project_status,
          created_at: row.project_created_at,
          updated_at: row.project_updated_at
          };
          return {
            project,
            showcase: {
              id: row.submission_id,
              title: row.submission_title,
              content: row.submission_content,
              details: safeParseJson(row.submission_details),
              created_at: row.submission_created_at,
              attachments: getSubmissionAttachments(row.submission_id, row.submission_attachments)
            }
          };
        })
        .filter(item => typeof canReadProject !== 'function' || canReadProject(user, item.project));
    }
  };
}

module.exports = { createShowcaseRepository };
