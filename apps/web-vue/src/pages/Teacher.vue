<template>
  <div class="teacher-page selection:bg-indigo-100 selection:text-indigo-900 bg-[#f8fafc] min-h-screen flex flex-col">
    <!-- 背景层 -->
    <div class="fixed inset-0 pointer-events-none opacity-[0.4] interactive-grid"></div>

    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-8 py-4 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
          <i class="fas fa-cube text-lg"></i>
        </div>
        <div>
          <div class="text-xs font-black text-slate-900 tracking-tight leading-none uppercase">HAI Tech Lab</div>
          <div class="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-1">管理中枢 · Control Center</div>
        </div>
      </div>

      <div class="hidden lg:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
        <RouterLink to="/" class="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-all">门户首页</RouterLink>
        <RouterLink to="/projects" class="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-all">项目广场</RouterLink>
        <RouterLink to="/downloads" class="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-all">资料库</RouterLink>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-3 px-3 py-1.5 bg-white rounded-xl border border-slate-200">
          <img class="w-6 h-6 rounded-lg" :src="avatarUrl" alt="avatar" />
          <span class="text-xs font-black text-slate-900">{{ currentUser?.name || '管理教师' }}</span>
        </div>
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all" @click="logout">
          <i class="fas fa-sign-out-alt text-xs"></i>
        </button>
      </div>
    </nav>

    <header class="pt-12 pb-10 relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b-2 border-slate-100 pb-12">
          <div class="max-w-xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-6">
              <i class="fas fa-shield-halved"></i> Faculty Dashboard
            </div>
            <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight">科创教学指挥平台</h1>
            <p class="text-base text-slate-500 font-medium mt-3 leading-relaxed">实时洞察学生研究动态，高效处理审批请求，驱动学术创新飞轮。</p>
          </div>
          <div class="flex gap-4">
            <button class="btn-secondary !px-6 !py-3 !rounded-[18px] !text-xs flex items-center gap-2 shadow-none" @click="refreshAll">
              <i class="fas fa-sync-alt" :class="{ 'animate-spin': loading }"></i> 刷新数据
            </button>
            <RouterLink to="/mission-control" class="btn-primary !px-6 !py-3 !rounded-[18px] !text-xs flex items-center gap-2 border-none">
              <i class="fas fa-tower-observation"></i> 战略指挥塔
            </RouterLink>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-4 mt-10">
          <div v-for="stat in statCards" :key="stat.label" class="premium-card !p-6 hover:-translate-y-1 transition-all !bg-white">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-inner" :class="stat.iconBg">
                <i :class="stat.icon"></i>
              </div>
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ stat.label }}</div>
            </div>
            <div class="flex items-end justify-between">
              <div class="text-3xl font-black text-slate-900 leading-none">{{ stat.value }}</div>
              <div v-if="stat.trend !== undefined" class="text-[10px] font-bold px-2 py-0.5 rounded-lg" :class="stat.trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'">
                {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8 relative z-10 flex-1">
      <div class="grid lg:grid-cols-[360px_1fr] gap-8">
        <aside class="space-y-6">
          <div class="premium-card !p-6 !min-h-[600px] flex flex-col !bg-white">
            <div class="flex items-center justify-between mb-8">
              <div class="flex items-center gap-3">
                <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                <h2 class="text-sm font-black text-slate-900 uppercase tracking-widest">学生项目库</h2>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ filteredProjects.length }} Projects</span>
              </div>
            </div>

            <div class="space-y-4 mb-6">
              <div class="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <i class="fas fa-search text-slate-300 text-xs"></i>
                <input v-model="keyword" class="bg-transparent border-none outline-none text-xs font-bold text-slate-900 placeholder-slate-300 w-full" placeholder="搜索项目或成员..." />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <select v-model="statusFilter" class="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-600 outline-none hover:border-indigo-300 transition-colors">
                  <option value="">所有状态</option>
                  <option v-for="status in statusOptions" :key="status.value" :value="status.value">{{ status.label }}</option>
                </select>
                <select v-model="classFilter" class="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-600 outline-none hover:border-indigo-300 transition-colors">
                  <option value="">所有班级</option>
                  <option v-for="item in classOptions" :key="item" :value="item">{{ item }}</option>
                </select>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              <button
                v-for="project in filteredProjects"
                :key="project.id"
                class="w-full text-left p-4 rounded-2xl border transition-all duration-300 group"
                :class="project.id === selectedProject?.id 
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-600/5' 
                  : 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'"
                @click="selectProject(project)"
              >
                <div class="font-black text-xs transition-colors mb-2 truncate" :class="project.id === selectedProject?.id ? 'text-indigo-900' : 'text-slate-800 group-hover:text-indigo-600'">
                  {{ project.title }}
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <i class="fas fa-users-viewfinder"></i>
                    {{ project.class_name || '未分组' }}
                  </div>
                  <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm" :class="getBadgeClass(project.status)">
                    {{ projectStatusLabel(project.status) }}
                  </span>
                </div>
              </button>

            <div v-if="!filteredProjects.length" class="py-12 text-center">
                <i class="fas fa-inbox text-slate-200 text-3xl mb-3"></i>
                <div class="text-[10px] font-black text-slate-300 uppercase tracking-widest">未找到匹配项目</div>
              </div>
            </div>

            <button 
              class="mt-6 w-full py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200 flex items-center justify-center gap-3"
              @click="tab = 'resources'"
            >
              <i class="fas fa-truck-ramp-box"></i>
              物资审批队列
              <span v-if="pendingCount" class="w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-[9px] rounded-full animate-pulse">{{ pendingCount }}</span>
            </button>
          </div>
        </aside>

        <section class="space-y-6">
          <div v-if="tab === 'resources'" class="premium-card !p-8 animate-reveal !bg-white">
            <div class="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
              <div>
                <h3 class="text-base font-black text-slate-900 uppercase tracking-widest">物资审批中心</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resource & Hardware Requests</p>
              </div>
              <button class="btn-secondary !px-4 !py-2 !rounded-xl !text-[10px]" @click="loadResources">
                <i class="fas fa-sync-alt mr-2"></i>刷新申请
              </button>
            </div>

            <div v-if="!resources.length" class="py-20 text-center">
              <div class="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center mx-auto mb-4 text-slate-200">
                 <i class="fas fa-check-double text-2xl"></i>
              </div>
              <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">当前无待处理申请</div>
            </div>

            <div class="grid gap-4">
              <div v-for="item in resources" :key="item.id" class="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                <div class="flex items-center gap-5">
                   <div class="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <i class="fas fa-microchip"></i>
                   </div>
                   <div>
                      <div class="text-xs font-black text-slate-900 mb-1">{{ item.project_title }}</div>
                      <div class="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         <span class="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{{ item.item_name }} × {{ item.quantity }}</span>
                         <span>申请人：{{ item.requester_name || '-' }}</span>
                      </div>
                   </div>
                </div>
                <div class="flex gap-2">
                  <button class="w-10 h-10 rounded-xl bg-white border border-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm" @click="auditResource(item.id, 'approved')">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="w-10 h-10 rounded-xl bg-white border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm" @click="auditResource(item.id, 'rejected')">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <template v-else>
            <div v-if="!selectedProject" class="premium-card !p-20 !bg-white text-center animate-reveal">
              <div class="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-slate-200">
                <i class="fas fa-fingerprint text-4xl text-slate-200"></i>
              </div>
              <h3 class="text-lg font-black text-slate-900 tracking-tight uppercase">就绪状态：等待选择</h3>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-3">请从左侧列表选择一个正在进行中的项目以开启全景观测</p>
            </div>

            <div v-else class="space-y-8 animate-reveal">
              <!-- 项目基础详情 -->
              <section class="premium-card !p-8 !bg-white relative overflow-hidden">
                <div class="absolute top-0 right-0 p-8 opacity-5">
                   <i class="fas fa-rocket text-8xl"></i>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-6 relative z-10">
                  <div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tight mb-2">{{ selectedProject.title }}</h3>
                    <div class="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       <span class="flex items-center gap-2"><i class="fas fa-users-viewfinder text-indigo-500"></i> {{ selectedProject.class_name || '-' }}</span>
                       <span class="flex items-center gap-2"><i class="fas fa-user-tie text-indigo-500"></i> 负责人：{{ selectedProject.team_members || '未知' }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <RouterLink :to="`/workspace?project=${selectedProject.id}`" class="btn-primary !px-5 !py-3 !rounded-xl !text-[10px] !bg-slate-900 border-none">
                      进入独立工作台 <i class="fas fa-external-link-alt ml-2"></i>
                    </RouterLink>
                  </div>
                </div>
                
                <div class="grid gap-4 md:grid-cols-3 mt-10">
                   <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">代码演进轨迹</div>
                      <div class="text-xs font-mono text-indigo-600 truncate mt-2">{{ selectedProject.gitea_repo_url || '未绑定库' }}</div>
                   </div>
                   <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">交付物通联</div>
                      <div class="text-xl font-black text-slate-900 mt-1">{{ submissions.length }}</div>
                   </div>
                   <div class="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                      <div class="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">当前学术阶段</div>
                      <div class="font-black text-sm uppercase tracking-widest mt-2">{{ projectStatusLabel(selectedProject.status) }}</div>
                   </div>
                </div>
              </section>

              <!-- 任务规划 -->
              <section class="premium-card !p-8 !bg-white">
                <div class="flex items-center justify-between mb-8">
                  <div class="flex items-center gap-3">
                    <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                    <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">任务规划全景 WBS</h4>
                  </div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">共 {{ milestoneCount }} 个学术里程碑</span>
                </div>
                <div class="grid gap-6 md:grid-cols-3">
                  <div v-for="phase in ['m1','m2','m3']" :key="phase" class="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                    <div class="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
                       {{ phaseLabel(phase) }}
                       <i class="fas fa-layer-group text-slate-200"></i>
                    </div>
                    <div v-if="!wbs[phase].length" class="py-10 text-center text-[10px] font-bold text-slate-300 uppercase italic">暂无规划任务</div>
                    <div v-for="task in wbs[phase]" :key="task.id" class="bg-white rounded-xl p-3 border border-slate-100 mb-3 shadow-sm hover:border-indigo-200 transition-all">
                      <div class="text-[11px] font-black text-slate-800 mb-2">{{ task.title }}</div>
                      <div class="flex items-center justify-between text-[9px] font-bold">
                        <span class="text-slate-400 flex items-center gap-1"><i class="fas fa-user text-[8px]"></i>{{ task.assignee || '未分配' }}</span>
                        <span class="px-2 py-0.5 rounded-lg border uppercase tracking-tighter" :class="getMilestoneClass(task.status)">{{ milestoneLabel(task.status) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 最新日志与提交 -->
              <div class="grid lg:grid-cols-2 gap-8">
                <section class="premium-card !p-8 !bg-white">
                  <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-3">
                      <div class="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                      <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">实时研发日志</h4>
                    </div>
                  </div>
                  <div v-if="!logs.length" class="py-12 text-center text-xs font-bold text-slate-300 italic">暂无更新日志</div>
                  <div v-else class="space-y-6">
                    <div v-for="log in logs.slice(0, 5)" :key="log.id" class="relative pl-6 border-l-2 border-slate-50 last:border-transparent pb-2">
                       <div class="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-emerald-500"></div>
                       <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">{{ formatDate(log.created_at) }} · {{ log.author_name || '学生' }}</div>
                       <div class="text-xs text-slate-600 font-medium leading-relaxed italic">"{{ log.content }}"</div>
                    </div>
                  </div>
                </section>

                <section class="premium-card !p-8 !bg-white">
                    <div class="flex items-center gap-3 mb-8">
                      <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                      <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">关键交付物与评审</h4>
                    </div>
                    <div v-if="!submissions.length" class="py-12 text-center text-xs font-bold text-slate-300 italic">暂无提交记录</div>
                    <div v-else class="space-y-4">
                      <div v-for="sub in submissions" :key="sub.id" class="p-4 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5">
                        <div class="flex items-center justify-between mb-3">
                           <div class="text-xs font-black text-indigo-900 uppercase tracking-tighter">{{ submissionTypeLabel(sub.type) }}</div>
                           <span class="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border shadow-sm" :class="getSubmissionBadgeClass(sub.status)">
                              {{ submissionStatusLabel(sub.status) }}
                           </span>
                        </div>
                        <div class="text-[9px] text-slate-400 mb-4">{{ formatDate(sub.created_at) }}</div>
                        
                        <div v-if="detailEntries(sub).length" class="space-y-2 mb-4">
                          <div v-for="item in visibleDetails(sub)" :key="item.label" class="flex flex-wrap gap-2 text-[9px] font-bold">
                            <span class="text-slate-400 uppercase tracking-widest">{{ item.label }}：</span>
                            <span class="text-slate-600 line-clamp-1">{{ item.value }}</span>
                          </div>
                        </div>

                        <div class="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                           <div class="flex gap-2">
                              <button class="w-8 h-8 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-110 transition-all flex items-center justify-center" @click="openReview(sub, 'reviewed')">
                                <i class="fas fa-check text-[10px]"></i>
                              </button>
                              <button class="w-8 h-8 rounded-lg bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:scale-110 transition-all flex items-center justify-center" @click="openReview(sub, 'needs_changes')">
                                <i class="fas fa-reply text-[10px]"></i>
                              </button>
                           </div>
                           <button class="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest" @click="toggleExpand(sub.id)">
                              {{ expandMap[sub.id] ? '收起详情' : '展开阅读' }}
                           </button>
                        </div>
                      </div>
                    </div>
                </section>
              </div>
            </div>
          </template>
        </section>
      </div>
    </main>

    <!-- 评审模态框 -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="reviewModal.open" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" @click="closeReview"></div>
        <div class="relative bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl animate-reveal">
          <div class="flex items-center gap-4 mb-6">
             <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg" :class="reviewModal.status === 'reviewed' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'">
                <i :class="reviewModal.status === 'reviewed' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'"></i>
             </div>
             <div>
                <h3 class="text-xl font-black text-slate-900 tracking-tight">学术评审：{{ submissionTypeLabel(reviewModal.submission?.type) }}</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{ reviewModal.status === 'reviewed' ? '批准通过研究节点' : '发出修正建议' }}</p>
             </div>
          </div>
          <div class="space-y-4">
             <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">导师反馈内容 (Feedback)</label>
             <textarea v-model="reviewModal.feedback" class="w-full h-40 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300 resize-none" placeholder="请为学生提供具体的学术改进建议..."></textarea>
          </div>
          <div class="flex justify-end gap-3 mt-8">
            <button class="px-6 py-3 rounded-xl text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all" @click="closeReview">取消操作</button>
            <button class="btn-primary !px-8 !py-3 !rounded-xl !text-xs flex items-center gap-2 border-none shadow-xl" :disabled="reviewing" @click="confirmReview">
              {{ reviewing ? '正在录入学术系统...' : '确认并同步结果' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { apiFetch } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { useProjectStore } from '@/stores/project';
import { formatDate } from '@/utils/format';

const router = useRouter();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const notification = useNotificationStore();

authStore.hydrate();

const { user: currentUser } = storeToRefs(authStore);
const { list: projects } = storeToRefs(projectStore);

const tab = ref('projects');
const keyword = ref('');
const statusFilter = ref('');
const classFilter = ref('');
const loading = ref(false);

const selectedProject = ref(null);
const submissions = ref([]);
const logs = ref([]);
const wbs = ref({ m1: [], m2: [], m3: [] });
const resources = ref([]);
const pendingCount = ref(0);
const expandMap = ref({});

const reviewModal = ref({ open: false, submission: null, status: 'reviewed', feedback: '' });
const reviewing = ref(false);

const STATUS_LABELS = {
  draft: '草案阶段',
  submitted: '等待初审',
  reviewing: '审核中',
  approved: '已入围',
  rejected: '需重构',
  in_progress: '正在攻坚',
  midterm_review: '中期质询',
  final_review: '结题评审',
  archived: '已入档'
};

const statusOptions = computed(() => Object.keys(STATUS_LABELS).map(key => ({ value: key, label: STATUS_LABELS[key] })));
const classOptions = computed(() => [...new Set(projects.value.map(p => p.class_name).filter(Boolean))]);

const filteredProjects = computed(() => {
  return projects.value.filter(p => {
    if (keyword.value && !p.title.includes(keyword.value)) return false;
    if (statusFilter.value && p.status !== statusFilter.value) return false;
    if (classFilter.value && p.class_name !== classFilter.value) return false;
    return true;
  });
});

const stats = computed(() => {
  const total = projects.value.length;
  const inProgress = projects.value.filter(p => p.status === 'in_progress').length;
  const submitted = projects.value.filter(p => ['submitted', 'reviewing'].includes(p.status)).length;
  return { total, inProgress, submitted };
});

const statCards = computed(() => [
  { label: '纳管项目总数', value: stats.value.total, icon: 'fas fa-folder-tree', iconBg: 'bg-indigo-50 text-indigo-600', trend: 12 },
  { label: '正在攻坚课题', value: stats.value.inProgress, icon: 'fas fa-rocket', iconBg: 'bg-emerald-50 text-emerald-600', trend: 5 },
  { label: '待处理评审', value: stats.value.submitted, icon: 'fas fa-clipboard-check', iconBg: 'bg-amber-50 text-amber-600' },
  { label: '待审批物资', value: pendingCount.value, icon: 'fas fa-microchip', iconBg: 'bg-rose-50 text-rose-600' }
]);

const avatarUrl = computed(() => {
  if (!currentUser.value) return '';
  return currentUser.value.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.value.id || 'admin'}`;
});

const milestoneCount = computed(() => Object.values(wbs.value).reduce((acc, list) => acc + list.length, 0));

function projectStatusLabel(status) {
  return STATUS_LABELS[status] || status || '未知';
}

function getBadgeClass(status) {
  const map = {
    draft: 'bg-slate-50 text-slate-500 border-slate-100',
    submitted: 'bg-blue-50 text-blue-600 border-blue-100',
    reviewing: 'bg-blue-50 text-blue-600 border-blue-100',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-rose-50 text-rose-600 border-rose-100',
    in_progress: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    midterm_review: 'bg-purple-50 text-purple-600 border-purple-100',
    final_review: 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20',
    archived: 'bg-slate-200 text-slate-600 border-slate-200'
  };
  return map[status] || 'bg-slate-50 text-slate-500 border-slate-100';
}

function phaseLabel(phase) {
  const map = { m1: 'P1 立项与调研', m2: 'P2 研发与交付', m3: 'P3 复盘与答辩' };
  return map[phase] || phase;
}

function milestoneLabel(status) {
  const map = { todo: '待办', doing: '进行中', review: '待验收', done: '已完成' };
  return map[status] || '待办';
}

function getMilestoneClass(status) {
  const map = {
    todo: 'bg-slate-50 text-slate-500 border-slate-100',
    doing: 'bg-blue-50 text-blue-600 border-blue-100',
    review: 'bg-amber-50 text-amber-600 border-amber-100',
    done: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };
  return map[status] || 'bg-slate-50 text-slate-500 border-slate-100';
}

function submissionTypeLabel(type) {
  const map = {
    proposal: '立项开题报告',
    milestone_1: '实施里程碑 1',
    milestone_2: '实施里程碑 2',
    midterm: '中期检查报告',
    final: '结题答辩物',
    showcase: '展示墙稿件'
  };
  return map[type] || type || '提交';
}

function submissionStatusLabel(status) {
  if (status === 'reviewed') return '学术审批通过';
  if (status === 'needs_changes') return '需修正补充';
  if (status === 'submitted' || status === 'reviewing') return '待导师阅评';
  return status || '提交';
}

function getSubmissionBadgeClass(status) {
  if (status === 'reviewed') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (status === 'needs_changes') return 'bg-rose-50 text-rose-600 border-rose-100';
  return 'bg-blue-50 text-blue-600 border-blue-100';
}

function previewText(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > 180 ? `${clean.slice(0, 180)}...` : clean;
}

const FIELD_LABELS = {
  problem: '核心问题', goals: '研究目标', scope: '适用范围', approach: '技术路线', plan: '实施计划', teamMembers: '团队构成',
  progressSummary: '进度统计', coreContribution: '核心贡献', evidence: '佐证材料', diagram: '逻辑架构', nextPlan: '后续步骤',
  featureSummary: '功能概览', validation: '实验数据', demoLink: '演示入口', progressCompare: '偏差分析', issuesAdjust: '风险对策',
  deliverables: '成果清单', demo: '展示视频', techSummary: '技术报告', reflection: '反思展望', codeRepo: '代码主库', codeCommit: '节点提交号'
};

function detailEntries(sub) {
  const details = sub?.details || {};
  const orderedKeys = Object.keys(FIELD_LABELS).filter(key => Object.prototype.hasOwnProperty.call(details, key));
  const extraKeys = Object.keys(details).filter(key => !orderedKeys.includes(key));
  const keys = [...orderedKeys, ...extraKeys];
  return keys.map(key => ({
    label: FIELD_LABELS[key] || key,
    value: formatDetailValue(details[key])
  })).filter(item => item.value);
}

function formatDetailValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join('、');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function visibleDetails(sub) {
  const entries = detailEntries(sub);
  if (expandMap.value[sub.id]) return entries;
  return entries.slice(0, 4);
}

function toggleExpand(id) {
  expandMap.value = { ...expandMap.value, [id]: !expandMap.value[id] };
}

async function loadProjects() {
  loading.value = true;
  await projectStore.fetchList();
  loading.value = false;
}

async function loadResources() {
  try {
    const res = await apiFetch('/admin/resources?status=pending');
    const data = await res.json();
    resources.value = data.requests || [];
    pendingCount.value = resources.value.length;
  } catch (err) {
    console.error(err);
    resources.value = [];
    pendingCount.value = 0;
  }
}

async function auditResource(id, status) {
  try {
    const res = await apiFetch(`/resources/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || '系统同步失败');
    await loadResources();
    notification.success('物资审批指令已成功执行');
    if (selectedProject.value) {
      await selectProject(selectedProject.value);
    }
  } catch (err) {
    notification.error(err.message || '系统指令执行失败');
  }
}

function normalizeMilestoneStatus(status) {
  if (!status) return 'todo';
  if (['todo', 'doing', 'review', 'done'].includes(status)) return status;
  const map = { pending: 'todo', submitted: 'review', approved: 'done', rejected: 'todo' };
  return map[status] || 'todo';
}

async function selectProject(project) {
  tab.value = 'projects';
  selectedProject.value = project;
  submissions.value = [];
  logs.value = [];
  wbs.value = { m1: [], m2: [], m3: [] };
  expandMap.value = {};

  try {
    const detailRes = await apiFetch(`/projects/${project.id}`);
    const detailData = await detailRes.json();
    submissions.value = detailData.submissions || [];
    logs.value = detailData.logs || [];
  } catch (err) {
    console.error(err);
  }

  try {
    const milestoneRes = await apiFetch(`/projects/${project.id}/milestones`);
    const milestoneData = await milestoneRes.json();
    const milestones = milestoneData.milestones || [];
    const tasks = milestones.map(item => ({
      id: item.id,
      title: item.title,
      phase: item.description || 'm1',
      status: normalizeMilestoneStatus(item.status),
      assignee: item.assignee || '',
      endDate: item.end_date || item.deadline || ''
    }));
    wbs.value = {
      m1: tasks.filter(t => t.phase === 'm1'),
      m2: tasks.filter(t => t.phase === 'm2'),
      m3: tasks.filter(t => t.phase === 'm3')
    };
  } catch (err) {
    console.error(err);
  }
}

function openReview(submission, status) {
  reviewModal.value = { open: true, submission, status, feedback: '' };
}

function closeReview() {
  reviewModal.value = { open: false, submission: null, status: 'reviewed', feedback: '' };
}

async function confirmReview() {
  const { submission, status, feedback } = reviewModal.value;
  if (!submission) return;
  if (status === 'needs_changes' && !feedback.trim()) {
    notification.warning('退回修改必须填写具体的学术改进建议');
    return;
  }
  reviewing.value = true;
  try {
    const res = await apiFetch(`/submissions/${submission.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, feedback })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '联机失败');
    notification.success(status === 'reviewed' ? '已批准该学术节点的交付物' : '已成功发送修改建议');
    closeReview();
    await selectProject(selectedProject.value);
  } catch (err) {
    notification.error(err.message || '联机失败');
  } finally {
    reviewing.value = false;
  }
}

function refreshAll() {
  loadProjects();
  loadResources();
  if (selectedProject.value) {
    selectProject(selectedProject.value);
  }
}

function logout() {
  authStore.logout();
  router.replace('/login');
}

onMounted(async () => {
  authStore.hydrate();
  const user = authStore.user;
  if (!user) {
    authStore.setRedirect('/teacher');
    router.replace('/login');
    return;
  }
  if (user.role !== 'teacher' && user.role !== 'judge') {
    router.replace('/workspace');
    return;
  }
  await loadProjects();
  await loadResources();
});

watch(tab, (value) => {
  if (value === 'resources') {
    loadResources();
  }
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
