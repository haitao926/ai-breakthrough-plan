import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/pages/Home.vue';
import WorkspacePage from '@/pages/Workspace.vue';
import ProjectsPage from '@/pages/Projects.vue';
import ToolsPage from '@/pages/Tools.vue';
import TeacherPage from '@/pages/Teacher.vue';
import ShowcasePage from '@/pages/Showcase.vue';
import LoginPage from '@/pages/Login.vue';
import RegisterPage from '@/pages/Register.vue';
import KnowledgePage from '@/pages/Knowledge.vue';
import CompetenciesPage from '@/pages/Competencies.vue';
import DownloadsPage from '@/pages/Downloads.vue';
import StudyPage from '@/pages/Study.vue';
import MissionControlPage from '@/pages/MissionControl.vue';
import SmartWorkspacePage from '@/pages/SmartWorkspace.vue';
import CharterTool from '@/pages/tools/Charter.vue';
import PreResearchTool from '@/pages/tools/PreResearch.vue';
import LiteratureTool from '@/pages/tools/Literature.vue';
import InnovationTool from '@/pages/tools/Innovation.vue';

import KanbanTool from '@/pages/tools/Kanban.vue';
import DevLogTool from '@/pages/tools/DevLog.vue';
import ArchitectGuideTool from '@/pages/tools/ArchitectGuide.vue';
import ArchitectTool from '@/pages/tools/Architect.vue';
import pinia from '@/stores';
import { useAuthStore } from '@/stores/auth';

const routes = [
  { path: '/', component: HomePage, meta: { public: true } },
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
  { path: '/mission-control', component: MissionControlPage, meta: { requiresAuth: true, roles: ['teacher', 'judge'] } },
  { path: '/showcase', component: ShowcasePage, meta: { public: true } },
  { path: '/knowledge', component: KnowledgePage, meta: { public: true } },
  { path: '/competencies', component: CompetenciesPage, meta: { public: true } },
  { path: '/downloads', component: DownloadsPage, meta: { public: true } },
  { path: '/study', component: StudyPage, meta: { public: true } },
  { path: '/smart-workspace', component: SmartWorkspacePage, meta: { requiresAuth: true } },
  { path: '/login', component: LoginPage, meta: { public: true } },
  { path: '/register', component: RegisterPage, meta: { public: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(pinia);
  authStore.hydrate();
  const requiresAuth = to.meta?.requiresAuth;
  if (!requiresAuth) {
    next();
    return;
  }
  const user = authStore.user;
  if (!user) {
    authStore.setRedirect(to.fullPath);
    next('/login');
    return;
  }
  if (to.meta?.roles && !to.meta.roles.includes(user.role)) {
    next(user.role === 'teacher' || user.role === 'judge' ? '/teacher' : '/workspace');
    return;
  }
  next();
});

export default router;
