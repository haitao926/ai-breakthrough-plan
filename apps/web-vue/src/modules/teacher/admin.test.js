import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDefaultReminderBody,
  createEmptyAssignmentForm,
  createEmptyCompetitionForm,
  deriveCompetitionDraftFromText,
  getBannerFormErrors,
  getCompetitionReminderStatus,
  getQueueCelebration,
  getStatusLabel,
  getSubmissionSummary,
  getStoryFormErrors,
  getSelectedCompetitionDeadline,
  hasDraftContent,
  isOwnedByTeacher,
  isDeadlinePast,
  parseChineseDate,
  syncCourseForm
} from './admin.js';

test('createEmptyAssignmentForm uses provided default lesson id', () => {
  const form = createEmptyAssignmentForm('lesson-2');
  assert.equal(form.lessonId, 'lesson-2');
  assert.equal(form.status, 'published');
});

test('deriveCompetitionDraftFromText extracts key fields', () => {
  const draft = deriveCompetitionDraftFromText(`
  上海市青少年 AI 挑战赛
  报名时间：2026年6月-2026年7月
  主办单位：上海市青少年活动中心
  地点：上海
  `);

  assert.equal(draft.title, '上海市青少年 AI 挑战赛');
  assert.match(draft.dateRange, /2026/);
  assert.match(draft.host, /上海市青少年活动中心/);
  assert.equal(draft.status, '报名中');
});

test('createEmptyCompetitionForm starts in draft mode', () => {
  const form = createEmptyCompetitionForm();
  assert.equal(form.publishStatus, 'draft');
  assert.equal(form.status, '报名中');
});

test('syncCourseForm joins learning objectives', () => {
  const form = syncCourseForm({
    id: 'course-1',
    title: '课程',
    learningObjectives: ['目标一', '目标二']
  });
  assert.equal(form.id, 'course-1');
  assert.equal(form.learningObjectivesText, '目标一\n目标二');
});

test('getStatusLabel and submission summary use teacher page wording', () => {
  assert.equal(getStatusLabel('reviewing'), '审核中');
  assert.equal(getSubmissionSummary({ details: { featureSummary: '完成原型' } }), '完成原型');
});

test('isOwnedByTeacher accepts missing owner and exact owner id', () => {
  assert.equal(isOwnedByTeacher({}, 12), true);
  assert.equal(isOwnedByTeacher({ createdBy: 12 }, 12), true);
  assert.equal(isOwnedByTeacher({ created_by: 9 }, 12), false);
});

test('teacher admin helpers derive deadline state and reminder copy', () => {
  const competition = {
    title: '机器人赛',
    fitSummary: '适合机器人方向学生',
    detail: {
      timeline: [
        { label: '报名截止', date: '2026年7月1日' }
      ]
    }
  };
  const deadlineText = getSelectedCompetitionDeadline(competition);
  const deadlineDate = parseChineseDate(deadlineText);
  assert.equal(deadlineText, '2026年7月1日');
  assert.equal(isDeadlinePast(deadlineDate, new Date('2026-07-02T00:00:00+08:00').getTime()), true);
  assert.equal(getCompetitionReminderStatus({ competition, deadlineText, deadlinePast: false }), '报名截止：2026年7月1日');
  assert.match(buildDefaultReminderBody({ competition, deadlineText, deadlinePast: false }), /机器人赛/);
});

test('teacher admin helpers validate publish forms and queue celebration', () => {
  assert.equal(hasDraftContent({ title: '草稿' }), true);
  assert.deepEqual(getBannerFormErrors({ title: '', targetUrl: '', priority: -1 }), {
    title: '请输入 Banner 标题。',
    targetUrl: '请输入 Banner 目标链接。',
    priority: '优先级需要是大于等于 0 的数字。'
  });
  assert.deepEqual(getStoryFormErrors({
    storyForm: { title: '', slug: '', summary: '' },
    selectedStorySlug: ''
  }), {
    title: '请输入成果故事标题。',
    slug: '新建成果故事时必须填写 slug。',
    summary: '请填写成果摘要，方便门户页直接展示。'
  });
  assert.equal(getQueueCelebration(3, 0), true);
});
