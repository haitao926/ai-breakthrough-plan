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
import WbsTool from '@/pages/tools/Wbs.vue';
import KanbanTool from '@/pages/tools/Kanban.vue';
import DevLogTool from '@/pages/tools/DevLog.vue';
import ArchitectGuideTool from '@/pages/tools/ArchitectGuide.vue';
import ArchitectTool from '@/pages/tools/Architect.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/workspace', component: WorkspacePage },
  { path: '/projects', component: ProjectsPage },
  { path: '/tools', component: ToolsPage },
  { path: '/tools/charter', component: CharterTool },
  { path: '/tools/pre_research', component: PreResearchTool },
  { path: '/tools/literature', component: LiteratureTool },
  { path: '/tools/innovation', component: InnovationTool },
  { path: '/tools/wbs', component: WbsTool },
  { path: '/tools/kanban', component: KanbanTool },
  { path: '/tools/devlog', component: DevLogTool },
  { path: '/tools/architect-guide', component: ArchitectGuideTool },
  { path: '/tools/architect', component: ArchitectTool },
  { path: '/teacher', component: TeacherPage },
  { path: '/mission-control', component: MissionControlPage },
  { path: '/showcase', component: ShowcasePage },
  { path: '/knowledge', component: KnowledgePage },
  { path: '/competencies', component: CompetenciesPage },
  { path: '/downloads', component: DownloadsPage },
  { path: '/study', component: StudyPage },
  { path: '/smart-workspace', component: SmartWorkspacePage },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
