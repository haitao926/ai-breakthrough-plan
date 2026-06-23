function createProjectReviewRepository(deps) {
  const {
    db,
    buildProjectFilters,
    getProjectDetail,
    getProjectMilestones,
    getProjectResources,
    getProjectDevLogs,
    buildProjectReviewMeta
  } = deps;

  return {
    listQueue(query = {}) {
      const { conditions, params } = buildProjectFilters(query, 'p');
      let sql = 'SELECT p.* FROM projects p';
      if (conditions.length) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
      sql += ' ORDER BY p.updated_at DESC';

      return db.all(sql, params).map((project) => {
        const detail = getProjectDetail(project.id);
        const milestones = getProjectMilestones(project.id);
        const resources = getProjectResources(project.id);
        const devLogs = getProjectDevLogs(project.id);
        const meta = buildProjectReviewMeta(detail, milestones, resources, devLogs);
        const memberNames = (detail.members || []).map((item) => item.name).filter(Boolean);

        return {
          ...project,
          members: detail.members || [],
          memberNames,
          latestSubmission: meta.latestSubmission,
          pendingSubmissionCount: meta.pendingSubmissionCount,
          pendingMilestoneCount: meta.pendingMilestoneCount,
          milestoneProgress: meta.milestoneProgress,
          resourcesPendingCount: meta.resourcesPendingCount,
          implementationLogCount: meta.implementationLogCount,
          reviewBucket: meta.reviewBucket,
          alerts: meta.alerts,
          latestActivityAt: [
            project.updated_at,
            meta.latestSubmission?.created_at,
            devLogs[0]?.created_at,
            resources[0]?.updated_at
          ].filter(Boolean).sort().at(-1) || project.updated_at
        };
      });
    }
  };
}

module.exports = { createProjectReviewRepository };
