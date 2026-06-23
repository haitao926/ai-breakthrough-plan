export function buildAlertProjects(reviewQueue = [], limit = 8) {
  return reviewQueue.filter((project) =>
    project.status === 'rejected'
      || project.status === 'needs_changes'
      || Number(project.pendingSubmissionCount || 0) > 0
      || Number(project.resourcesPendingCount || 0) > 0
  ).slice(0, limit);
}

export function buildProjectQueues(reviewProjects = []) {
  const countByBucket = (bucket) => reviewProjects.filter((item) => item.reviewBucket === bucket).length;
  return [
    { key: 'project_review', label: '待立项审核', count: countByBucket('project_review') },
    { key: 'stage_review', label: '阶段待审核', count: countByBucket('stage_review') },
    { key: 'active', label: '进行中', count: countByBucket('active') },
    { key: 'attention', label: '需关注', count: countByBucket('attention') },
    { key: 'resource_pending', label: '资源待审批', count: countByBucket('resource_pending') },
    { key: 'archived', label: '已归档', count: countByBucket('archived') }
  ];
}

export function filterReviewProjects(reviewProjects = [], activeQueue = 'project_review') {
  return reviewProjects.filter((item) => item.reviewBucket === activeQueue);
}

export function buildStatusActions(currentStatus = '') {
  const items = [];
  if (currentStatus === 'submitted') {
    items.push({ status: 'reviewing', label: '进入审核', note: '教师进入立项审核', danger: false });
    items.push({ status: 'rejected', label: '退回立项', note: '立项不通过，需修改后再提', danger: true });
  } else if (currentStatus === 'reviewing') {
    items.push({ status: 'approved', label: '通过立项', note: '立项通过', danger: false });
    items.push({ status: 'rejected', label: '退回立项', note: '立项不通过，需修改后再提', danger: true });
  } else if (currentStatus === 'approved') {
    items.push({ status: 'in_progress', label: '推进实施', note: '允许进入实施阶段', danger: false });
  } else if (currentStatus === 'in_progress') {
    items.push({ status: 'midterm_review', label: '进入中期审核', note: '中期提交已到达审核节点', danger: false });
    items.push({ status: 'final_review', label: '进入结题审核', note: '结题提交已到达审核节点', danger: false });
  } else if (currentStatus === 'midterm_review') {
    items.push({ status: 'in_progress', label: '通过中期', note: '中期通过，回到实施状态', danger: false });
    items.push({ status: 'in_progress', label: '退回中期', note: '中期需修改后再提交', danger: true });
  } else if (currentStatus === 'final_review') {
    items.push({ status: 'archived', label: '归档结题', note: '结题通过，归档项目', danger: false });
    items.push({ status: 'in_progress', label: '退回结题', note: '结题需修改', danger: true });
  } else if (currentStatus === 'rejected') {
    items.push({ status: 'submitted', label: '重新提交', note: '允许学生再次提交', danger: false });
  }
  return items;
}
