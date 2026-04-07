<template>
  <div class="home-page text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 min-h-screen bg-[#f8fafc]">
    <!-- 动态背景层 -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/20 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/20 blur-[120px] rounded-full"></div>
      <div class="absolute inset-0 interactive-grid opacity-[0.4]"></div>
    </div>

    <!-- 导航栏 -->
    <nav class="fixed w-full z-50 glass-nav transition-all duration-500 py-4" :class="{ 'bg-white/90 shadow-xl !py-2 border-slate-200/50': scrolled }">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center gap-4 shrink-0">
            <RouterLink to="/" class="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 group">
              <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 transition-all group-hover:shadow-indigo-500/50">
                <i class="fas fa-cube text-lg"></i>
              </div>
              <div class="flex flex-col">
                <span class="font-black text-xl tracking-tight leading-none text-slate-900">AI 破壁计划</span>
                <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">HAI Tech Lab</span>
              </div>
            </RouterLink>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden lg:flex items-center space-x-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
            <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to" 
              class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all flex items-center gap-2">
              <i :class="link.icon" class="text-xs opacity-70"></i>{{ link.label }}
            </RouterLink>
          </div>

          <!-- User Actions -->
          <div class="flex gap-4 items-center shrink-0">
            <template v-if="user">
              <div class="flex items-center gap-4 bg-white/60 pl-2 pr-5 py-2 rounded-2xl border border-slate-200/50 shadow-sm group cursor-pointer hover:bg-white transition-all" @click="router.push('/workspace')">
                <img :src="avatarUrl" class="w-8 h-8 rounded-xl border-2 border-white shadow-sm" />
                <span class="text-xs font-black text-slate-800 hidden sm:block uppercase tracking-widest">{{ user.name || 'Explorer' }}</span>
              </div>
              <button @click="handleLogout" class="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                <i class="fas fa-power-off text-sm"></i>
              </button>
            </template>
            <template v-else>
              <RouterLink to="/workspace" class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">
                立即开始
              </RouterLink>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-52 pb-32 overflow-hidden z-10">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex flex-col lg:flex-row items-center gap-24">
          <div class="lg:w-3/5 text-center lg:text-left animate-reveal">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              The Future of AI Creation
            </div>
            <h1 class="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[1] text-slate-900 uppercase">
              从创意到<br>
              <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">原型孵化</span>
            </h1>
            <p class="text-xl text-slate-500 font-medium leading-relaxed mb-12 max-w-2xl mx-auto lg:mx-0">
              打破技术壁垒，重构创造能力。在这里，你不仅是代码的编写者，更是未来产品的定义者。深入真实场景，孵化你的第一个 AI 原型。
            </p>

            <div class="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
              <template v-if="user">
                <RouterLink to="/workspace" class="px-10 py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all">
                  <i class="fas fa-rocket mr-3"></i> 进入控制中心
                </RouterLink>
                <RouterLink to="/projects" class="px-10 py-5 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 shadow-xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
                  发现热门课题
                </RouterLink>
              </template>
              <template v-else>
                <a href="#curriculum" class="px-10 py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all">
                  开始学习路径
                </a>
                <RouterLink to="/showcase" class="px-10 py-5 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 shadow-xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
                  项目成果博览
                </RouterLink>
              </template>
            </div>
          </div>

          <!-- Auth / Profile Card -->
          <div class="lg:w-2/5 w-full max-w-md animate-reveal shadow-2xl shadow-indigo-500/10" style="animation-delay: 0.2s">
            <div class="premium-card !p-12 !rounded-[48px] relative overflow-hidden group !bg-white">
              <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
              
              <template v-if="user">
                <div class="text-center py-6 relative z-10 space-y-8">
                  <div class="relative inline-block">
                    <img :src="avatarUrl" class="w-24 h-24 rounded-[32px] border-4 border-white shadow-2xl transition-all group-hover:translate-y-[-4px] group-hover:rotate-3 duration-500">
                    <div class="absolute -bottom-2 -right-2 bg-emerald-500 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                      <i class="fas fa-check text-[10px]"></i>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ user.name || 'AI Explorer' }}</h2>
                    <p class="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Authorized Access / {{ roleLabel }}</p>
                  </div>

                  <div class="pt-8 space-y-4">
                    <RouterLink v-if="user.role === 'teacher'" to="/teacher" class="flex items-center justify-between p-5 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all group/btn shadow-lg">
                       教务管理中心 <i class="fas fa-arrow-right group-hover/btn:translate-x-2 transition-transform"></i>
                    </RouterLink>
                    <RouterLink to="/workspace" class="flex items-center justify-between p-5 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all group/btn shadow-lg">
                       当前立项进度 <i class="fas fa-play group-hover/btn:translate-x-2 transition-transform"></i>
                    </RouterLink>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="mb-10 relative z-10" id="auth-card">
                  <h2 class="text-3xl font-black text-slate-900 tracking-tight">Identity Login</h2>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic shadow-inner">HAI Tech Lab Secure Entry</p>
                </div>
                <form class="space-y-6 relative z-10" @submit.prevent="handleLogin">
                  <div class="space-y-3">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Identifier</label>
                    <input v-model.trim="email" type="text" required class="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-sm" placeholder="your@email.com">
                  </div>
                  <div class="space-y-3">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Key</label>
                    <input v-model.trim="password" type="password" required class="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-sm" placeholder="••••••••">
                  </div>
                  <button type="submit" class="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all mt-4" :disabled="loginLoading">
                    {{ loginLoading ? 'Authenticating...' : 'Establish Connection' }}
                  </button>
                  <p v-if="loginMsg" class="text-center text-[10px] font-black uppercase tracking-widest text-rose-500 animate-pulse">{{ loginMsg }}</p>
                </form>
                <div class="mt-12 pt-8 border-t border-slate-50 text-center">
                   <p class="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Please consult your lead mentor for missing credentials.</p>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Curriculum Grid -->
    <section id="curriculum" class="py-32 relative z-10">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 animate-reveal">
           <div class="space-y-4">
              <h2 class="text-4xl font-black text-slate-900 tracking-tight">全栈科创能力谱系</h2>
              <p class="text-lg text-slate-500 font-medium max-w-xl leading-relaxed">重构每一个知识节点。从学术方法论到物理世界感知，打造属于你的六维能力矩阵。</p>
           </div>
           <RouterLink to="/competencies" class="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-400 transition-all active:scale-95 shadow-sm">
             查看详细地图
           </RouterLink>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-reveal">
          <RouterLink v-for="(course, idx) in curriculum" :key="idx" :to="course.to" 
            class="premium-card group relative !bg-white border-none shadow-xl hover:!shadow-2xl transition-all duration-500 flex flex-col justify-between">
            <div class="absolute top-0 right-0 p-8">
              <span class="text-5xl font-black text-slate-100 transition-colors group-hover:text-indigo-100/50">{{ course.id }}</span>
            </div>
            <div class="relative z-10">
              <div :class="course.iconBg" class="w-16 h-16 rounded-[24px] flex items-center justify-center mb-10 shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3">
                <i :class="[course.icon, course.iconColor]" class="text-2xl"></i>
              </div>
              <h3 class="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-indigo-600 transition-colors">{{ course.title }}</h3>
              <p class="text-xs font-medium text-slate-500 leading-relaxed">{{ course.description }}</p>
            </div>
            <div class="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
               <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">START MISSION</span>
               <i class="fas fa-arrow-right text-[10px] text-indigo-300 transform group-hover:translate-x-2 transition-transform duration-500"></i>
            </div>
          </RouterLink>
        </div>

        <!-- Capstone Banner -->
        <div class="mt-20 rounded-[56px] bg-slate-900 p-16 lg:p-24 flex flex-col lg:flex-row items-center justify-between shadow-2xl relative overflow-hidden group animate-reveal">
          <div class="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:32px_32px] opacity-10"></div>
          <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] transition-transform duration-1000 group-hover:scale-150"></div>
          
          <div class="relative z-10 lg:w-3/5 text-center lg:text-left space-y-8">
            <div class="inline-block px-4 py-1.5 rounded-full bg-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] border border-white/5">
              The Ultimate Capstone
            </div>
            <h3 class="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-tight uppercase">综合实战与<br>产品路演</h3>
            <p class="text-slate-400 text-xl font-medium leading-relaxed max-w-xl">不仅是作业，更是路演。集成所有模块的能力，在真实挑战中定义你的商业价值与社会影响力。</p>
          </div>
          <div class="relative z-10 shrink-0 mt-12 lg:mt-0">
            <RouterLink to="/workspace" class="inline-flex items-center px-12 py-6 bg-indigo-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:bg-white hover:text-slate-900 transition-all hover:scale-105 active:scale-95 group/banner">
              进入终极实战 <i class="fas fa-arrow-right ml-4 transition-transform group-hover/banner:translate-x-2"></i>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-24 border-t border-slate-100 relative z-10 text-center">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
        <div class="flex flex-col md:flex-row justify-between items-center gap-10 border-b border-slate-100 pb-12">
          <div class="flex items-center gap-4 transition-transform hover:scale-105">
            <div class="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <i class="fas fa-cube text-sm"></i>
            </div>
            <div class="flex flex-col text-left">
               <span class="font-black text-slate-900 uppercase tracking-widest text-sm">HAI Tech Lab</span>
               <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">Reopen Innovation Platform</span>
            </div>
          </div>
          <div class="flex gap-10">
            <a v-for="l in ['About', 'Principles', 'Open Source', 'Support']" :key="l" href="#" class="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-widest">{{ l }}</a>
          </div>
        </div>
        <p class="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 HAI Tech Lab | All Rights Reserved</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, loginUser, logout } from '@/api/authApi';

const router = useRouter();
const user = ref(getCurrentUser());
const email = ref('');
const password = ref('');
const loginMsg = ref('');
const loginLoading = ref(false);
const scrolled = ref(false);

const navLinks = [
  { to: '/knowledge', label: '创新库', icon: 'fas fa-book-reader' },
  { to: '/competencies', label: '学术指导', icon: 'fas fa-graduation-cap' },
  { to: '/projects', label: '项目库', icon: 'fas fa-layer-group' },
  { to: '/downloads', label: '资料中心', icon: 'fas fa-folder-open' }
];

const curriculum = [
  { id: '00', title: '学术规范与 PBL', to: '/competencies', description: '掌握项目式学习方法论，通过科学的立项流程重构你的创新思维。', icon: 'fas fa-graduation-cap', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  { id: '01', title: 'Python 交互式编程', to: { path: '/study', query: { project: 'project1' } }, description: '用代码重塑物理交互。在 Vibe Coding 赛道体验“灵感触达”的乐趣。', icon: 'fas fa-code', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
  { id: '02', title: '产品思维与设计', to: { path: '/study', query: { project: 'project2' } }, description: '从痛点洞察到高保真交互。学习如何像产品经理一样定义未来。', icon: 'fas fa-pen-nib', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
  { id: '03', title: '全栈 Web 应用实务', to: { path: '/study', query: { project: 'project3' } }, description: '构建你的数字基地。掌握现代 Web 开发全链路，实现你的网络构想。', icon: 'fas fa-laptop-code', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  { id: '04', title: 'AI 与深度学习入门', to: { path: '/study', query: { project: 'project4' } }, description: '为产品赋予智能。探索神经网络，训练你的第一个专属机器学习模型。', icon: 'fas fa-brain', iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
  { id: '05', title: '开源硬件与物理世界', to: { path: '/study', query: { project: 'project5' } }, description: '打破软硬隔阂。万物互联的真实触碰，构建嵌入式与控制决策系统。', icon: 'fas fa-microchip', iconBg: 'bg-amber-50', iconColor: 'text-amber-500' }
];

const avatarUrl = computed(() => {
  if (!user.value) return '';
  return user.value.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.value.id || 'default'}`;
});

const roleLabel = computed(() => {
  if (!user.value) return '';
  const map = { teacher: 'Lead Mentor', judge: 'Expert Judge' };
  return map[user.value.role] || 'Innovator';
});

async function handleLogin() {
  loginMsg.value = '';
  loginLoading.value = true;
  try {
    const nextUser = await loginUser(email.value, password.value);
    user.value = nextUser;
    const target = (nextUser.role === 'teacher' || nextUser.role === 'judge') ? '/teacher' : '/workspace';
    router.push(target);
  } catch (err) { loginMsg.value = 'Identity verification failed.'; }
  finally { loginLoading.value = false; }
}

function handleLogout() { logout(); user.value = null; email.value = ''; password.value = ''; }
const handleScroll = () => { scrolled.value = window.scrollY > 20; };

onMounted(() => { window.addEventListener('scroll', handleScroll); });
onUnmounted(() => { window.removeEventListener('scroll', handleScroll); });
</script>

<style scoped>
.glass-nav { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-bottom: 1px solid rgba(226, 232, 240, 0.4); }
.premium-card { @apply rounded-[48px] border border-slate-200/60 p-10 shadow-sm transition-all duration-500; }
.animate-reveal { animation: reveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes reveal { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.interactive-grid { background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 32px 32px; }
.btn-primary { @apply px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all; }
</style>
