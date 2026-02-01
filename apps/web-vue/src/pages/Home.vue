<template>
  <div class="home-page text-gray-800 scroll-smooth">
    <!-- 导航栏 -->
    <nav class="fixed w-full z-50 glass-nav transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-3 shrink-0">
            <RouterLink to="/" class="flex items-center gap-2 group">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm transition group-hover:bg-indigo-700">
                <i class="fas fa-cube"></i>
              </div>
              <span class="font-bold text-xl tracking-tight text-gray-900">AI 破壁计划</span>
            </RouterLink>
          </div>

          <div class="hidden md:flex items-center space-x-1">
            <RouterLink to="/knowledge" class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center">
              <i class="fas fa-book-reader mr-2 text-xs"></i>创新知识库
            </RouterLink>
            <RouterLink to="/competencies" class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center">
              <i class="fas fa-graduation-cap mr-2 text-xs"></i>学术指导
            </RouterLink>
            <RouterLink to="/projects" class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center">
              <i class="fas fa-layer-group mr-2 text-xs"></i>项目库
            </RouterLink>
            <RouterLink to="/downloads" class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center">
              <i class="fas fa-folder-open mr-2 text-xs"></i>课程资料库
            </RouterLink>
          </div>

          <div class="flex gap-3 items-center shrink-0">
            <template v-if="user">
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-gray-700 hidden md:block">{{ user.name || user.email }}</span>
                <img :src="avatarUrl" class="w-8 h-8 rounded-full border border-gray-200" />
              </div>
            </template>
            <template v-else>
              <a href="#auth-card" class="text-sm font-bold text-indigo-600 hover:text-indigo-800">登录</a>
              <a href="#auth-card" class="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm">开始</a>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero 区域 -->
    <section class="hero-section pt-32 pb-24 border-b border-gray-200">
      <div class="hero-pattern"></div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="flex flex-col lg:flex-row items-center gap-12">
          <div class="lg:w-1/2 text-center lg:text-left">
            <div class="inline-block px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold mb-6 tracking-wide">
              2025-2026 学年 · 七年级科创课程
            </div>
            <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight text-gray-900">
              从创意到原型<br>
              <span class="text-indigo-600">打造你的智能产品</span>
            </h1>
            <p class="mt-4 text-lg text-gray-600 leading-relaxed mb-8">
              这里不仅是学习编程的地方，更是你的初创孵化器。
              结合 AI 技术、硬件开发与产品思维，解决真实世界的问题。
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <template v-if="user">
                <RouterLink to="/workspace" class="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition flex items-center justify-center">
                  <i class="fas fa-rocket mr-2"></i> 进入工作台
                </RouterLink>
                <RouterLink to="/projects" class="px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition flex items-center justify-center">
                  <i class="fas fa-folder-open mr-2"></i> 查看我的项目
                </RouterLink>
              </template>
              <template v-else>
                <a href="#curriculum" class="px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition flex items-center justify-center">
                  <i class="fas fa-book-open mr-2"></i> 浏览课程
                </a>
                <RouterLink to="/showcase" class="px-8 py-3 bg-transparent text-indigo-600 font-bold hover:underline transition flex items-center justify-center">
                  查看往届作品 <i class="fas fa-arrow-right ml-2"></i>
                </RouterLink>
              </template>
            </div>
          </div>

          <div class="lg:w-1/2 w-full max-w-md">
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden" id="auth-card">
              <template v-if="user">
                <div class="text-center py-4">
                  <img :src="avatarUrl" class="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-indigo-50">
                  <h2 class="text-xl font-bold text-gray-900">欢迎回来，{{ user.name || user.email }}</h2>
                  <p class="text-indigo-600 font-medium mt-1 text-sm">{{ roleLabel }}</p>

                  <div class="mt-8 space-y-3">
                    <RouterLink to="/workspace" class="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-md">
                      继续我的项目
                    </RouterLink>
                    <button @click="handleLogout" class="block w-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 font-medium py-3 rounded-xl transition">
                      退出登录
                    </button>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="mb-6">
                  <h2 class="text-2xl font-bold text-gray-900">账号登录</h2>
                  <p class="text-gray-500 text-sm mt-1">使用老师分发的账号进入平台</p>
                </div>
                <form class="space-y-4" @submit.prevent="handleLogin">
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">账号 / 邮箱</label>
                    <input v-model.trim="email" type="text" required class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50 focus:bg-white" placeholder="输入你的账号">
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">密码</label>
                    <input v-model.trim="password" type="password" required class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50 focus:bg-white" placeholder="••••••">
                  </div>
                  <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition transform active:scale-95 mt-2" :disabled="loginLoading">
                    {{ loginLoading ? '验证中...' : '立即进入' }}
                  </button>
                  <p class="text-center text-sm text-red-500 mt-2 min-h-[1.25em]">{{ loginMsg }}</p>
                </form>
                <div class="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
                  忘记密码？请联系任课老师重置
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 课程体系 (Grid) -->
    <section id="curriculum" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900">课程技能树</h2>
          <p class="mt-3 text-gray-500">五大核心模块 + 终极实战，构建完整的科创能力。</p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <RouterLink to="/competencies" class="course-card group bg-white rounded-xl overflow-hidden block">
            <div class="h-32 bg-gray-50 border-b border-gray-100 flex items-center justify-center relative">
              <i class="fas fa-graduation-cap text-4xl text-gray-300 group-hover:text-indigo-500 transition-colors"></i>
              <span class="absolute top-3 right-3 text-xs font-bold text-gray-400">必修 00</span>
            </div>
            <div class="p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">通识与学术规范</h3>
              <p class="text-sm text-gray-500">掌握项目式学习(PBL)方法论，学会如何做研究、写报告。</p>
            </div>
          </RouterLink>

          <RouterLink to="/study" class="course-card group bg-white rounded-xl overflow-hidden block">
            <div class="h-32 bg-blue-50 border-b border-blue-100 flex items-center justify-center relative">
              <i class="fas fa-gamepad text-4xl text-blue-300 group-hover:text-blue-500 transition-colors"></i>
              <span class="absolute top-3 right-3 text-xs font-bold text-blue-400">必修 01</span>
            </div>
            <div class="p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Vibe Coding 编程</h3>
              <p class="text-sm text-gray-500">通过体感游戏开发入门 Python，体验代码控制互动的乐趣。</p>
            </div>
          </RouterLink>

          <RouterLink :to="{ path: '/study', query: { project: 'project2' } }" class="course-card group bg-white rounded-xl overflow-hidden block">
            <div class="h-32 bg-purple-50 border-b border-purple-100 flex items-center justify-center relative">
              <i class="fas fa-pen-nib text-4xl text-purple-300 group-hover:text-purple-500 transition-colors"></i>
              <span class="absolute top-3 right-3 text-xs font-bold text-purple-400">必修 02</span>
            </div>
            <div class="p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">产品设计思维</h3>
              <p class="text-sm text-gray-500">像产品经理一样思考。学习用户调研、需求分析与原型绘制。</p>
            </div>
          </RouterLink>

          <RouterLink :to="{ path: '/study', query: { project: 'project3' } }" class="course-card group bg-white rounded-xl overflow-hidden block">
            <div class="h-32 bg-green-50 border-b border-green-100 flex items-center justify-center relative">
              <i class="fas fa-code text-4xl text-green-300 group-hover:text-green-500 transition-colors"></i>
              <span class="absolute top-3 right-3 text-xs font-bold text-green-400">必修 03</span>
            </div>
            <div class="p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Web 全栈开发</h3>
              <p class="text-sm text-gray-500">构建你的第一个网站。掌握 HTML/JS 基础与后端交互逻辑。</p>
            </div>
          </RouterLink>

          <RouterLink :to="{ path: '/study', query: { project: 'project4' } }" class="course-card group bg-white rounded-xl overflow-hidden block">
            <div class="h-32 bg-red-50 border-b border-red-100 flex items-center justify-center relative">
              <i class="fas fa-brain text-4xl text-red-300 group-hover:text-red-500 transition-colors"></i>
              <span class="absolute top-3 right-3 text-xs font-bold text-red-400">必修 04</span>
            </div>
            <div class="p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">人工智能基础</h3>
              <p class="text-sm text-gray-500">训练自己的 AI 模型。了解神经网络，解决图像分类问题。</p>
            </div>
          </RouterLink>

          <RouterLink :to="{ path: '/study', query: { project: 'project5' } }" class="course-card group bg-white rounded-xl overflow-hidden block">
            <div class="h-32 bg-amber-50 border-b border-amber-100 flex items-center justify-center relative">
              <i class="fas fa-microchip text-4xl text-amber-300 group-hover:text-amber-500 transition-colors"></i>
              <span class="absolute top-3 right-3 text-xs font-bold text-amber-400">必修 05</span>
            </div>
            <div class="p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">开源硬件与 IoT</h3>
              <p class="text-sm text-gray-500">连接物理世界。使用传感器与控制器，制作智能实物。</p>
            </div>
          </RouterLink>
        </div>

        <div class="mt-12 rounded-2xl bg-indigo-900 text-white p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
          <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-10"></div>
          <div class="relative z-10 md:w-2/3">
            <div class="text-indigo-300 font-bold uppercase tracking-wider text-sm mb-2">Final Capstone</div>
            <h3 class="text-3xl font-bold mb-4">综合创业实战</h3>
            <p class="text-indigo-100 text-lg">不再是练习。组建团队，自主选题，从 0 到 1 孵化一个属于你们的真实产品，并参与期末路演。</p>
          </div>
          <div class="relative z-10 mt-6 md:mt-0">
            <RouterLink to="/workspace" class="inline-flex items-center px-6 py-3 bg-white text-indigo-900 rounded-lg font-bold shadow-lg hover:bg-indigo-50 transition transform hover:-translate-y-1">
              进入实战工作台 <i class="fas fa-arrow-right ml-2"></i>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, loginUser, logout } from '@/api/authApi';

const router = useRouter();
const user = ref(getCurrentUser());
const email = ref('');
const password = ref('');
const loginMsg = ref('');
const loginLoading = ref(false);

const avatarUrl = computed(() => {
  if (!user.value) return '';
  return user.value.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.value.id}`;
});

const roleLabel = computed(() => {
  if (!user.value) return '';
  return user.value.role === 'teacher' ? '老师' : user.value.role === 'judge' ? '评委' : '同学';
});

async function handleLogin() {
  loginMsg.value = '';
  loginLoading.value = true;
  try {
    const nextUser = await loginUser(email.value, password.value);
    user.value = nextUser;
    const target = (nextUser.role === 'teacher' || nextUser.role === 'judge') ? '/teacher' : '/workspace';
    router.push(target);
  } catch (err) {
    loginMsg.value = '登录失败：' + (err?.message || '账号或密码错误');
  } finally {
    loginLoading.value = false;
  }
}

function handleLogout() {
  logout();
  user.value = null;
  email.value = '';
  password.value = '';
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #1e293b; }

.glass-nav {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.course-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e2e8f0;
}
.course-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: #c7d2fe;
}

.hero-section {
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  position: relative;
  overflow: hidden;
}
.hero-pattern {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.3;
}
</style>
