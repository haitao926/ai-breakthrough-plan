import test from 'node:test';
import assert from 'node:assert/strict';

import { canAccessRedirectTarget, resolveAuthRedirectForUser } from './userRole.js';

test('admin redirect resolution ignores stale student workspace redirects', () => {
  const adminUser = { role: 'admin' };

  assert.equal(canAccessRedirectTarget(adminUser, '/admin'), true);
  assert.equal(canAccessRedirectTarget(adminUser, '/teacher/review'), true);
  assert.equal(canAccessRedirectTarget(adminUser, '/my/project/123'), false);
  assert.equal(resolveAuthRedirectForUser(adminUser, '/my/project/123'), '/admin');
});

test('teacher and student redirect resolution stays inside their own workspace families', () => {
  const teacherUser = { role: 'teacher' };
  const studentUser = { role: 'student' };

  assert.equal(resolveAuthRedirectForUser(teacherUser, '/teacher/students'), '/teacher/students');
  assert.equal(resolveAuthRedirectForUser(teacherUser, '/admin'), '/teacher');
  assert.equal(resolveAuthRedirectForUser(studentUser, '/my/project/123'), '/my/project/123');
  assert.equal(resolveAuthRedirectForUser(studentUser, '/teacher/review'), '/my');
});
