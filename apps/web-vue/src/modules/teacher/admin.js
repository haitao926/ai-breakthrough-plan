export function createEmptyCourseForm(teacherName = '', mode = 'create') {
  return {
    mode,
    id: '',
    title: '',
    teacherName,
    summary: '',
    audience: '',
    pace: '4 课时',
    learningObjectivesText: '',
    status: 'draft'
  };
}

export function createEmptyAssignmentForm(defaultLessonId = '') {
  return {
    id: null,
    title: '',
    lessonId: defaultLessonId,
    dueAt: '',
    submitType: 'mixed',
    requirements: '',
    status: 'published'
  };
}

export function createEmptyCompetitionForm() {
  return {
    editing: false,
    title: '',
    slug: '',
    status: '报名中',
    publishStatus: 'draft',
    dateRange: '',
    host: '',
    location: '',
    fitSummary: '',
    schoolStageText: '',
    tagsText: '',
    requiredSkillsText: '',
    recommendedSkillsText: '',
    difficulty: '',
    estimatedHours: '',
    registrationDeadline: '',
    eligibilityNotes: '',
    relatedCourseIdsText: ''
  };
}

export function createEmptyBannerForm() {
  return {
    pageKey: 'home',
    title: '',
    type: 'feature',
    tag: '',
    summary: '',
    image: '',
    imageAlt: '',
    targetUrl: '',
    buttonText: '',
    active: true,
    layout: '',
    priority: 999
  };
}

export function createEmptyStoryForm() {
  return {
    title: '',
    slug: '',
    studentLabel: '',
    summary: '',
    result: '',
    relatedCompetitionSlug: '',
    relatedCourseIdsText: '',
    cover: '',
    featured: false
  };
}

export function deriveCompetitionDraftFromText(text, currentSlug = '') {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const lines = raw.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const title = lines.find((line) => /赛|活动|挑战|展示|马拉松/.test(line)) || lines[0] || '';
  const dateLine = lines.find((line) => /(20\d{2}|报名|截止|时间|日期|学期|全年)/.test(line)) || '';
  const hostLine = lines.find((line) => /(主办|承办|组织|中心|协会|联盟|学校|少年宫)/.test(line)) || '';
  const locationLine = lines.find((line) => /(上海|校内|线上|线下|赛区|地点|地址)/.test(line)) || '';

  const normalizedTitle = title.replace(/^(赛事名称|活动名称)[:：]\s*/, '').slice(0, 80);
  const derivedSlug = currentSlug || normalizedTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    || `competition-${Date.now()}`;

  return {
    title: normalizedTitle,
    slug: derivedSlug,
    publishStatus: 'draft',
    status: /截止|已结束/.test(raw) ? '已结束' : (/即将|预告/.test(raw) ? '即将开始' : '报名中'),
    dateRange: dateLine.replace(/^(时间|报名时间|日期)[:：]\s*/, '').slice(0, 80),
    host: hostLine.replace(/^(主办|主办单位|组织单位)[:：]\s*/, '').slice(0, 80),
    location: locationLine.replace(/^(地点|比赛地点|地址)[:：]\s*/, '').slice(0, 80),
    fitSummary: lines.slice(0, 4).join(' ').slice(0, 220)
  };
}

export function syncCourseForm(course) {
  return {
    mode: 'edit',
    id: course?.id || '',
    title: course?.title || '',
    teacherName: course?.teacherName || '',
    summary: course?.summary || '',
    audience: course?.audience || '',
    pace: course?.pace || '',
    learningObjectivesText: Array.isArray(course?.learningObjectives) ? course.learningObjectives.join('\n') : '',
    status: course?.status || 'draft'
  };
}

export function syncCompetitionForm(item) {
  return {
    editing: Boolean(item),
    title: item?.title || '',
    slug: item?.slug || '',
    status: item?.status || '报名中',
    publishStatus: item?.publishStatus || 'draft',
    dateRange: item?.dateRange || '',
    host: item?.host || '',
    location: item?.location || '',
    fitSummary: item?.fitSummary || '',
    schoolStageText: (item?.schoolStage || []).join(','),
    tagsText: (item?.tags || []).join(','),
    requiredSkillsText: (item?.requiredSkills || []).join(','),
    recommendedSkillsText: (item?.recommendedSkills || []).join(','),
    difficulty: item?.difficulty || '',
    estimatedHours: item?.estimatedHours === null || item?.estimatedHours === undefined ? '' : String(item.estimatedHours),
    registrationDeadline: item?.registrationDeadline || '',
    eligibilityNotes: item?.eligibilityNotes || '',
    relatedCourseIdsText: (item?.relatedCourseIds || []).join(',')
  };
}

export function syncBannerForm(item) {
  return {
    pageKey: item?.pageKey || 'home',
    title: item?.title || '',
    type: item?.type || 'feature',
    tag: item?.tag || '',
    summary: item?.summary || item?.subtitle || '',
    image: item?.image || '',
    imageAlt: item?.imageAlt || '',
    targetUrl: item?.targetUrl || '',
    buttonText: item?.buttonText || item?.ctaLabel || '',
    active: item?.active ?? true,
    layout: item?.layout || '',
    priority: Number.isFinite(Number(item?.priority)) ? Number(item.priority) : 999
  };
}

export function syncStoryForm(item) {
  return {
    title: item?.title || '',
    slug: item?.slug || '',
    studentLabel: item?.studentLabel || '',
    summary: item?.summary || '',
    result: item?.result || '',
    relatedCompetitionSlug: item?.relatedCompetitionSlug || '',
    relatedCourseIdsText: (item?.relatedCourseIds || []).join(','),
    cover: item?.cover || '',
    featured: Boolean(item?.featured)
  };
}

export function getStatusLabel(status) {
  return {
    draft: '草稿',
    published: '已发布',
    archived: '已归档',
    submitted: '已提交',
    reviewed: '已批改',
    needs_changes: '需修改',
    pending: '待处理',
    approved: '已通过',
    rejected: '已退回',
    reviewing: '审核中',
    in_progress: '进行中',
    midterm_review: '中期审核',
    final_review: '结题审核'
  }[status] || status || '未设置';
}

export function getSubmissionTypeLabel(type) {
  return {
    proposal: '立项',
    milestone_1: '里程碑一',
    milestone_2: '里程碑二',
    milestone_3: '里程碑三',
    midterm: '中期',
    final: '结题',
    showcase: '展示'
  }[type] || type || '提交';
}

export function getSubmissionSummary(submission) {
  const detail = submission?.details || {};
  return detail.problem || detail.progressSummary || detail.featureSummary || detail.deliverables || detail.demo || '';
}

export function isOwnedByTeacher(item, teacherId) {
  const ownerId = item?.createdBy || item?.created_by;
  return !ownerId || Number(ownerId) === Number(teacherId || 0);
}

export function hasDraftContent(value = {}) {
  return Object.values(value || {}).some((item) => {
    if (typeof item === 'boolean') return item;
    if (typeof item === 'number') return item !== 0;
    return String(item || '').trim().length > 0;
  });
}

export function parseChineseDate(value = '') {
  const text = String(value || '').trim();
  const match = text.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function getSelectedCompetitionDeadline(competition) {
  const timeline = Array.isArray(competition?.detail?.timeline)
    ? competition.detail.timeline
    : [];
  const item = timeline.find(entry => /截止|报送|提交/.test(String(entry.label || '')));
  return item?.date || '';
}

export function isDeadlinePast(deadlineDate, nowMs = Date.now()) {
  if (!deadlineDate) return false;
  const endOfDay = new Date(deadlineDate);
  endOfDay.setHours(23, 59, 59, 999);
  return nowMs > endOfDay.getTime();
}

export function getCompetitionReminderStatus({ competition, deadlineText, deadlinePast }) {
  if (!competition) return '';
  if (!deadlineText) return '未设置明确报名截止时间';
  return deadlinePast ? `报名截止已过：${deadlineText}` : `报名截止：${deadlineText}`;
}

export function buildDefaultReminderBody({ competition, deadlineText, deadlinePast }) {
  if (!competition) return '';
  const deadline = deadlineText || '请查看赛事详情页';
  const prefix = deadlinePast
    ? '这项赛事报名截止已过，请尽快确认是否已完成报名或是否需要补充材料。'
    : `这项赛事报名截止为 ${deadline}，请尽快确认是否报名。`;
  return `${prefix}\n赛事：${competition.title}\n准备建议：${competition.prepAdvice || competition.fitSummary || '请查看赛事详情页和官方通知。'}`;
}

export function getBannerFormErrors(bannerForm = {}) {
  const errors = {};
  if (!String(bannerForm.title || '').trim()) errors.title = '请输入 Banner 标题。';
  if (!String(bannerForm.targetUrl || '').trim()) errors.targetUrl = '请输入 Banner 目标链接。';
  if (!Number.isFinite(Number(bannerForm.priority)) || Number(bannerForm.priority) < 0) {
    errors.priority = '优先级需要是大于等于 0 的数字。';
  }
  return errors;
}

export function getStoryFormErrors({ storyForm = {}, selectedStorySlug = '' }) {
  const errors = {};
  if (!String(storyForm.title || '').trim()) errors.title = '请输入成果故事标题。';
  if (!selectedStorySlug && !String(storyForm.slug || '').trim()) errors.slug = '新建成果故事时必须填写 slug。';
  if (!String(storyForm.summary || '').trim()) errors.summary = '请填写成果摘要，方便门户页直接展示。';
  return errors;
}

export function getQueueCelebration(previousQueueTotal, queueTotal) {
  return previousQueueTotal > 0 && queueTotal === 0;
}
