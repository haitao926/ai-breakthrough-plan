export function normalizeRole(role) {
  return String(role || '').trim();
}

export function isAdminRole(role) {
  return normalizeRole(role) === 'admin';
}

export function isTeacherRole(role) {
  return ['teacher', 'judge'].includes(normalizeRole(role));
}

export function isTeacherLike(role) {
  return isTeacherRole(role);
}

export function getRoleLabel(role) {
  if (role === 'admin') return '管理员账号';
  if (role === 'teacher') return '教师账号';
  if (role === 'judge') return '评委账号';
  return '学生账号';
}

export function getPrimaryWorkspaceTarget(user) {
  if (isAdminRole(user?.role)) return '/admin';
  return isTeacherRole(user?.role) ? '/teacher' : '/my';
}

export function canAccessRedirectTarget(user, path) {
  const target = String(path || '').trim();
  if (!target) return false;
  if (target.startsWith('/account')) return true;

  if (isAdminRole(user?.role)) {
    return target.startsWith('/admin') || target.startsWith('/teacher');
  }

  if (isTeacherRole(user?.role)) {
    return target.startsWith('/teacher') || target.startsWith('/my');
  }

  return target.startsWith('/my');
}

export function resolveAuthRedirectForUser(user, path) {
  return canAccessRedirectTarget(user, path) ? path : getPrimaryWorkspaceTarget(user);
}

export function getPrimaryWorkspaceLabel(user) {
  if (isAdminRole(user?.role)) return '进入管理后台';
  return isTeacherRole(user?.role) ? '进入教师工作台' : '进入我的空间';
}

export function getPrimaryWorkspaceIcon(user) {
  if (isAdminRole(user?.role)) return 'fa-shield-halved';
  return isTeacherRole(user?.role) ? 'fa-chalkboard-teacher' : 'fa-rocket';
}

export function getSecondaryWorkspaceTarget(user) {
  if (isAdminRole(user?.role)) return '/teacher';
  return isTeacherRole(user?.role) ? '/my' : '';
}

export function getSecondaryWorkspaceLabel(user) {
  if (isAdminRole(user?.role)) return '进入教师工作台';
  return isTeacherRole(user?.role) ? '进入学生空间' : '';
}
