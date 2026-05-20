<template>
  <div class="flex h-full flex-col border-l border-slate-200/60 bg-slate-900 text-slate-100 shadow-2xl xl:w-[45%] shrink-0">
    <!-- Header Control Bar -->
    <div class="flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950 px-6">
      <div class="flex items-center gap-3">
        <!-- Control dots -->
        <div class="flex gap-1.5">
          <div class="h-3 w-3 rounded-full bg-rose-500"></div>
          <div class="h-3 w-3 rounded-full bg-amber-500"></div>
          <div class="h-3 w-3 rounded-full bg-emerald-500"></div>
        </div>
        <span class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Interactive Workbench</span>
      </div>

      <!-- Tab Selectors -->
      <div class="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
        <button
          @click="activeTab = 'ai'"
          class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition"
          :class="activeTab === 'ai' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
        >
          <i class="fas fa-robot"></i>
          AI Copilot
        </button>
        <button
          @click="activeTab = 'sandbox'"
          class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition"
          :class="activeTab === 'sandbox' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
        >
          <i class="fas fa-code"></i>
          Sandbox
        </button>
      </div>
    </div>

    <!-- Tab 1: AI Study Copilot -->
    <div v-if="activeTab === 'ai'" class="flex flex-1 flex-col overflow-hidden">
      <!-- Chat Message Thread -->
      <div ref="chatScroll" class="flex-1 overflow-y-auto p-6 space-y-4">
        <!-- Default Welcome Message -->
        <div class="flex gap-3">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <i class="fas fa-robot"></i>
          </div>
          <div class="rounded-2xl bg-slate-800/80 px-4 py-3 text-sm leading-7 text-slate-300 max-w-[85%]">
            <span class="font-bold text-white block mb-1">AI 伴读助教小破：</span>
            同学你好！我是你的 AI 伴读助手。本节课我们学习的是《{{ lessonTitle }}》。如果有任何不懂的概念、代码报错，或者写不出代码，随时在下方发消息问我，我会用最通俗易懂的例子向你解释！
          </div>
        </div>

        <!-- Chat History -->
        <div
          v-for="(msg, idx) in chatMessages"
          :key="idx"
          class="flex gap-3"
          :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
        >
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
            :class="msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-600'"
          >
            <i class="fas" :class="msg.role === 'user' ? 'fa-user' : 'fa-robot'"></i>
          </div>
          <div
            class="rounded-2xl px-4 py-3 text-sm leading-7 max-w-[85%] whitespace-pre-wrap"
            :class="msg.role === 'user' ? 'bg-indigo-900/40 text-slate-200 border border-indigo-500/20' : 'bg-slate-800/80 text-slate-300'"
          >
            <span class="font-bold text-white block mb-1">
              {{ msg.role === 'user' ? '你：' : 'AI 助教：' }}
            </span>
            {{ msg.content }}
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="aiLoading" class="flex gap-3">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <i class="fas fa-robot"></i>
          </div>
          <div class="rounded-2xl bg-slate-800/80 px-4 py-3 text-sm text-slate-400">
            <i class="fas fa-spinner fa-spin mr-2"></i> 正在思考中...
          </div>
        </div>
      </div>

      <!-- Chat Input Area -->
      <form @submit.prevent="sendChatMessage" class="border-t border-slate-800 bg-slate-950 p-4">
        <div class="flex gap-3">
          <input
            v-model="userInput"
            type="text"
            placeholder="输入代码问题、逻辑疑问..."
            class="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            :disabled="aiLoading"
          />
          <button
            type="submit"
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition"
            :disabled="aiLoading || !userInput.trim()"
          >
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
        <p class="mt-2 text-[10px] text-center text-slate-600 uppercase tracking-widest font-black">
          Powered by Gemini / OpenAI Local API Key
        </p>
      </form>
    </div>

    <!-- Tab 2: Web Live Sandbox -->
    <div v-else class="flex flex-1 flex-col overflow-hidden bg-slate-950">
      <!-- Split pane: Code Editor (Top) & Preview Iframe (Bottom) -->
      <div class="flex flex-1 flex-col overflow-hidden p-6 space-y-4">
        
        <!-- Code Editor Area -->
        <div class="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
          <div class="flex h-10 items-center justify-between bg-slate-950 px-4 border-b border-slate-800">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-500">HTML / JS Editor</span>
            <button
              @click="runCode"
              class="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-black shadow transition active:scale-95"
            >
              <i class="fas fa-play"></i>
              Run Code
            </button>
          </div>
          <textarea
            v-model="sandboxCode"
            placeholder="<!-- 在这里输入或粘贴你的 HTML/JS 代码，然后点击右上角的 Run Code -->"
            class="flex-1 w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 border-none outline-none resize-none focus:ring-0"
          ></textarea>
        </div>

        <!-- Real-time Preview Pane -->
        <div class="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-white overflow-hidden shadow-lg">
          <div class="flex h-10 items-center bg-slate-100 px-4 border-b border-slate-200">
            <div class="flex gap-1.5 mr-3">
              <div class="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
              <div class="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
              <div class="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Live Render Output</span>
          </div>
          <!-- Target render iframe -->
          <iframe
            ref="previewFrame"
            class="flex-1 w-full bg-white"
            sandbox="allow-scripts allow-modals allow-same-origin"
          ></iframe>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { apiFetch } from '@/api/client';

const props = defineProps({
  lessonTitle: {
    type: String,
    required: true
  },
  lessonDescription: {
    type: String,
    default: ''
  },
  lessonId: {
    type: String,
    required: true
  },
  courseId: {
    type: String,
    required: true
  }
});

const activeTab = ref('ai');
const userInput = ref('');
const aiLoading = ref(false);
const chatMessages = ref([]);
const chatScroll = ref(null);

const sandboxCode = ref(`<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f1f5f9;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div>
    <h2>🛠️ Web 沙盒已就绪</h2>
    <p>修改上方的代码，点击 <b>Run Code</b> 实时渲染查看反馈！</p>
  </div>
</body>
</html>`);

const previewFrame = ref(null);

// Execute Code in the Iframe
function runCode() {
  const iframe = previewFrame.value;
  if (!iframe) return;
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(sandboxCode.value);
  doc.close();
}

// Send Message to AI Copilot
async function sendChatMessage() {
  const prompt = userInput.value.trim();
  if (!prompt || aiLoading.value) return;

  chatMessages.value.push({ role: 'user', content: prompt });
  userInput.value = '';
  aiLoading.value = true;
  scrollToBottom();

  try {
    // Construct pedagogical context for the conversation
    const systemPrompt = `你是一个温暖、专业、擅长比喻的初中科创AI伴读助教“小破”。
当前课程信息：
- 课时标题：${props.lessonTitle}
- 课时说明：${props.lessonDescription || '无说明'}
- 课时代码：${props.lessonId}
- 课程ID：${props.courseId}

请使用通俗、亲切（适合12岁初一学生）、清晰结构化的中文来回答问题。
如果是代码错误，请温柔地指出，并用日常比喻（例如将数据比作水流）来解释原理，并给出一个修改示范。
不要直接提供现成作业答案，而是引导学生思考。回答保持在250字以内。`;

    // Map conversation logs to API messages format
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...chatMessages.value.slice(-6) // Keep last 3 turns
    ];

    const response = await apiFetch('/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'AI 伴读发生故障');

    chatMessages.value.push({ role: 'assistant', content: data.reply || 'AI 暂未返回消息' });
  } catch (err) {
    chatMessages.value.push({
      role: 'assistant',
      content: `⚠️ AI 服务异常：${err.message || '网络连接失败'}。请检查右上角个人中心是否正确配置了 AI Model API Key。`
    });
  } finally {
    aiLoading.value = false;
    scrollToBottom();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatScroll.value) {
      chatScroll.value.scrollTop = chatScroll.value.scrollHeight;
    }
  });
}
</script>
