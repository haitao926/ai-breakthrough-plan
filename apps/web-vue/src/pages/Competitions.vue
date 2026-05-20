<template>
  <div class="competitions-page">
    <SiteNav active="competitions" />

    <main class="competitions-shell space-y-8">
      <!-- 页面头部 / Hero Banner -->
      <section class="relative overflow-hidden rounded-[32px] p-8 lg:p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl">
        <!-- 装饰背景 -->
        <div class="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none"></div>
        <div class="absolute -left-20 -top-20 w-96 h-96 rounded-full bg-cyan-600/10 blur-[80px] pointer-events-none"></div>
        
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center relative z-10">
          <!-- 左侧文案与主要动作 -->
          <div class="lg:col-span-3 space-y-6">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <i class="fas fa-bullseye text-[10px]"></i>
              <span class="text-[9px] font-black uppercase tracking-widest">Competition radar</span>
            </div>
            
            <h1 class="text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.15]">
              赛事战场作战台
            </h1>
            
            <p class="text-slate-300 text-xs md:text-sm leading-relaxed font-medium max-w-2xl">
              从课堂走向战场的舞台。在此判断投入价值，对接 SASU 科创课程，制定个性化团队训练计划，将创意小发明升级为含金量十足的科创成果。
            </p>
            
            <div class="flex flex-wrap gap-3 pt-2">
              <a href="#competition-list" class="px-5 py-3 rounded-2xl font-black text-white bg-indigo-600 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center gap-2 text-xs uppercase tracking-wider">
                <i class="fas fa-magnifying-glass-chart"></i>
                筛选匹配赛事
              </a>
              <button 
                type="button" 
                class="px-5 py-3 rounded-2xl font-black text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center gap-2 text-xs uppercase tracking-wider"
                @click="resetFilters"
              >
                <i class="fas fa-rotate-left"></i>
                重置情报雷达
              </button>
            </div>
          </div>
          
          <!-- 右侧统计仪表盘 -->
          <div class="lg:col-span-2 grid grid-cols-2 gap-4">
            <!-- 正在报名 -->
            <div class="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">正在报名</span>
              <div class="flex items-baseline gap-2 mt-4">
                <span class="text-3xl font-black text-emerald-400 tracking-tight">{{ statusCount('报名中') }}</span>
                <span class="text-[9px] font-bold text-slate-400">项可冲刺</span>
              </div>
            </div>
            
            <!-- 即将开始 -->
            <div class="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col justify-between group hover:border-amber-500/30 transition-all duration-300">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">即将开始</span>
              <div class="flex items-baseline gap-2 mt-4">
                <span class="text-3xl font-black text-amber-400 tracking-tight">{{ statusCount('即将开始') }}</span>
                <span class="text-[9px] font-bold text-slate-400">项备战中</span>
              </div>
            </div>
            
            <!-- 教育部白名单 -->
            <div class="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col justify-between group hover:border-purple-500/30 transition-all duration-300">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">白名单赛事</span>
              <div class="flex items-baseline gap-2 mt-4">
                <span class="text-3xl font-black text-purple-400 tracking-tight">{{ tierCount('白名单赛事') }}</span>
                <span class="text-[9px] font-bold text-slate-400">高含金量</span>
              </div>
            </div>
            
            <!-- 课程衔接率 -->
            <div class="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col justify-between group hover:border-indigo-500/30 transition-all duration-300">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">课程衔接</span>
              <div class="flex items-baseline gap-2 mt-4">
                <span class="text-3xl font-black text-indigo-400 tracking-tight">{{ linkedCourseCount }}</span>
                <span class="text-[9px] font-bold text-slate-400">项强关联</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 统一的雷达筛选控制中心 -->
      <section class="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div class="space-y-1">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter Desk</span>
            <h2 class="text-xl font-black text-slate-900 tracking-tight">智能筛选与价值评估</h2>
          </div>
          <button 
            type="button" 
            class="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5"
            @click="resetFilters"
          >
            <i class="fas fa-rotate-left"></i>
            清空所有条件
          </button>
        </div>
        
        <!-- 筛选控件网格 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- 关键词搜索 -->
          <div class="space-y-2">
            <label for="competition-search" class="block text-[9px] font-black text-slate-400 uppercase tracking-widest">赛事搜索</label>
            <div class="relative flex items-center">
              <i class="fas fa-magnifying-glass absolute left-3.5 text-slate-400 text-xs"></i>
              <input 
                id="competition-search"
                v-model.trim="keyword" 
                type="text" 
                placeholder="搜索赛事名称、学段..."
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold text-slate-900 bg-white"
              />
            </div>
          </div>
          
          <!-- 状态 -->
          <div class="space-y-2">
            <label for="status-filter" class="block text-[9px] font-black text-slate-400 uppercase tracking-widest">赛事状态</label>
            <select 
              id="status-filter" 
              v-model="activeStatus"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold text-slate-900 bg-white"
            >
              <option v-for="item in statusOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          
          <!-- 层级 -->
          <div class="space-y-2">
            <label for="tier-filter" class="block text-[9px] font-black text-slate-400 uppercase tracking-widest">级别层级</label>
            <select 
              id="tier-filter" 
              v-model="activeTier"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold text-slate-900 bg-white"
            >
              <option v-for="item in tierOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          
          <!-- 专业方向 -->
          <div class="space-y-2">
            <label for="discipline-filter" class="block text-[9px] font-black text-slate-400 uppercase tracking-widest">专业方向</label>
            <select 
              id="discipline-filter" 
              v-model="activeDiscipline"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold text-slate-900 bg-white"
            >
              <option v-for="item in disciplineOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          
          <!-- 学段 -->
          <div class="space-y-2">
            <label for="stage-filter" class="block text-[9px] font-black text-slate-400 uppercase tracking-widest">适合学段</label>
            <select 
              id="stage-filter" 
              v-model="activeStage"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold text-slate-900 bg-white"
            >
              <option v-for="item in stageOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
        </div>
        
        <!-- 筛选总结与激活的标签 -->
        <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs font-bold text-slate-400">
          <div class="flex items-center gap-2">
            <i class="fas fa-chart-simple text-slate-400"></i>
            <span>已为您筛选出 <strong class="text-slate-900 font-extrabold">{{ filteredCompetitions.length }}</strong> 个适合的科创赛事</span>
          </div>
          
          <div class="flex flex-wrap gap-2 justify-end">
            <span 
              v-for="chip in activeFilterChips" 
              :key="chip"
              class="px-2.5 py-1 rounded-lg text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1.5"
            >
              {{ chip }}
            </span>
          </div>
        </div>
      </section>

      <!-- 推荐与排期面板 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧：重点推荐推进赛事 -->
        <div class="lg:col-span-2 space-y-6">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recommended Actions</span>
              <h2 class="text-2xl font-black text-slate-900 tracking-tight">重磅推进赛事推荐</h2>
            </div>
            
            <div class="flex items-center gap-2 text-xs font-bold">
              <span class="text-slate-400">排序依据:</span>
              <select v-model="sortMode" class="bg-transparent text-indigo-600 border-none font-extrabold focus:outline-none cursor-pointer">
                <option value="match">匹配度优先</option>
                <option value="status">状态优先</option>
                <option value="tier">级别层级优先</option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 推荐卡片 -->
            <RouterLink 
              v-for="item in topActionCompetitions" 
              :key="item.slug"
              :to="`/competitions/${item.slug}`"
              class="group relative flex flex-col justify-between p-6 rounded-3xl bg-white border border-slate-100 hover:border-indigo-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden"
            >
              <!-- 匹配度气泡 -->
              <div class="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-rose-50/50 group-hover:bg-rose-50 transition-colors flex items-end justify-start p-8 pointer-events-none">
                <div class="text-right">
                  <span class="block text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">匹配度</span>
                  <span class="text-lg font-black text-rose-500 leading-none">{{ getMatchScore(item) }}%</span>
                </div>
              </div>
              
              <div class="space-y-4">
                <div class="flex flex-wrap gap-2 items-center pr-12">
                  <span :class="['px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border', statusClass(item.status) === 'is-open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : statusClass(item.status) === 'is-upcoming' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100']">
                    {{ item.status }}
                  </span>
                  <span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100">
                    {{ item.tier }}
                  </span>
                </div>
                
                <h3 class="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                  {{ item.title }}
                </h3>
                
                <p class="text-xs text-slate-500 leading-relaxed font-bold">
                  <i class="fas fa-bullseye text-[10px] text-indigo-500 mr-1.5"></i>
                  {{ item.prepAdvice }}
                </p>
                
                <div class="text-[10px] text-slate-400 border-t border-slate-50 pt-3 flex items-center justify-between">
                  <span><i class="far fa-calendar-alt mr-1"></i> {{ item.dateRange }}</span>
                  <span class="text-indigo-600 font-black"><i class="fas fa-graduation-cap mr-1"></i> {{ courseSummary(item) }}</span>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
        
        <!-- 右侧：行动建议与推荐排期 -->
        <div class="space-y-6">
          <div class="space-y-1">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Decision Brief & Timeline</span>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">备战推进排期</h2>
          </div>
          
          <div class="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-[28px] shadow-sm space-y-6">
            <!-- 推荐简报 -->
            <div class="bg-amber-50/50 border border-amber-100/50 p-4 rounded-2xl space-y-2">
              <span class="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                <i class="fas fa-triangle-exclamation"></i>
                当前决策指南
              </span>
              <strong class="block text-xs font-black text-slate-800 leading-tight">
                {{ dashboardSummary.title }}
              </strong>
              <p class="text-[10px] text-slate-500 font-bold leading-relaxed">
                {{ dashboardSummary.body }}
              </p>
            </div>
            
            <!-- 时间表排期 -->
            <div class="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              <div v-for="item in prepSchedule" :key="item.label" class="relative pl-8 flex gap-3 group">
                <div class="absolute left-1 top-1.5 w-4 h-4 rounded-full border-2 border-indigo-600 bg-white group-hover:bg-indigo-600 transition-colors flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-indigo-600 group-hover:bg-white"></div>
                </div>
                <div class="space-y-1">
                  <span class="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                    {{ item.label }}
                  </span>
                  <strong class="block text-xs font-black text-slate-900 leading-none">
                    {{ item.title }}
                  </strong>
                  <p class="text-[10px] text-slate-400 font-bold leading-relaxed">
                    {{ item.body }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 全部候选赛事清单 -->
      <section id="competition-list" class="space-y-6 pt-6">
        <div class="flex items-center justify-between border-b border-slate-200/60 pb-4">
          <div class="space-y-1">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Candidate Directory</span>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">全部候选赛事名录</h2>
          </div>
          <span class="text-xs font-bold text-slate-400 bg-slate-100/70 px-3 py-1 rounded-full">
            已检索到 {{ filteredCompetitions.length }} 个候选
          </span>
        </div>
        
        <div v-if="filteredCompetitions.length" class="grid grid-cols-1 gap-4">
          <!-- 赛事卡片 -->
          <RouterLink 
            v-for="item in filteredCompetitions" 
            :key="item.slug"
            :to="`/competitions/${item.slug}`"
            class="group flex flex-col md:flex-row md:items-stretch justify-between bg-white border border-slate-100 rounded-3xl overflow-hidden hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
          >
            <!-- 左侧内容区 -->
            <div class="flex-1 p-6 space-y-4">
              <div class="flex flex-wrap gap-2 items-center text-xs text-slate-400 font-bold">
                <span :class="['px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border', statusClass(item.status) === 'is-open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : statusClass(item.status) === 'is-upcoming' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100']">
                  {{ item.status }}
                </span>
                <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                  {{ item.tier }}
                </span>
                <span class="ml-2 font-bold"><i class="far fa-calendar mr-1"></i> {{ item.dateRange }}</span>
                <span class="ml-2 font-bold"><i class="fas fa-building mr-1"></i> 主办: {{ item.host }}</span>
              </div>
              
              <div>
                <h3 class="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  {{ item.title }}
                </h3>
                <p class="text-xs text-slate-500 leading-relaxed font-bold mt-2">
                  {{ item.fitSummary }}
                </p>
              </div>
              
              <!-- 标签与投入价值评估 -->
              <div class="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-50">
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="tag in item.discipline" :key="tag" class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50/50 text-indigo-600 border border-indigo-100/30">
                    {{ tag }}
                  </span>
                  <span v-for="stage in item.schoolStage" :key="stage" class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-50 text-slate-400 border border-slate-100">
                    {{ stage }}
                  </span>
                </div>
                
                <div class="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                  <span>投入评估:</span>
                  <span class="px-2 py-0.5 rounded bg-amber-50 text-amber-750 font-black">
                    {{ valueLabel(item) }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- 右侧备赛与匹配评估区 -->
            <div class="md:w-64 p-6 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-between gap-4 items-stretch">
              <div class="flex items-center justify-between md:flex-col md:items-start gap-2">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">匹配度评级</span>
                <div class="flex items-baseline gap-1 mt-1">
                  <span class="text-3xl font-black text-rose-500 tracking-tight leading-none">{{ getMatchScore(item) }}</span>
                  <span class="text-[10px] font-black text-slate-400">/ 100</span>
                </div>
              </div>
              
              <div class="space-y-1">
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">衔接课程</span>
                <span class="block text-xs font-black text-indigo-600 leading-snug">
                  {{ courseSummary(item) }}
                </span>
              </div>
              
              <div class="w-full flex items-center justify-between text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors pt-2 group/btn">
                <span>{{ actionLabel(item.status) }}</span>
                <i class="fas fa-arrow-right transition-transform group-hover/btn:translate-x-1"></i>
              </div>
            </div>
          </RouterLink>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="text-center py-16 bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm space-y-4">
          <i class="fas fa-filter-circle-xmark text-4xl text-slate-300"></i>
          <h3 class="text-lg font-black text-slate-955">没有符合筛选条件的赛事</h3>
          <p class="text-xs text-slate-500 max-w-sm mx-auto font-bold leading-relaxed">
            建议放宽检索条件，或者点击下方按钮重置雷达筛选器。
          </p>
          <button 
            type="button" 
            class="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors"
            @click="resetFilters"
          >
            重置所有条件
          </button>
        </div>
      </section>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import { fetchCompetitions } from '@/api/portal';

const competitions = ref([]);
const keyword = ref('');
const activeTier = ref('全部');
const activeDiscipline = ref('全部');
const activeStage = ref('全部');
const activeStatus = ref('全部');
const sortMode = ref('match');

const statusRank = {
  报名中: 5,
  进行中: 4,
  即将开始: 3,
  长期征集: 2
};

const tierRank = {
  白名单赛事: 5,
  上海市赛事: 4,
  区赛: 3,
  校内活动: 2
};

const tierOptions = computed(() => buildOptions(competitions.value.map(item => item.tier)));
const disciplineOptions = computed(() => buildOptions(competitions.value.flatMap(item => item.discipline)));
const stageOptions = computed(() => buildOptions(competitions.value.flatMap(item => item.schoolStage)));
const statusOptions = computed(() => buildOptions(competitions.value.map(item => item.status)));

const openCount = computed(() => competitions.value.filter(item => ['报名中', '即将开始', '进行中'].includes(item.status)).length);
const linkedCourseCount = computed(() => competitions.value.filter(item => item.relatedCourses?.length).length);

const filteredCompetitions = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  const items = competitions.value.filter(item => {
    const searchable = [
      item.title,
      item.tagline,
      item.fitSummary,
      item.whyJoin,
      item.prepAdvice,
      item.host,
      item.location,
      ...item.discipline,
      ...item.schoolStage,
      ...(item.relatedCourses || []).map(course => course.title)
    ].join(' ').toLowerCase();

    const matchesKeyword = !query || searchable.includes(query);
    const matchesTier = activeTier.value === '全部' || item.tier === activeTier.value;
    const matchesDiscipline = activeDiscipline.value === '全部' || item.discipline.includes(activeDiscipline.value);
    const matchesStage = activeStage.value === '全部' || item.schoolStage.includes(activeStage.value);
    const matchesStatus = activeStatus.value === '全部' || item.status === activeStatus.value;
    return matchesKeyword && matchesTier && matchesDiscipline && matchesStage && matchesStatus;
  });

  return [...items].sort((a, b) => {
    if (sortMode.value === 'status') return getStatusRank(b) - getStatusRank(a);
    if (sortMode.value === 'tier') return getTierRank(b) - getTierRank(a);
    return getMatchScore(b) - getMatchScore(a);
  });
});

const priorityCompetitions = computed(() => {
  const source = filteredCompetitions.value.length ? filteredCompetitions.value : competitions.value;
  return [...source].sort((a, b) => getMatchScore(b) - getMatchScore(a)).slice(0, 4);
});

const topActionCompetitions = computed(() => priorityCompetitions.value.slice(0, 4));

const quickStatusFilters = computed(() => [
  { label: '全部赛事', value: '全部', count: competitions.value.length, icon: 'fas fa-layer-group' },
  { label: '报名中', value: '报名中', count: statusCount('报名中'), icon: 'fas fa-bolt' },
  { label: '即将开始', value: '即将开始', count: statusCount('即将开始'), icon: 'fas fa-hourglass-half' },
  { label: '进行中', value: '进行中', count: statusCount('进行中'), icon: 'fas fa-wave-square' },
  { label: '长期征集', value: '长期征集', count: statusCount('长期征集'), icon: 'fas fa-inbox' }
]);

const currentFilterLabel = computed(() => {
  const labels = [activeStatus.value, activeTier.value, activeDiscipline.value, activeStage.value].filter(item => item !== '全部');
  return labels.length ? labels.join(' / ') : '全部赛事';
});

const activeFilterChips = computed(() => {
  return [
    keyword.value ? `搜索: ${keyword.value}` : '',
    activeStatus.value !== '全部' ? activeStatus.value : '',
    activeTier.value !== '全部' ? activeTier.value : '',
    activeDiscipline.value !== '全部' ? activeDiscipline.value : '',
    activeStage.value !== '全部' ? activeStage.value : ''
  ].filter(Boolean);
});

const sortLabel = computed(() => {
  if (sortMode.value === 'status') return '状态优先';
  if (sortMode.value === 'tier') return '层级优先';
  return '匹配优先';
});

const dashboardSummary = computed(() => {
  const first = priorityCompetitions.value[0];
  if (!competitions.value.length) {
    return {
      title: '正在载入赛事池',
      body: '加载完成后会按状态、层级、课程衔接自动排出优先级。'
    };
  }
  if (!filteredCompetitions.value.length) {
    return {
      title: '当前条件过窄',
      body: '先放宽状态或方向，找到候选池后再按学生基础缩小范围。'
    };
  }
  return {
    title: `首推：${first.title}`,
    body: `${first.status} · ${first.tier}。建议优先核对报名条件并选拔队员。`
  };
});

const prepSchedule = computed(() => {
  const source = priorityCompetitions.value;
  const primary = source[0];
  const secondary = source[1];
  const fallback = {
    title: '暂无匹配赛事',
    prepAdvice: '清空筛选后重新选择方向和学段。',
    fitSummary: '需要先扩大候选池。'
  };

  return [
    {
      label: '今日推进',
      title: primary?.title || fallback.title,
      body: primary ? `核对报名截止与赛道要求` : fallback.prepAdvice
    },
    {
      label: '本周备战',
      title: primary ? actionLabel(primary.status) : '重组候选队列',
      body: primary?.prepAdvice || fallback.prepAdvice
    },
    {
      label: '下次课引导',
      title: secondary?.title || primary?.title || fallback.title,
      body: secondary?.fitSummary || primary?.fitSummary || fallback.fitSummary
    }
  ];
});

function buildOptions(values) {
  return ['全部', ...Array.from(new Set(values.filter(Boolean)))];
}

function statusCount(status) {
  return competitions.value.filter(item => item.status === status).length;
}

function tierCount(tier) {
  return competitions.value.filter(item => item.tier === tier).length;
}

function getStatusRank(item) {
  return statusRank[item.status] || 1;
}

function getTierRank(item) {
  return tierRank[item.tier] || 1;
}

function getMatchScore(item) {
  let score = 54;
  score += getStatusRank(item) * 6;
  score += getTierRank(item) * 4;
  score += (item.relatedCourses?.length || 0) * 4;
  if (item.featuredFlags?.includes('home')) score += 5;
  if (activeDiscipline.value !== '全部' && item.discipline.includes(activeDiscipline.value)) score += 8;
  if (activeStage.value !== '全部' && item.schoolStage.includes(activeStage.value)) score += 8;
  return Math.min(score, 98);
}

function courseSummary(item) {
  if (!item.relatedCourses?.length) return '自主准备';
  return item.relatedCourses.map(course => course.title).slice(0, 2).join(' / ');
}

function valueLabel(item) {
  if (item.tier === '白名单赛事') return '高含金量';
  if (item.tier === '上海市赛事') return '市级展示';
  if (item.status === '长期征集') return '训练储备';
  if (item.tier === '校内活动') return '低门槛启动';
  return '适合试投';
}

function actionLabel(status) {
  if (status === '报名中') return '查看报名路径';
  if (status === '即将开始') return '制定准备计划';
  if (status === '进行中') return '查看参与方式';
  if (status === '长期征集') return '加入候选池';
  return '查看详情';
}

function resetFilters() {
  keyword.value = '';
  activeTier.value = '全部';
  activeDiscipline.value = '全部';
  activeStage.value = '全部';
  activeStatus.value = '全部';
  sortMode.value = 'match';
}

function statusClass(status) {
  if (status === '报名中') return 'is-open';
  if (status === '即将开始') return 'is-upcoming';
  if (status === '进行中') return 'is-live';
  return 'is-muted';
}

onMounted(async () => {
  competitions.value = await fetchCompetitions();
});
</script>

<style scoped>
.competitions-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 30%),
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
}

.competitions-shell {
  width: min(1280px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 118px 0 88px;
}
</style>
