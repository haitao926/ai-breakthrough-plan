import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/pages/Home.vue';
import pinia from '@/stores';
import { useAuthStore } from '@/stores/auth';
import { buildWorkspacePanelRoute, getWorkspacePanelBySegment } from '@/utils/workspaceRoute';

const WorkspacePage = () => import('@/pages/Workspace.vue');
const ProjectsPage = () => import('@/pages/Projects.vue');
const CompetitionsPage = () => import('@/pages/Competitions.vue');
const CompetitionDetailPage = () => import('@/pages/CompetitionDetail.vue');
const ToolsPage = () => import('@/pages/Tools.vue');
const ShowcasePage = () => import('@/pages/Showcase.vue');
const LoginPage = () => import('@/pages/Login.vue');
const RegisterPage = () => import('@/pages/Register.vue');
const KnowledgePage = () => import('@/pages/Knowledge.vue');
const KnowledgeDetailPage = () => import('@/pages/KnowledgeDetail.vue');
const KnowledgeLeaderboardPage = () => import('@/pages/KnowledgeLeaderboard.vue');
const CoursesIndexPage = () => import('@/pages/CoursesIndex.vue');
const CoursePage = () => import('@/pages/Course.vue');
const StudyPage = () => import('@/pages/Study.vue');
const MissionControlPage = () => import('@/pages/MissionControl.vue');
const AccountPage = () => import('@/pages/Account.vue');
const AdminHomePage = () => import('@/pages/AdminHome.vue');
const AdminTeachersPage = () => import('@/pages/AdminTeachers.vue');
const AdminReviewPage = () => import('@/pages/AdminReview.vue');
const AdminPublishPage = () => import('@/pages/AdminPublish.vue');
const AdminStudentsPage = () => import('@/pages/AdminStudents.vue');
const TeacherStudentsPage = () => import('@/pages/TeacherStudents.vue');
const CharterTool = () => import('@/pages/tools/Charter.vue');
const PreResearchTool = () => import('@/pages/tools/PreResearch.vue');
const LiteratureTool = () => import('@/pages/tools/Literature.vue');
const InnovationTool = () => import('@/pages/tools/Innovation.vue');
const KanbanTool = () => import('@/pages/tools/Kanban.vue');
const DevLogTool = () => import('@/pages/tools/DevLog.vue');
const ArchitectGuideTool = () => import('@/pages/tools/ArchitectGuide.vue');
const ArchitectTool = () => import('@/pages/tools/Architect.vue');
const AssessmentPage = () => import('@/pages/Assessment.vue');

function normalizeLessonRouteQuery(to) {
  const mode = String(to.query.mode || '').trim();
  const entry = String(to.query.entry || '').trim();
  if (mode === 'guide' && entry === 'guide') return null;
  if (mode === 'mission') return null;
  if (mode && mode !== 'guide' && mode !== 'mission') return null;
  return {
    path: to.path,
    query: {
      ...to.query,
      mode: mode || 'mission',
      entry: entry || 'lesson'
    }
  };
}

const routes = [
  { path: '/', component: HomePage, meta: { public: true, portalShell: true } },
  { path: '/competitions', component: CompetitionsPage, meta: { public: true, portalShell: true, navActive: 'competitions' } },
  { path: '/competitions/:slug', component: CompetitionDetailPage, meta: { public: true, portalShell: true, navActive: 'competitions' } },
  { path: '/my', component: WorkspacePage, meta: { requiresAuth: true } },
  { path: '/my/project/:projectId', component: WorkspacePage, meta: { requiresAuth: true } },
  {
    path: '/my/project/:projectId/:viewId(kanban|devlog|architect|project|charter|pre-research|literature|innovation)',
    component: WorkspacePage,
    props: route => {
      const resolved = getWorkspacePanelBySegment(route.params.viewId);
      return resolved ? { initialPanel: resolved.panel } : {};
    },
    meta: { requiresAuth: true }
  },
  {
    path: '/my/project/:projectId/submit/:viewId(proposal|milestone-1|midterm|milestone-2|final)',
    component: WorkspacePage,
    props: route => {
      const resolved = getWorkspacePanelBySegment(route.params.viewId);
      return resolved ? { initialPanel: resolved.panel } : {};
    },
    meta: { requiresAuth: true }
  },
  { path: '/my/project/:projectId/panel/:panelId', component: WorkspacePage, meta: { requiresAuth: true } },
  { path: '/my/project/:projectId/stage/:stageId', component: WorkspacePage, meta: { requiresAuth: true } },
  { path: '/workspace', redirect: to => ({ path: '/my', query: to.query }) },
  { path: '/projects', component: ProjectsPage, meta: { public: true, portalShell: true, navActive: 'projects' } },
  { path: '/tools', redirect: to => buildWorkspacePanelRoute(to.query.project, 'inception', to.query), meta: { requiresAuth: true } },
  { path: '/tools/charter', redirect: to => buildWorkspacePanelRoute(to.query.project, 'charter', to.query), meta: { requiresAuth: true } },
  { path: '/tools/pre_research', redirect: to => buildWorkspacePanelRoute(to.query.project, 'pre_research', to.query), meta: { requiresAuth: true } },
  { path: '/tools/literature', redirect: to => buildWorkspacePanelRoute(to.query.project, 'literature', to.query), meta: { requiresAuth: true } },
  { path: '/tools/innovation', redirect: to => buildWorkspacePanelRoute(to.query.project, 'innovation', to.query), meta: { requiresAuth: true } },
  { path: '/tools/wbs', redirect: to => ({ path: '/tools/kanban', query: to.query }) },

  { path: '/tools/kanban', redirect: to => buildWorkspacePanelRoute(to.query.project, 'kanban', to.query), meta: { requiresAuth: true } },
  { path: '/tools/devlog', redirect: to => buildWorkspacePanelRoute(to.query.project, 'devlog', to.query), meta: { requiresAuth: true } },
  { path: '/tools/architect-guide', redirect: to => buildWorkspacePanelRoute(to.query.project, 'architect', to.query), meta: { requiresAuth: true } },
  { path: '/tools/architect', redirect: to => buildWorkspacePanelRoute(to.query.project, 'architect', to.query), meta: { requiresAuth: true } },
  { path: '/admin', component: AdminHomePage, meta: { requiresAuth: true, roles: ['admin'], layout: 'AdminLayout' } },
  { path: '/admin/teachers', component: AdminTeachersPage, meta: { requiresAuth: true, roles: ['admin'], layout: 'AdminLayout' } },
  { path: '/admin/students', component: AdminStudentsPage, meta: { requiresAuth: true, roles: ['admin'], layout: 'AdminLayout' } },
  { path: '/admin/review', redirect: to => ({ path: '/teacher/review', query: to.query }) },
  { path: '/admin/publish', redirect: to => ({ path: '/teacher/publish', query: to.query }) },
  { path: '/admin/assessment', redirect: to => ({ path: '/teacher/assessment', query: to.query }) },
  { path: '/admin/monitor', redirect: to => ({ path: '/teacher/monitor', query: to.query }) },
  { path: '/teacher', redirect: to => ({ path: '/teacher/review', query: to.query }) },
  { path: '/teacher/review', component: AdminReviewPage, meta: { requiresAuth: true, roles: ['teacher', 'judge'], layout: 'TeacherLayout' } },
  { path: '/teacher/publish', component: AdminPublishPage, meta: { requiresAuth: true, roles: ['teacher', 'judge'], layout: 'TeacherLayout' } },
  { path: '/teacher/students', component: TeacherStudentsPage, meta: { requiresAuth: true, roles: ['teacher'], layout: 'TeacherLayout' } },
  { path: '/teacher/assessment', component: AssessmentPage, meta: { requiresAuth: true, roles: ['teacher', 'judge'] } },
  { path: '/teacher/monitor', component: MissionControlPage, meta: { requiresAuth: true, roles: ['teacher', 'judge'] } },
  { path: '/mission-control', redirect: '/teacher/monitor' },
  { path: '/showcase', component: ShowcasePage, meta: { public: true, portalShell: true, navActive: 'projects' } },
  { path: '/knowledge', component: KnowledgePage, meta: { public: true, portalShell: true, navActive: 'knowledge' } },
  { path: '/knowledge/leaderboard', component: KnowledgeLeaderboardPage, meta: { public: true, portalShell: true, navActive: 'knowledge' } },
  { path: '/knowledge/common', redirect: to => ({ path: '/knowledge', query: to.query }), meta: { public: true, portalShell: true, navActive: 'knowledge' } },
  { path: '/knowledge/:disciplineId', component: KnowledgeDetailPage, meta: { public: true, portalShell: true, navActive: 'knowledge' } },
  { path: '/competencies', redirect: '/courses/common', meta: { public: true, portalShell: true, navActive: 'courses' } },
  { path: '/courses', component: CoursesIndexPage, meta: { public: true, portalShell: true, navActive: 'courses' } },
  { path: '/downloads', redirect: '/courses', meta: { public: true } },
  { path: '/courses/:courseId', component: CoursePage, meta: { public: true, portalShell: true, navActive: 'courses' } },
  { path: '/courses/:courseId/lessons/:lessonId', component: StudyPage, meta: { public: true } },
  { path: '/study', component: StudyPage, meta: { public: true } },
  { path: '/account', component: AccountPage, meta: { requiresAuth: true, portalShell: true } },
  { path: '/smart-workspace', redirect: to => ({ path: '/my', query: to.query }), meta: { requiresAuth: true } },
  { path: '/login', component: LoginPage, meta: { public: true } },
  { path: '/register', component: RegisterPage, meta: { public: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.path !== from.path) return { top: 0 };
    return false;
  }
});

router.beforeEach((to, from, next) => {
  const normalizedLessonRoute = normalizeLessonRouteQuery(to);
  if (normalizedLessonRoute && to.path.startsWith('/courses/') && to.params?.courseId && to.params?.lessonId) {
    next(normalizedLessonRoute);
    return;
  }

  const authStore = useAuthStore(pinia);
  authStore.hydrate();
  const requiresAuth = to.meta?.requiresAuth;
  if (!requiresAuth) {
    next();
    return;
  }
  if (!authStore.isAuthenticated || !authStore.user) {
    authStore.setRedirect(to.fullPath);
    next('/login');
    return;
  }
  const user = authStore.user;
  const isAdmin = user.role === 'admin';
  if (to.meta?.roles && !isAdmin && !to.meta.roles.includes(user.role)) {
    next(user.role === 'teacher' || user.role === 'judge' ? '/teacher' : isAdmin ? '/admin' : '/my');
    return;
  }
  next();
});

export default router;
