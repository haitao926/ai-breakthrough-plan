<template>
  <div class="home-page">
    <SiteNav />

    <section class="hero-stage">
      <div class="home-shell">
        <RollingBanner :items="homeBannerItems" />

        <div class="home-summary-panel glass-premium">
          <div class="home-summary-route">
            <div class="flex items-center justify-between mb-2">
              <p class="section-kicker">Learning Route · 科创四步走</p>
              <span class="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50">探索工程思维</span>
            </div>
            
            <div class="relative py-4">
              <!-- Background glowing line -->
              <div class="absolute left-8 right-8 top-[36px] h-0.5 bg-slate-200/80 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500 transition-all duration-500" :style="{ width: (activeStepIndex * 33.3) + '%' }"></div>
              </div>
              
              <div class="relative grid grid-cols-4 gap-2">
                <div 
                  v-for="(item, idx) in routeSteps" 
                  :key="item.title" 
                  class="home-route-step group cursor-pointer"
                  :class="{ active: activeStepIndex === idx }"
                  @mouseenter="activeStepIndex = idx"
                >
                  <!-- Step number circle -->
                  <div 
                    class="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-black text-xs transition-all duration-300 relative z-10 border-2"
                    :class="activeStepIndex === idx 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                      : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-600'"
                  >
                    {{ idx + 1 }}
                  </div>
                  
                  <!-- Step description -->
                  <div class="text-center mt-2">
                    <span class="text-[9px] font-black uppercase tracking-wider text-slate-400 group-hover:text-indigo-600" :class="{ 'text-indigo-600': activeStepIndex === idx }">{{ item.title }}</span>
                    <strong class="block text-[11px] font-extrabold text-slate-800 mt-0.5">{{ item.desc }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Step Detail Card -->
            <transition name="fade-slide" mode="out-in">
              <div :key="activeStepIndex" class="mt-2 p-3 rounded-2xl bg-indigo-50/30 border border-indigo-100/30 flex items-center gap-3">
                <div class="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 shadow-sm border border-slate-200/50">
                  <img :src="routeSteps[activeStepIndex].image" class="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{{ routeSteps[activeStepIndex].title }} · {{ routeSteps[activeStepIndex].desc }}</h4>
                  <p class="text-[11px] text-slate-500 font-bold mt-0.5 leading-relaxed">{{ routeSteps[activeStepIndex].details }}</p>
                </div>
              </div>
            </transition>
          </div>

          <div class="home-summary-actions">
            <template v-if="isAuthenticated && user">
              <RouterLink :to="workspaceTarget" class="hero-primary-action">
                <i class="fas" :class="isTeacher ? 'fa-chalkboard-teacher' : 'fa-rocket'"></i>
                <span>{{ workspaceLabel }}</span>
              </RouterLink>
              <RouterLink to="/projects" class="hero-secondary-action">
                <i class="fas fa-layer-group"></i>
                <span>浏览项目库</span>
              </RouterLink>
            </template>
            <template v-else>
              <RouterLink to="/login" class="hero-primary-action">
                <i class="fas fa-right-to-bracket"></i>
                <span>登录平台</span>
              </RouterLink>
              <RouterLink to="/register" class="hero-secondary-action">
                <i class="fas fa-user-plus"></i>
                <span>注册账号</span>
              </RouterLink>
              <RouterLink to="/projects" class="hero-primary-action">
                <i class="fas fa-layer-group"></i>
                <span>从项目开始</span>
              </RouterLink>
              <a href="#overview" class="hero-secondary-action">
                <i class="fas fa-compass"></i>
                <span>查看平台入口</span>
              </a>
            </template>
          </div>
        </div>
      </div>
    </section>

    <main id="overview" class="home-shell home-main">
      <section class="overview-panel">
        <div class="overview-header">
          <div>
            <p class="section-kicker">Quick Start</p>
            <h2>平台入口</h2>
          </div>
          <p class="overview-note">看图进入对应模块。</p>
        </div>

        <div class="overview-grid">
          <RouterLink
            v-for="item in quickLinks"
            :key="item.title"
            :to="item.to"
            class="quick-link-card"
          >
            <img :src="item.image" :alt="item.title" class="quick-link-image" />
            <div class="quick-link-overlay"></div>
            <div class="quick-link-copy">
              <span>{{ item.kicker }}</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </div>
          </RouterLink>
        </div>
      </section>

      <section class="sidebar-stack">
        <article class="compact-panel">
          <div class="compact-panel-head">
            <div>
              <p class="section-kicker">Course Picks</p>
              <h2>精选课程</h2>
            </div>
            <RouterLink to="/downloads" class="panel-link">课程库</RouterLink>
          </div>

          <div class="course-list">
            <RouterLink
              v-for="course in featuredCourses"
              :key="course.id"
              :to="course.to"
              class="course-list-item"
            >
              <img :src="course.image" :alt="course.title" class="course-list-thumb" />
              <div class="course-list-copy">
                <span>{{ course.kicker }}</span>
                <strong>{{ course.title }}</strong>
              </div>
              <i class="fas fa-arrow-right"></i>
            </RouterLink>
          </div>
        </article>

        <article class="compact-panel">
          <div class="compact-panel-head">
            <div>
              <p class="section-kicker">Activities</p>
              <h2>近期活动</h2>
            </div>
            <RouterLink to="/competitions" class="panel-link">查看全部</RouterLink>
          </div>

          <div class="activity-list">
            <RouterLink
              v-for="item in featuredCompetitions"
              :key="item.slug"
              :to="`/competitions/${item.slug}`"
              class="activity-item"
            >
              <div class="activity-copy">
                <span class="activity-tier">{{ item.tier }}</span>
                <strong>{{ item.title }}</strong>
                <p>{{ item.dateRange }}</p>
              </div>
              <span class="activity-status">{{ item.status }}</span>
            </RouterLink>

            <div v-if="!featuredCompetitions.length" class="activity-empty">
              竞赛活动正在整理中。
            </div>
          </div>
        </article>
      </section>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import RollingBanner from '@/components/portal/RollingBanner.vue';
import { fetchCompetitions } from '@/api/portal';
import { useAuthStore } from '@/stores/auth';
import { getPageBannerItems } from '@/utils/publicBanners';
import { getPrimaryWorkspaceLabel, getPrimaryWorkspaceTarget, isTeacherLike } from '@/utils/userRole';

const authStore = useAuthStore();
authStore.hydrate();

const { user, isAuthenticated } = storeToRefs(authStore);
const competitions = ref([]);
const isTeacher = computed(() => isTeacherLike(user.value?.role));

const homeBannerItems = getPageBannerItems('home');

const activeStepIndex = ref(0);
const routeSteps = [
  {
    title: '项目',
    desc: '先看方向',
    details: '自主立项与团队组建：探索机器人、数字创意与可持续创新主题，确立研究方向。',
    image: '/assets/banners/banner-projects.png'
  },
  {
    title: '知识',
    desc: '补研究线索',
    details: '跨学科知识自主探究：学习 AI 大语言模型、控制算法与工程设计，为项目推进扫清知识障碍。',
    image: '/assets/banners/banner-knowledge.png'
  },
  {
    title: '课程',
    desc: '进课堂任务',
    details: '实施与里程碑成果交付：动手调试软硬件、编写代码、制作演示材料，完成客观验证。',
    image: '/assets/banners/banner-courses.png'
  },
  {
    title: '竞赛',
    desc: '去真实展示',
    details: '成果路演与赛事衔接：在成果陈列墙上展示创意，对接市级、国家级青少年科创与创客竞赛。',
    image: '/assets/banners/banner-competitions.png'
  }
];

const quickLinks = computed(() => {
  const items = [
    {
      kicker: 'Auth',
      title: '登录 / 注册',
      desc: '先进入账号入口，再进入对应工作区。',
      to: '/login',
      image: '/assets/banners/banner-courses-practice.png'
    },
    {
      kicker: 'Projects',
      title: '项目库',
      desc: '先看作品与课题。',
      to: '/projects',
      image: '/assets/banners/banner-projects.png'
    },
    {
      kicker: 'Knowledge',
      title: '创新知识库',
      desc: '只看问题与研究线索。',
      to: '/knowledge',
      image: '/assets/banners/banner-knowledge.png'
    },
    {
      kicker: 'Course Library',
      title: '课程库',
      desc: '进入课程、讲义与代码。',
      to: '/downloads',
      image: '/assets/banners/banner-courses.png'
    },
    {
      kicker: 'Competitions',
      title: '竞赛活动',
      desc: '看展示机会与匹配度。',
      to: '/competitions',
      image: '/assets/banners/banner-competitions.png'
    }
  ];

  if (isAuthenticated.value) {
    return items.filter(item => item.to !== '/login');
  }

  return items;
});

const featuredCourses = [
  {
    id: 'robotics-club',
    to: '/courses/robotics-club',
    title: '自主移动机器人社团课',
    kicker: 'Robotics Club',
    image: '/course-covers/robotics-club.png'
  },
  {
    id: 'maker-camp',
    to: '/courses/maker-camp',
    title: '创客新星营',
    kicker: 'Maker Camp',
    image: '/course-covers/maker-camp.png'
  },
  {
    id: 'ros2-training-robot',
    to: '/courses/ros2-training-robot',
    title: 'ROS2 训练机器人课程',
    kicker: 'ROS2 Track',
    image: '/course-covers/ros2-training-robot.png'
  }
];

const workspaceTarget = computed(() => (
  getPrimaryWorkspaceTarget(user.value)
));
const workspaceLabel = computed(() => getPrimaryWorkspaceLabel(user.value));

const featuredCompetitions = computed(() => {
  const featured = competitions.value.filter(item => item.featuredFlags?.includes('home'));
  return (featured.length ? featured : competitions.value).slice(0, 2);
});

fetchCompetitions().then(items => {
  competitions.value = items;
}).catch(err => {
  console.error(err);
  competitions.value = [];
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 26%),
    linear-gradient(180deg, #f8fbff 0%, #f8fafc 42%, #eef4ff 100%);
  color: #0f172a;
}

.home-shell {
  width: min(1320px, calc(100vw - 32px));
  margin: 0 auto;
}

.hero-stage {
  padding: 118px 0 16px;
}

.home-summary-panel,
.overview-panel,
.compact-panel,
.course-list-item,
.activity-item,
.quick-link-card {
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03), 
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border-radius: 28px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.home-summary-panel {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  margin-top: 12px;
  padding: 16px 18px;
}

.home-summary-route,
.home-route-line {
  min-width: 0;
}

.overview-header h2,
.compact-panel-head h2,
.quick-link-copy h3 {
  font-family: inherit;
}

.section-kicker {
  margin: 0;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.home-route-line {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.home-summary-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.hero-primary-action,
.hero-secondary-action,
.panel-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-primary-action {
  min-height: 46px;
  padding: 0 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  font-size: 0.92rem;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2);
}

.hero-secondary-action {
  min-height: 46px;
  padding: 0 18px;
  border-radius: 16px;
  border: 1px solid rgba(79, 70, 229, 0.2);
  background: #fff;
  color: #4338ca;
  font-size: 0.92rem;
  font-weight: 800;
}

.hero-primary-action:hover,
.hero-secondary-action:hover,
.panel-link:hover,
.course-list-item:hover,
.activity-item:hover,
.quick-link-card:hover {
  transform: translateY(-3px);
}

.course-list-copy span,
.activity-tier,
.quick-link-copy span {
  display: inline-flex;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.home-route-step {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.home-route-step:hover {
  transform: translateY(-2px);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.home-main {
  display: grid;
  gap: 22px;
  align-items: start;
  grid-template-columns: minmax(0, 1.18fr) 360px;
  padding-bottom: 48px;
}

.overview-panel,
.compact-panel {
  padding: 22px;
  border-radius: 28px;
}

.overview-header,
.compact-panel-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.overview-header h2,
.compact-panel-head h2 {
  margin: 10px 0 0;
  font-size: 1.58rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.04em;
}

.overview-note {
  margin: 0;
  color: #64748b;
  font-size: 0.92rem;
  font-weight: 700;
}

.overview-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 18px;
}

.quick-link-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 214px;
  border-radius: 24px;
  text-decoration: none;
  color: inherit;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.quick-link-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.15);
}

.quick-link-image,
.quick-link-overlay {
  position: absolute;
  inset: 0;
}

.quick-link-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.quick-link-card:hover .quick-link-image {
  transform: scale(1.08);
}

.quick-link-overlay {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0) 20%, rgba(15, 23, 42, 0.2) 50%, rgba(15, 23, 42, 0.85) 100%);
  transition: opacity 0.4s ease;
}


.quick-link-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 100%;
  padding: 20px;
}

.quick-link-copy span {
  color: rgba(199, 210, 254, 0.96);
}

.quick-link-copy h3 {
  margin: 10px 0 0;
  color: #fff;
  font-size: 1.34rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.quick-link-copy p {
  margin: 10px 0 0;
  max-width: 18rem;
  color: rgba(226, 232, 240, 0.94);
  font-size: 0.93rem;
  line-height: 1.65;
}

.sidebar-stack {
  display: grid;
  gap: 22px;
}

.compact-panel-head {
  align-items: center;
}

.panel-link {
  color: #4f46e5;
  font-size: 0.85rem;
  font-weight: 800;
}

.course-list,
.activity-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.course-list-item,
.activity-item {
  display: grid;
  gap: 12px;
  align-items: center;
  text-decoration: none;
  color: inherit;
  border-radius: 20px;
  padding: 10px;
  transition: 0.22s ease;
}

.course-list-item {
  grid-template-columns: 86px minmax(0, 1fr) 18px;
}

.course-list-thumb {
  width: 86px;
  height: 70px;
  object-fit: cover;
  border-radius: 14px;
}

.course-list-copy strong,
.activity-copy strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 0.96rem;
  line-height: 1.45;
}

.course-list-item i {
  color: #64748b;
  font-size: 0.82rem;
}

.activity-item {
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 14px;
}

.activity-copy p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 0.86rem;
}

.activity-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 62px;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.76rem;
  font-weight: 800;
}

.activity-empty {
  padding: 18px 14px;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  color: #64748b;
  font-size: 0.9rem;
}

@media (max-width: 1100px) {
  .home-main {
    grid-template-columns: 1fr;
  }

  .sidebar-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .hero-stage {
    padding-top: 108px;
  }

  .home-summary-panel {
    grid-template-columns: 1fr;
  }

  .home-summary-actions {
    justify-content: flex-start;
  }

  .home-route-line,
  .overview-grid,
  .sidebar-stack {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .home-shell {
    width: min(1320px, calc(100vw - 20px));
  }

  .overview-panel,
  .compact-panel,
  .home-summary-panel {
    padding: 18px;
    border-radius: 24px;
  }

  .home-summary-actions,
  .overview-header,
  .compact-panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-primary-action,
  .hero-secondary-action {
    width: 100%;
    justify-content: center;
  }

  .course-list-item {
    grid-template-columns: 72px minmax(0, 1fr) 16px;
  }

  .course-list-thumb {
    width: 72px;
    height: 60px;
  }
}
</style>
