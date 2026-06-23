import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAlertProjects,
  buildProjectQueues,
  buildStatusActions,
  filterReviewProjects
} from './review.js';

test('buildAlertProjects keeps only actionable review items', () => {
  const alerts = buildAlertProjects([
    { id: 1, status: 'rejected', pendingSubmissionCount: 0, resourcesPendingCount: 0 },
    { id: 2, status: 'active', pendingSubmissionCount: 1, resourcesPendingCount: 0 },
    { id: 3, status: 'active', pendingSubmissionCount: 0, resourcesPendingCount: 0 }
  ]);

  assert.deepEqual(alerts.map((item) => item.id), [1, 2]);
});

test('buildProjectQueues and filterReviewProjects derive queue counts', () => {
  const reviewProjects = [
    { id: 1, reviewBucket: 'project_review' },
    { id: 2, reviewBucket: 'project_review' },
    { id: 3, reviewBucket: 'stage_review' }
  ];

  const queues = buildProjectQueues(reviewProjects);
  assert.equal(queues.find((item) => item.key === 'project_review').count, 2);
  assert.equal(filterReviewProjects(reviewProjects, 'stage_review').length, 1);
});

test('buildStatusActions reflects teacher workflow transitions', () => {
  const submitted = buildStatusActions('submitted');
  assert.equal(submitted[0].status, 'reviewing');

  const finalReview = buildStatusActions('final_review');
  assert.equal(finalReview.some((item) => item.status === 'archived'), true);
});
