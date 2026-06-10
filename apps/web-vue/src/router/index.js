import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/pages/Home.vue';
import pinia from '@/stores';
import { useAuthStore } from '@/stores/auth';

const WorkspacePage = () => import('@/pages/Workspace.vue');
const ProjectsPage = () => import('@/pages/Projects.vue');
const CompetitionsPage = () => import('@/pages/Competitions.vue');
const CompetitionDetailPage = () => import('@/pages/CompetitionDetail.vue');
const ToolsPage = () => import('@/pages/Tools.vue');
const TeacherPage = () => import('@/pages/Teacher.vue');
const LoginPage = () => import('@/pages/Login.vue');
const RegisterPage = () => import('@/pages/Register.vue');
const KnowledgePage = () => import('@/pages/Knowledge.vue');
const KnowledgeDetailPage = () => import('@/pages/KnowledgeDetail.vue');
const DownloadsPage = () => import('@/pages/Downloads.vue');
const CoursePage = () => import('@/pages/Course.vue');
const StudyPage = () => import('@/pages/Study.vue');
const MissionControlPage = () => import('@/pages/MissionControl.vue');
const AccountPage = () => import('@/pages/Account.vue');
const CharterTool = () => import('@/pages/tools/Charter.vue');
const PreResearchTool = () => import('@/pages/tools/PreResearch.vue');
const LiteratureTool = () => import('@/pages/tools/Literature.vue');
const InnovationTool = () => import('@/pages/tools/Innovation.vue');
const KanbanTool = () => import('@/pages/tools/Kanban.vue');
const DevLogTool = () => import('@/pages/tools/DevLog.vue');
const ArchitectGuideTool = () => import('@/pages/tools/ArchitectGuide.vue');
const ArchitectTool = () => import('@/pages/tools/Architect.vue');
const AssessmentPage = () => import('@/pages/Assessment.vue');

const routes = [
  { path: '/', component: HomePage, meta: { public: true } },
  { path: '/competitions', component: CompetitionsPage, meta: { public: true } },
  { path: '/competitions/:slug', component: CompetitionDetailPage, meta: { public: true } },
  { path: '/workspace', component: WorkspacePage, meta: { requiresAuth: true } },
  { path: '/projects', component: ProjectsPage, meta: { public: true } },
  { path: '/tools', component: ToolsPage, meta: { requiresAuth: true } },
  { path: '/tools/charter', component: CharterTool, meta: { requiresAuth: true } },
  { path: '/tools/pre_research', component: PreResearchTool, meta: { requiresAuth: true } },
  { path: '/tools/literature', component: LiteratureTool, meta: { requiresAuth: true } },
  { path: '/tools/innovation', component: InnovationTool, meta: { requiresAuth: true } },
  { path: '/tools/wbs', redirect: to => ({ path: '/tools/kanban', query: to.query }) },

  { path: '/tools/kanban', component: KanbanTool, meta: { requiresAuth: true } },
  { path: '/tools/devlog', component: DevLogTool, meta: { requiresAuth: true } },
  { path: '/tools/architect-guide', component: ArchitectGuideTool, meta: { requiresAuth: true } },
  { path: '/tools/architect', component: ArchitectTool, meta: { requiresAuth: true } },
  { path: '/teacher', component: TeacherPage, meta: { requiresAuth: true, roles: ['teacher', 'judge'] } },
  { path: '/teacher/assessment', component: AssessmentPage, meta: { requiresAuth: true, roles: ['teacher', 'judge'] } },
  { path: '/mission-control', component: MissionControlPage, meta: { requiresAuth: true, roles: ['teacher', 'judge'] } },
  { path: '/showcase', redirect: '/projects', meta: { public: true } },
  { path: '/knowledge', component: KnowledgePage, meta: { public: true } },
  { path: '/knowledge/:disciplineId', component: KnowledgeDetailPage, meta: { public: true } },
  { path: '/competencies', redirect: '/courses/common', meta: { public: true } },
  { path: '/courses', component: DownloadsPage, meta: { public: true } },
  { path: '/downloads', redirect: '/courses', meta: { public: true } },
  { path: '/courses/:courseId', component: CoursePage, meta: { public: true } },
  { path: '/courses/:courseId/lessons/:lessonId', component: StudyPage, meta: { public: true } },
  { path: '/study', component: StudyPage, meta: { public: true } },
  { path: '/account', component: AccountPage, meta: { requiresAuth: true } },
  { path: '/smart-workspace', redirect: to => ({ path: '/workspace', query: to.query }), meta: { requiresAuth: true } },
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
  if (to.meta?.roles && !to.meta.roles.includes(user.role)) {
    next(user.role === 'teacher' || user.role === 'judge' ? '/teacher' : '/workspace');
    return;
  }
  next();
});

export default router;
