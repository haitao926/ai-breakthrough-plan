export function isTeacherLike(role) {
  return ['teacher', 'judge'].includes(String(role || '').trim());
}

export function getRoleLabel(role) {
  if (role === 'teacher') return '教师账号';
  if (role === 'judge') return '评委账号';
  return '学生账号';
}

export function getPrimaryWorkspaceTarget(user) {
  return isTeacherLike(user?.role) ? '/teacher' : '/workspace';
}

export function getPrimaryWorkspaceLabel(user) {
  return isTeacherLike(user?.role) ? '进入教师后台' : '进入学生工作台';
}
