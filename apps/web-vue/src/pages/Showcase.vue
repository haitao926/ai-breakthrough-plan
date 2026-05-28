<template>
  <div class="portal-page text-gray-800 min-h-screen flex flex-col">
    <SiteNav active="showcase" />

    <!-- Main Container -->
    <main class="portal-shell portal-main flex-grow max-w-[1320px] mx-auto px-5 sm:px-6 lg:px-8 pb-16 space-y-16">
      
      <!-- Spotlight Hero Section -->
      <section v-if="featuredStory" class="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-6 sm:p-10 shadow-xl shadow-slate-100/40">
        <!-- Background Ambient Glows -->
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          <!-- Copy Column -->
          <div class="lg:col-span-7 space-y-6">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200/50">
                Spotlight Project
              </span>
              <span class="flex items-center gap-1 text-[10px] font-black text-cyan-600 bg-cyan-50 hover:bg-cyan-100 transition-colors px-2.5 py-1 rounded-full border border-cyan-100/50 cursor-pointer" @click="showPromptLog(featuredStory)">
                <i class="fas fa-magic"></i> HAI Co-Created
              </span>
            </div>
            
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              {{ featuredStory.title }}
            </h1>
            
            <p class="text-sm sm:text-base text-slate-500 font-bold leading-relaxed max-w-2xl">
              {{ featuredStory.summary }}
            </p>
            
            <!-- Metadata & Action Row -->
            <div class="pt-4 flex flex-wrap items-center gap-3 border-t border-slate-100/80">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs font-black text-slate-600">
                  <i class="fas fa-award mr-1.5 text-indigo-500"></i>{{ featuredStory.result }}
                </span>
                <span class="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs font-black text-slate-500">
                  <i class="fas fa-users mr-1.5 text-slate-400"></i>{{ featuredStory.studentLabel }}
                </span>
              </div>
            </div>
          </div>

          <!-- Cover Image Column -->
          <div class="lg:col-span-5">
            <div class="relative group aspect-video sm:aspect-square lg:aspect-auto lg:h-[360px] rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/5 border border-slate-200/40">
              <img 
                :src="featuredStory.cover" 
                :alt="featuredStory.title" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Curated Cases Section -->
      <section class="space-y-6">
        <div class="border-l-4 border-indigo-600 pl-4 py-1">
          <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600">Gallery</p>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">深度孵化案例</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article 
            v-for="story in stories" 
            :key="story.slug" 
            class="group relative rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between"
          >
            <!-- Thumbnail Banner -->
            <div class="relative h-48 overflow-hidden bg-slate-50 border-b border-slate-100">
              <img 
                :src="story.cover" 
                :alt="story.title" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
              />
              <div class="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                <span class="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur text-slate-700 shadow-sm border border-slate-200/20">
                  {{ story.result }}
                </span>
                <span class="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-indigo-600 text-indigo-50 shadow-sm">
                  Curated
                </span>
              </div>
            </div>

            <!-- Content Area -->
            <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>{{ story.studentLabel }}</span>
                <span>•</span>
                <span class="text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1" @click="showPromptLog(story)">
                  <i class="fas fa-magic mr-1"></i>Co-Created
                </span>
              </div>
              <div class="space-y-2">
                <h3 class="text-lg font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                  {{ story.title }}
                </h3>
                <p class="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed line-clamp-3">
                  {{ story.summary }}
                </p>
              </div>
              
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span><i class="far fa-eye mr-1.5"></i>查看实践详情</span>
                <i class="fas fa-arrow-right transition-transform group-hover:translate-x-1"></i>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Student Showcase Wall Section -->
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/50 pb-6">
          <div class="border-l-4 border-indigo-600 pl-4 py-1">
            <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600">Showcase Wall</p>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">学生创意实践墙</h2>
          </div>
          
          <!-- Filter / Search box -->
          <div class="relative w-full sm:w-72">
            <div class="flex items-center gap-2 bg-white/70 backdrop-blur border border-slate-200/80 rounded-xl px-3.5 py-2 hover:border-slate-300 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <i class="fas fa-search text-slate-400 text-xs"></i>
              <input 
                v-model="searchTerm" 
                type="text" 
                placeholder="搜索标题、简介或作者..." 
                class="bg-transparent border-0 outline-none w-full text-xs font-bold text-slate-700 placeholder-slate-400"
              />
              <button v-if="searchTerm" class="text-slate-400 hover:text-slate-600" @click="searchTerm = ''">
                <i class="fas fa-times text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- States -->
        <div v-if="showcaseLoading" class="text-center py-20 bg-white/50 backdrop-blur rounded-2xl border border-slate-200/50 text-slate-400 space-y-2">
          <i class="fas fa-spinner fa-spin text-xl"></i>
          <p class="text-xs font-black">正在加载学生项目作品...</p>
        </div>

        <div v-if="filteredShowcase.length === 0" class="text-center py-20 bg-white/50 backdrop-blur rounded-2xl border border-slate-200/50 text-slate-400 space-y-2">
          <i class="far fa-folder-open text-2xl opacity-60"></i>
          <p class="text-xs font-black">暂无符合条件的项目展示</p>
        </div>

        <!-- Student Cards Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <article 
            v-for="item in filteredShowcase" 
            :key="item.id" 
            class="group relative rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between"
          >
            <!-- Cover image placeholder/loading -->
            <div class="relative h-44 bg-gradient-to-br from-indigo-50/50 to-cyan-50/50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
              <img
                v-if="item.coverUrl"
                :src="item.coverUrl"
                :alt="item.projectTitle"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div v-else class="text-center space-y-1.5 opacity-60">
                <i class="fas fa-shapes text-2xl text-indigo-400/80"></i>
                <p class="text-[10px] font-bold uppercase tracking-widest text-indigo-500">HAI Tech Lab</p>
              </div>
              
              <!-- Badges on cover -->
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded text-xs font-bold bg-white/95 backdrop-blur text-indigo-600 shadow-sm border border-indigo-100/50">
                优秀成果
              </span>
              <span v-if="item.className" class="absolute top-3 right-3 px-2.5 py-1 rounded text-xs font-bold bg-slate-900/90 text-white shadow-sm">
                {{ item.className }}
              </span>
            </div>

            <!-- Body info -->
            <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="text-base font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {{ item.projectTitle }}
                  </h3>
                  <span class="flex items-center justify-center w-5 h-5 rounded bg-cyan-50 text-cyan-600 border border-cyan-200/50 hover:bg-cyan-100 cursor-pointer flex-shrink-0" title="AI Co-Created" @click.stop="showPromptLog({title: item.projectTitle})">
                    <i class="fas fa-magic text-[10px]"></i>
                  </span>
                </div>
                <p class="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed line-clamp-2 h-[40px]">
                  {{ item.projectSummary }}
                </p>
              </div>

              <!-- Footer with author & downloads -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span class="text-slate-500 flex items-center gap-1.5">
                  <i class="far fa-user text-indigo-500"></i>
                  {{ item.studentName }}
                </span>
                
                <div class="flex gap-2">
                  <template v-if="item.attachments && item.attachments.length">
                    <a
                      v-for="att in item.attachments"
                      :key="att.url"
                      :href="att.url"
                      target="_blank"
                      rel="noreferrer"
                      class="px-3 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <i class="fas fa-paperclip text-[10px]"></i>
                      查看成果
                    </a>
                  </template>
                  <span v-else class="text-slate-300 py-1">无附件</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

    </main>

    <!-- Prompt Log Modal Overlay -->
    <div v-if="isPromptModalOpen && activePromptStory" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md transition-opacity" @click.self="isPromptModalOpen = false">
      <div class="bg-white/95 backdrop-blur-2xl rounded-[32px] border border-slate-200/80 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col justify-between animate-reveal">
        <!-- Header -->
        <div class="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
              <i class="fas fa-magic"></i>
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-900">AI 协同探索与提示词优化记录</h3>
              <p class="text-xs text-slate-500 font-bold mt-0.5">项目: {{ activePromptStory.title }}</p>
            </div>
          </div>
          <button class="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center" @click="isPromptModalOpen = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          <!-- Step 1: Input -->
          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">原始自然语言需求 (Original Input)</span>
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600 leading-relaxed italic">
                "{{ getPromptHistory(activePromptStory.title).original }}"
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-[10px] font-black uppercase tracking-widest text-cyan-600">思维链推理过程 (Co-Created CoT)</span>
              <div class="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100/50 space-y-2">
                <div v-for="(step, idx) in getPromptHistory(activePromptStory.title).thinking" :key="idx" class="flex gap-2 text-xs font-bold text-slate-700">
                  <span class="text-cyan-500 shrink-0">✓</span>
                  <span>{{ step }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Optimized Prompt Output -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-widest text-indigo-600">优化后的结构化提示词 (Optimized Prompt)</span>
              <button class="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5" @click="copyText(getPromptHistory(activePromptStory.title).optimized)">
                <i class="far fa-copy"></i> 复制提示词
              </button>
            </div>
            <pre class="p-5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto select-all whitespace-pre-wrap">{{ getPromptHistory(activePromptStory.title).optimized }}</pre>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-[32px]">
          <button class="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-black transition-all" @click="isPromptModalOpen = false">
            关闭窗口
          </button>
        </div>
      </div>
    </div>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import { fetchStories } from '@/api/portal';
import { apiFetch, readJsonResponse } from '@/api/client';

const stories = ref([]);
const showcaseItems = ref([]);
const showcaseLoading = ref(true);
const searchTerm = ref('');

const isPromptModalOpen = ref(false);
const activePromptStory = ref(null);

function showPromptLog(story) {
  activePromptStory.value = story;
  isPromptModalOpen.value = true;
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  alert('提示词已复制到剪贴板，快去您的 AI 工具里体验吧！');
}

function getPromptHistory(title) {
  const normTitle = String(title || '');
  // Custom mock data based on title keywords to make it look realistic!
  if (normTitle.includes('车') || normTitle.includes('避障') || normTitle.includes('循迹')) {
    return {
      original: '我想做个循迹避障智能小车，用ESP32，加超声波和红外循迹模块。',
      thinking: [
        '分析小车运作逻辑: 循迹任务要求极高的低延时轮询，避障任务则需持续监控前方障碍。',
        '系统架构设计: ESP32拥有双核。Core 0 用于处理红外传感器采样与控制，以保持10ms的环路响应；Core 1 负责超声波测距与逻辑干预。',
        '安全与防抖过滤: 超声波距离传感器可能出现突发噪点，需设计中值滤波器进行防抖，并在突发阻碍时触发硬中断。',
        'PID参数注入: 提示词中应要求提供双侧电机的微分差值PID代码骨架，并规范接线IO引脚分配。'
      ],
      optimized: `我需要设计一个基于 ESP32 控制芯片的智能循迹避障小车。请为我编写一份完整的 Arduino IDE C++ 代码，满足以下技术要求：\n\n1. 系统架构与多任务：\n   - 使用 FreeRTOS，将三路红外循迹模块的采样及 PID 电机调节任务分配至 Core 0 运行，任务执行周期为 10ms。\n   - 将超声波测距避障及路径决策分配至 Core 1 运行，周期为 50ms。\n2. 传感器防抖：\n   - 对超声波的测距数据应用中值滤波（滑动窗口大小为5次采样），消除尖峰噪点干扰。\n3. PID 纠偏算法：\n   - 实现增量式 PID 控制算法，依据红外传感器状态计算偏离度，动态微调左右电机 PWM 脉宽。\n4. 安全避障策略：\n   - 当超声波距离低于 15cm 时，进入刹车保护状态，小车后退 300ms 后原地打转 45 度继续行进。\n5. 交付结构：\n   - 提供完整的 IO 引脚配置表（GPIO32/33/25 输入，Trig/Echo 分别为 26/27）。\n   - 所有的函数和关键逻辑必须附带中文注释。`
    };
  } else if (normTitle.includes('农') || normTitle.includes('温室') || normTitle.includes('水')) {
    return {
      original: '做一个智能温室花房，自动浇水，有温湿度传感器和电磁阀，还要联网看数据。',
      thinking: [
        '识别核心模块: 主控芯片、DHT11温湿度传感器、土壤湿度探针、水泵继电器、ESP32-WiFi与MQTT连接。',
        '分析交互逻辑: 自动控制环路（土壤干旱自动浇水）与云端网络监控需要隔离，防止Wi-Fi重连阻塞本地主回路。',
        '约束条件: 浇水必须有最大单次时长和冷却时间限制，防止土壤传感器损坏导致持续浇水引发灾难。',
        '提示词扩充: 明确要求输出非阻塞定时器（millis()）、MQTT心跳包结构以及自动防灾水泵限制逻辑。'
      ],
      optimized: `我正在使用 ESP32 制作一个智能温室大棚灌溉系统。请帮我编写一份非阻塞式控制代码（Arduino/C++），包含以下架构设计：\n\n1. 硬件引脚分配：\n   - DHT11 温湿度传感器接 GPIO15；土壤湿度传感器（模拟量）接 ADC 端口 GPIO34；水泵继电器接 GPIO16。\n2. 自动控制与安全防灾逻辑：\n   - 每 5 秒读取一次土壤湿度。当湿度低于 30% 且距离上次浇水超过 1 小时（冷却时间），启动水泵继电器。\n   - **硬性约束**：每次灌溉最长不超过 10 秒，超时立即强行关闭水泵，并输出错误标志，防止溢水灾害。\n3. 联网与非阻塞交互：\n   - 使用 WiFiClient 和 PubSubClient (MQTT) 将温湿度和土壤湿度数据发布至主题 "/greenhouse/sensors"。\n   - 采用非阻塞式定时器（使用 millis() 代替 delay()），确保在等待 Wi-Fi 自动重连时，本地温控与自动浇水逻辑仍能正常工作。\n4. 代码交付：提供详细的接线指南、非阻塞网络重连函数以及全部中文注释。`
    };
  } else {
    // Default mock data for general sci-tech tasks
    return {
      original: `帮我设计一个关于 "${title}" 的 AI 辅助解决方案，要包含硬件选型和关键控制逻辑代码。`,
      thinking: [
        `目标：为项目「${title}」构思 AI 协同和工程实践框架。`,
        '分析：由于是定制项目，需要先引导学生确定具体的输入、处理和输出（IPO）三要素。',
        '优化建议：补充基于 K12 初学者视角的硬件选型推荐，并设计出符合工程思维的非阻塞循环代码结构框架。',
        '细节约束：确保提示词中包含异常处理机制及调试日志的输出规范。'
      ],
      optimized: `我正在开展一项名为 "${title}" 的科技创新项目。请扮演我的 AI 导师，为我生成一份项目开发脚手架和核心控制代码，技术规格如下：\n\n1. 系统 IPO 架构定义：\n   - 输入 (Input)：定义传感器和用户操作源，阐述其信号类型（模拟/数字/I2C）。\n   - 处理 (Process)：主控芯片建议选择 Arduino Nano 或 ESP32，描述处理流程和主状态机。\n   - 输出 (Output)：包括动作执行机构（舵机/马达/蜂鸣器/显示屏）的控制响应。\n2. 核心代码（C++ / MicroPython）：\n   - 编写一段结构化、带完整中文注释的控制框架。\n   - 必须使用非阻塞逻辑（例如毫秒计时器）处理多任务，并在串口持续输出传感器读取状态以方便调试。\n3. 异常防御：\n   - 针对传感器断线或数据漂移，设计基本的越界异常检查与安全保护状态机制。\n4. 代码输出：包含简要的硬件接线示意图。`
    };
  }
}

const featuredStory = computed(() => stories.value.find(item => item.featured) || stories.value[0] || null);

const filteredShowcase = computed(() => {
  const items = showcaseItems.value;
  const q = searchTerm.value.trim().toLowerCase();
  if (!q) return items;
  return items.filter(item => {
    const haystack = [
      item.projectTitle,
      item.projectSummary,
      item.studentName,
      item.className
    ].filter(Boolean).map(v => String(v).toLowerCase()).join(' ');
    return haystack.includes(q);
  });
});

function isImage(filename) {
  return /\.(png|jpe?g|webp|gif)$/i.test(filename || '');
}

async function loadShowcase() {
  showcaseLoading.value = true;
  try {
    const res = await apiFetch('/showcase');
    const data = await readJsonResponse(res, 'showcase');
    if (!res.ok) throw new Error(data?.error || 'showcase_failed');
    const items = data.items || [];
    showcaseItems.value = items.map(item => {
      const coverAttachment = (item.showcase?.attachments || []).find(att => isImage(att.name));
      return {
        id: item.showcase?.id || item.project?.id,
        projectTitle: item.project?.title || item.showcase?.title,
        projectSummary: item.project?.summary || item.showcase?.content || '暂无项目介绍。',
        className: item.project?.class_name || '',
        studentName: item.showcase?.details?.studentName || item.project?.team_members || '匿名',
        coverUrl: coverAttachment ? coverAttachment.url : null,
        attachments: item.showcase?.attachments || []
      };
    });
  } catch (err) {
    console.error(err);
    showcaseItems.value = [];
  } finally {
    showcaseLoading.value = false;
  }
}

onMounted(async () => {
  try {
    const data = await fetchStories();
    stories.value = data || [];
  } catch (e) {
    console.error(e);
  }
  await loadShowcase();
});
</script>

<style scoped>
.portal-page {
  background: 
    linear-gradient(180deg, rgba(238, 242, 255, 0.9), rgba(248, 250, 252, 0.2) 320px),
    #f8fafc;
  min-height: 100vh;
}
</style>
