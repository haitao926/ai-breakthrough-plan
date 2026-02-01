<template>
  <div class="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800">
    <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <RouterLink to="/tools" class="text-gray-400 hover:text-gray-600 transition"><i class="fas fa-arrow-left"></i></RouterLink>
        <h1 class="font-bold text-gray-800 text-lg flex items-center">
          <i class="fas fa-pen-nib text-blue-600 mr-2"></i> 实施日志
        </h1>
      </div>
      <div class="text-xs text-gray-400">记录过程，培养习惯</div>
    </nav>

    <main class="flex-1 max-w-6xl mx-auto w-full p-8 grid lg:grid-cols-[1.1fr_1fr] gap-6">
      <section class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-bold text-gray-900">写一条记录</h2>
            <p class="text-xs text-gray-400">结构化帮助梳理，自由记录更随手。</p>
          </div>
          <div class="flex bg-gray-100 p-1 rounded-lg">
            <button
              class="px-3 py-1 text-xs rounded-md transition"
              :class="mode === 'guided' ? 'bg-white shadow text-gray-900' : 'text-gray-500'"
              @click="mode = 'guided'"
            >结构化</button>
            <button
              class="px-3 py-1 text-xs rounded-md transition"
              :class="mode === 'free' ? 'bg-white shadow text-gray-900' : 'text-gray-500'"
              @click="mode = 'free'"
            >自由记录</button>
          </div>
        </div>

        <div v-if="!projectId" class="text-sm text-red-500">请先选择项目再记录。</div>

        <div v-else class="space-y-4">
          <div v-if="mode === 'guided'" class="space-y-3">
            <div>
              <label class="text-xs font-semibold text-gray-500">本次进展（必填）</label>
              <textarea v-model="form.summary" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="今天完成了什么？"></textarea>
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-500">核心贡献（必填）</label>
              <textarea v-model="form.contribution" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="你负责/贡献了哪些关键部分？"></textarea>
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-500">代码提交（可选）</label>
              <input v-model="form.commit" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Gitea 仓库链接或 commit id" />
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-500">证据链接（可选）</label>
              <input v-model="form.evidence" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="照片 / 演示视频 / 文档链接" />
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-500">流程图/架构图（可选）</label>
              <input v-model="form.diagram" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="链接或说明" />
            </div>
          </div>

          <div v-else>
            <label class="text-xs font-semibold text-gray-500">自由记录</label>
            <textarea v-model="form.free" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" rows="9" placeholder="随手记录想法、问题、阶段成果"></textarea>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-500">标签（可选）</label>
            <input v-model="form.tags" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="例如：代码提交, 实验记录, 需求调整" />
          </div>

          <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

          <div class="flex justify-end">
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition" :disabled="posting" @click="submitLog">
              {{ posting ? '发布中...' : '发布记录' }}
            </button>
          </div>
        </div>
      </section>

      <section class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900">最新记录</h2>
          <button class="text-xs text-gray-500 hover:text-gray-700" @click="loadLogs">刷新</button>
        </div>
        <div v-if="loading" class="text-xs text-gray-400">加载中...</div>
        <div v-else-if="!logs.length" class="text-xs text-gray-400">暂无记录，先写第一条吧。</div>
        <div v-else class="space-y-4">
          <div v-for="log in logs" :key="log.id" class="border border-gray-100 rounded-xl p-4 bg-gray-50">
            <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
              <div class="flex items-center gap-2">
                <img v-if="log.avatar_url" :src="log.avatar_url" class="w-6 h-6 rounded-full" />
                <span>{{ log.author_name || '学生' }}</span>
              </div>
              <span>{{ formatDateTime(log.created_at) }}</span>
            </div>
            <div class="text-sm text-gray-700 whitespace-pre-wrap">{{ log.content }}</div>
            <div v-if="log.tags" class="mt-2 flex flex-wrap gap-2">
              <span v-for="(tag, idx) in splitTags(log.tags)" :key="idx" class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { apiFetch } from '@/api/client';

const route = useRoute();
const projectId = computed(() => route.query.project);

const logs = ref([]);
const loading = ref(false);
const posting = ref(false);
const error = ref('');
const mode = ref('guided');

const form = reactive({
  summary: '',
  contribution: '',
  commit: '',
  evidence: '',
  diagram: '',
  free: '',
  tags: ''
});

function resetForm() {
  form.summary = '';
  form.contribution = '';
  form.commit = '';
  form.evidence = '';
  form.diagram = '';
  form.free = '';
  form.tags = '';
}

function buildContent() {
  if (mode.value === 'free') {
    return String(form.free || '').trim();
  }
  const lines = [];
  if (form.summary) lines.push(`【本次进展】${form.summary}`);
  if (form.contribution) lines.push(`【核心贡献】${form.contribution}`);
  if (form.commit) lines.push(`【代码提交】${form.commit}`);
  if (form.evidence) lines.push(`【证据链接】${form.evidence}`);
  if (form.diagram) lines.push(`【流程图/架构】${form.diagram}`);
  return lines.join('\n');
}

async function loadLogs() {
  if (!projectId.value) return;
  loading.value = true;
  try {
    const res = await apiFetch(`/projects/${projectId.value}/logs`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '加载失败');
    logs.value = Array.isArray(data.logs) ? data.logs : [];
  } catch (err) {
    console.error(err);
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

async function submitLog() {
  error.value = '';
  if (!projectId.value) {
    error.value = '请先选择项目再记录。';
    return;
  }
  if (mode.value === 'guided') {
    if (!String(form.summary || '').trim() || !String(form.contribution || '').trim()) {
      error.value = '请填写进展与贡献。';
      return;
    }
  }
  const content = buildContent();
  if (!content) {
    error.value = mode.value === 'free' ? '请输入记录内容。' : '请至少填写进展与贡献。';
    return;
  }
  posting.value = true;
  try {
    const res = await apiFetch(`/projects/${projectId.value}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, tags: form.tags || '' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '发布失败');
    resetForm();
    await loadLogs();
  } catch (err) {
    error.value = err.message || '发布失败';
  } finally {
    posting.value = false;
  }
}

function splitTags(tags) {
  return String(tags || '')
    .split(/[，,]/)
    .map(tag => tag.trim())
    .filter(Boolean);
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = num => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

onMounted(loadLogs);

watch(
  () => projectId.value,
  () => {
    loadLogs();
  }
);
</script>
