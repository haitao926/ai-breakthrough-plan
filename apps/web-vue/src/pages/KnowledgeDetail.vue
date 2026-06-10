<template>
  <div
    class="knowledge-detail-page text-slate-800"
    :style="{
      '--field-color': fieldColor.text,
      '--field-bg': fieldColor.bg,
      '--field-ink': fieldColor.ink,
      '--field-glow': fieldColor.glow,
      '--field-line': fieldColor.line,
      '--field-soft': fieldColor.soft
    }"
  >
    <SiteNav active="knowledge" />

    <main class="kb-detail-shell">
      <section v-if="loading" class="kb-detail-main">
        <div class="kb-panel kb-empty-state">正在加载知识探索页...</div>
      </section>

      <section v-else-if="error" class="kb-detail-main">
        <div class="kb-panel kb-empty-state">
          <p class="knowledge-kicker">Knowledge Missing</p>
          <h1>没有找到这个知识方向</h1>
          <p>{{ error }}</p>
          <RouterLink class="kb-primary-link" to="/knowledge">返回创新知识库</RouterLink>
        </div>
      </section>

      <template v-else>
        <section class="kb-detail-main">
          <RouterLink class="kb-back-link" to="/knowledge">
            <i class="fas fa-arrow-left"></i> 返回创新知识库
          </RouterLink>

          <article v-if="learningUnit" class="kb-learning-unit">
            <header class="kb-learning-unit__header">
              <div>
                <p class="knowledge-kicker">{{ categoryLabel(categoryKey(discipline)) }} · Video Challenge</p>
                <h2>{{ learningUnit.title }}</h2>
                <p>{{ learningUnit.summary }}</p>
              </div>
              <span class="kb-learning-unit__status" :class="{ 'is-complete': completed }">
                {{ completed ? '已完成' : `${learningUnit.durationMinutes || 10} 分钟` }}
              </span>
            </header>

            <div class="kb-video">
              <iframe
                v-if="activeEmbedUrl"
                :src="activeEmbedUrl"
                title="Bilibili Crash Course video"
                allowfullscreen
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              ></iframe>
              <div v-else class="kb-video-fallback">
                <div>
                  <strong>这个视频暂时无法嵌入</strong>
                  <p>可以先打开 Bilibili 外链观看，再回来完成挑战。</p>
                  <a :href="learningUnit.source?.url" target="_blank" rel="noreferrer">在 Bilibili 打开</a>
                </div>
              </div>
            </div>

            <div class="kb-episode-controls" v-if="seriesVideos.length">
              <button type="button" :disabled="!previousVideo" @click="selectAdjacentVideo(-1)">
                <i class="fas fa-arrow-left"></i>
                上一集
              </button>
              <div>
                <span>{{ activeVideoPosition }}</span>
                <strong>{{ activeVideoTitle || learningUnit.source?.title || '推荐视频' }}</strong>
              </div>
              <button type="button" :disabled="!nextVideo" @click="selectAdjacentVideo(1)">
                下一集
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>

            <section v-if="seriesVideos.length" class="kb-series-playlist">
              <div class="kb-section-heading">
                <div>
                  <p class="knowledge-kicker">Crash Course Series</p>
                  <h2>{{ seriesTitle }}</h2>
                </div>
                <a v-if="seriesSourceUrl" :href="seriesSourceUrl" target="_blank" rel="noreferrer">
                  查看原收藏夹 <i class="fas fa-up-right-from-square"></i>
                </a>
              </div>
              <div class="kb-series-list">
                <button
                  v-for="video in seriesVideos"
                  :key="video.id || video.bvid"
                  type="button"
                  class="kb-series-item"
                  :class="{ 'is-active': videoKey(activeVideo) === videoKey(video) }"
                  @click="selectVideo(video)"
                >
                  <span>{{ video.episode || '视频' }}</span>
                  <strong>{{ video.title }}</strong>
                  <em>{{ video.durationMinutes ? `${video.durationMinutes} 分钟` : 'Crash Course' }}</em>
                </button>
              </div>
            </section>

            <div class="kb-source-note">
              <div>
                <strong>{{ activeVideoTitle || learningUnit.source?.title || '推荐视频' }}</strong>
                <p>{{ learningUnit.source?.note || '看完视频后完成下面的挑战题。' }}</p>
              </div>
              <a v-if="activeVideoUrl" :href="activeVideoUrl" target="_blank" rel="noreferrer">
                外链观看 <i class="fas fa-up-right-from-square"></i>
              </a>
            </div>

            <section class="kb-quiz">
              <div class="kb-section-heading">
                <p class="knowledge-kicker">Quest Check</p>
                <h2>看完挑战</h2>
                <span>{{ score }} / {{ learningUnit.questions?.length || 0 }} 正确</span>
              </div>

              <div v-if="activeQuestion" class="kb-quiz-carousel">
                <button type="button" class="kb-quiz-nav" :disabled="activeQuestionIndex === 0" @click="goQuestion(-1)">
                  <i class="fas fa-chevron-left"></i>
                </button>

                <article
                  class="kb-quiz-question"
                  tabindex="0"
                  @touchstart.passive="onQuestionTouchStart"
                  @touchend.passive="onQuestionTouchEnd"
                  @keydown.left.prevent="goQuestion(-1)"
                  @keydown.right.prevent="goQuestion(1)"
                >
                  <div class="kb-quiz-progress">
                    <span>第 {{ activeQuestionIndex + 1 }} / {{ questionCount }} 题</span>
                    <div>
                      <i
                        v-for="(question, index) in learningUnit.questions"
                        :key="question.id"
                        :class="{
                          'is-active': index === activeQuestionIndex,
                          'is-answered': answers[question.id] !== undefined
                        }"
                      ></i>
                    </div>
                  </div>
                  <h3>{{ activeQuestionIndex + 1 }}. {{ activeQuestion.prompt }}</h3>
                  <div class="kb-quiz-options">
                    <button
                      v-for="(option, optionIndex) in activeQuestion.options"
                      :key="option"
                      type="button"
                      class="kb-quiz-option"
                      :class="optionClass(activeQuestion, optionIndex)"
                      @click="selectAnswer(activeQuestion.id, optionIndex)"
                    >
                      {{ option }}
                    </button>
                  </div>
                  <p v-if="answers[activeQuestion.id] !== undefined" class="kb-quiz-explanation">
                    {{ activeQuestion.explanation }}
                  </p>
                </article>

                <button type="button" class="kb-quiz-nav" :disabled="activeQuestionIndex >= questionCount - 1" @click="goQuestion(1)">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>

              <div class="kb-quiz-mobile-controls" v-if="questionCount > 1">
                <button type="button" :disabled="activeQuestionIndex === 0" @click="goQuestion(-1)">上一题</button>
                <button type="button" :disabled="activeQuestionIndex >= questionCount - 1" @click="goQuestion(1)">下一题</button>
              </div>

              <div class="kb-quiz-dots" v-if="questionCount > 1">
                <button
                  v-for="(question, index) in learningUnit.questions"
                  :key="question.id"
                  type="button"
                  :class="{
                    'is-active': index === activeQuestionIndex,
                    'is-answered': answers[question.id] !== undefined
                  }"
                  @click="activeQuestionIndex = index"
                >
                  {{ index + 1 }}
                </button>
              </div>
            </section>

            <section class="kb-points" :class="{ 'is-awarded': justAwarded }">
              <div>
                <span>{{ completed ? '已计入你的知识积分' : '完成挑战后获得积分' }}</span>
                <strong>+{{ totalAvailablePoints }}</strong>
                <p v-if="completed" class="kb-rank-change">当前探索记录已保存，可以继续看下一集或进入项目。</p>
                <p v-else-if="quizMessage" class="kb-quiz-message">{{ quizMessage }}</p>
                <p v-else>答对至少 {{ passingScore }} 题即可获得积分。</p>
              </div>
              <button type="button" :disabled="!canSubmit || completed" @click="submitChallenge">
                {{ completed ? '已经完成' : '提交挑战' }}
              </button>
            </section>
          </article>

          <article v-else class="kb-panel">
            <p class="knowledge-kicker">Coming Soon</p>
            <h2>这个方向的学习挑战正在整理</h2>
            <p>你仍然可以先从下面的研究问题和项目切口开始探索。</p>
          </article>

          <section class="kb-study-summary">
            <article class="kb-study-summary-card">
              <p class="knowledge-kicker">Learning Status</p>
              <strong>{{ profile.totalPoints }} 分</strong>
              <span>{{ completed ? '本方向挑战已完成' : `完成挑战可获得 ${totalAvailablePoints} 分` }}</span>
            </article>
            <article class="kb-study-summary-card">
              <p class="knowledge-kicker">Current Episode</p>
              <strong>{{ activeVideoPosition }}</strong>
              <span>{{ activeVideoTitle || learningUnit?.source?.title || '推荐视频' }}</span>
            </article>
          </section>

          <section class="kb-explore-grid">
            <article v-if="discipline.research_questions?.length" class="kb-panel">
              <div class="kb-section-heading">
                <p class="knowledge-kicker">Research Questions</p>
                <h2>研究问题</h2>
              </div>
              <div class="kb-question-list">
                <div v-for="item in discipline.research_questions" :key="item.q" class="kb-question-card">
                  <strong>{{ item.q }}</strong>
                  <p>{{ item.context }}</p>
                </div>
              </div>
            </article>

            <article v-if="discipline.key_concepts?.length" class="kb-panel">
              <div class="kb-section-heading">
                <p class="knowledge-kicker">Concepts</p>
                <h2>关键概念</h2>
              </div>
              <div class="kb-concept-list">
                <div v-for="item in discipline.key_concepts" :key="item.term" class="kb-concept-card">
                  <strong>{{ item.term }}</strong>
                  <p>{{ item.def }}</p>
                </div>
              </div>
            </article>
          </section>

          <section class="kb-next-section">
            <div class="kb-section-heading">
              <p class="knowledge-kicker">Next Step</p>
              <h2>继续探索课程与项目</h2>
            </div>
            <div class="kb-next-links">
              <RouterLink
                v-for="course in relatedCourses"
                :key="course.id"
                class="kb-next-link"
                :to="`/courses/${course.id}`"
              >
                <span>课程</span>
                <strong>{{ course.title }}</strong>
                <p>{{ course.summary }}</p>
              </RouterLink>
              <article
                v-for="prompt in projectPrompts"
                :key="prompt"
                class="kb-next-link"
              >
                <span>项目切口</span>
                <strong>{{ prompt }}</strong>
                <p>把这个问题写成一个可验证的小项目。</p>
              </article>
            </div>
          </section>
        </section>

      </template>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import { apiFetch, readJsonResponse } from '@/api/client';
import staticLearningUnits from '@/data/knowledgeLearningUnits.json';
import bilibiliSeriesVideos from '@/data/bilibiliSeriesVideos.json';

const route = useRoute();
const loading = ref(true);
const error = ref('');
const discipline = ref({});
const learningUnit = ref(null);
const relatedCourses = ref([]);
const answers = ref({});
const progress = ref({});
const justAwarded = ref(false);
const quizMessage = ref('');
const activeVideoKey = ref('');
const activeQuestionIndex = ref(0);
const questionTouchStartX = ref(0);
const progressKey = 'kbLearningProgress:v1';

const palette = {
  science: { bg: '#e8f5ec', soft: '#f4f8ed', text: '#207a54', ink: '#12352a', line: '#86a873', glow: 'rgba(32, 122, 84, 0.16)' },
  engineering: { bg: '#edf3ee', soft: '#f5f7ef', text: '#3f6f5d', ink: '#1f352c', line: '#8aa18a', glow: 'rgba(63, 111, 93, 0.16)' },
  social: { bg: '#eef4ea', soft: '#f7f6ec', text: '#6b7f2a', ink: '#32391c', line: '#a2a85c', glow: 'rgba(107, 127, 42, 0.16)' },
  humanities: { bg: '#f7f0e4', soft: '#fbf5e9', text: '#9a5b2f', ink: '#3d2a1b', line: '#c7925e', glow: 'rgba(154, 91, 47, 0.16)' },
  all: { bg: '#eef2e8', soft: '#f7f7ed', text: '#4d644f', ink: '#1f2f24', line: '#91a27c', glow: 'rgba(77, 100, 79, 0.16)' }
};

function categoryKey(field) {
  if (!field) return 'all';
  const c = String(field.cat || '').toLowerCase();
  if (c === 'science') return 'science';
  if (c === 'engineering' || c === 'stem') return 'engineering';
  if (c === 'social') return 'social';
  if (c === 'humanities') return 'humanities';
  const id = String(field.id || '').toLowerCase();
  if (['env', 'physics', 'math', 'bio', 'medicine'].includes(id)) return 'science';
  if (['tech', 'cs', 'ai', 'robotics', 'materials', 'hci'].includes(id)) return 'engineering';
  if (['soc', 'psych', 'econ', 'edu', 'public_health', 'comm'].includes(id)) return 'social';
  return 'humanities';
}

function categoryLabel(key) {
  return {
    all: '全部',
    science: '理科',
    engineering: '工科',
    social: '社科',
    humanities: '人文'
  }[key] || key;
}

const fieldColor = computed(() => palette[categoryKey(discipline.value)] || palette.all);

const seriesData = computed(() => {
  const key = String(learningUnit.value?.series?.key || '').trim();
  return key ? (bilibiliSeriesVideos[key] || null) : null;
});

const seriesVideos = computed(() => {
  const videos = Array.isArray(seriesData.value?.videos) ? seriesData.value.videos : [];
  if (videos.length) return videos;
  const source = learningUnit.value?.source || {};
  if (!source.embedUrl && !source.url) return [];
  return [{
    id: 'source',
    episode: '推荐',
    title: source.title || '推荐视频',
    url: source.url,
    embedUrl: source.embedUrl,
    durationMinutes: learningUnit.value?.durationMinutes
  }];
});

const seriesTitle = computed(() => seriesData.value?.title || learningUnit.value?.source?.title || 'Crash Course 系列');

const seriesSourceUrl = computed(() => seriesData.value?.sourceUrl || learningUnit.value?.series?.sourceUrl || '');

const activeVideo = computed(() => {
  const videos = seriesVideos.value;
  if (!videos.length) return null;
  return videos.find(video => videoKey(video) === activeVideoKey.value) || videos[0];
});

const activeVideoIndex = computed(() => {
  const videos = seriesVideos.value;
  if (!videos.length) return -1;
  const index = videos.findIndex(video => videoKey(video) === videoKey(activeVideo.value));
  return index >= 0 ? index : 0;
});

const previousVideo = computed(() => (
  activeVideoIndex.value > 0 ? seriesVideos.value[activeVideoIndex.value - 1] : null
));

const nextVideo = computed(() => (
  activeVideoIndex.value >= 0 && activeVideoIndex.value < seriesVideos.value.length - 1
    ? seriesVideos.value[activeVideoIndex.value + 1]
    : null
));

const activeVideoPosition = computed(() => {
  const total = seriesVideos.value.length;
  if (!total) return '推荐视频';
  return `第 ${activeVideoIndex.value + 1} / ${total} 集`;
});

const activeEmbedUrl = computed(() => (
  String(activeVideo.value?.embedUrl || learningUnit.value?.source?.embedUrl || '').trim()
));

const activeVideoUrl = computed(() => (
  String(activeVideo.value?.url || learningUnit.value?.source?.url || '').trim()
));

const activeVideoTitle = computed(() => (
  String(activeVideo.value?.title || '').trim()
));

const passingScore = computed(() => Number(learningUnit.value?.passingScore || learningUnit.value?.questions?.length || 0));

const questionCount = computed(() => learningUnit.value?.questions?.length || 0);

const activeQuestion = computed(() => {
  const questions = learningUnit.value?.questions || [];
  return questions[activeQuestionIndex.value] || questions[0] || null;
});

const score = computed(() => {
  const questions = learningUnit.value?.questions || [];
  return questions.reduce((sum, question) => (
    answers.value[question.id] === question.answerIndex ? sum + 1 : sum
  ), 0);
});

const canSubmit = computed(() => {
  const questions = learningUnit.value?.questions || [];
  return questions.length > 0 && questions.every(question => answers.value[question.id] !== undefined);
});

const totalAvailablePoints = computed(() => {
  const unit = learningUnit.value || {};
  return Number(unit.points || 0) + Number(unit.bonus?.firstCompletion || 0);
});

const completed = computed(() => Boolean(progress.value?.[discipline.value?.id]?.completed));

const projectPrompts = computed(() => (
  Array.isArray(learningUnit.value?.next?.projectPrompts) ? learningUnit.value.next.projectPrompts : []
));

const profile = computed(() => {
  const saved = progress.value?._profile || {};
  const completedEntries = Object.entries(progress.value || {})
    .filter(([key, value]) => key !== '_profile' && value?.completed);
  const totalPoints = Number(saved.totalPoints || 0)
    || completedEntries.reduce((sum, [, value]) => sum + Number(value.points || 0), 0);
  return {
    totalPoints,
    weeklyPoints: Number(saved.weeklyPoints || 0),
    completedUnits: Number(saved.completedUnits || completedEntries.length),
    streakDays: Number(saved.streakDays || 0)
  };
});

function selectAnswer(questionId, optionIndex) {
  if (completed.value) return;
  quizMessage.value = '';
  answers.value = {
    ...answers.value,
    [questionId]: optionIndex
  };
}

function goQuestion(delta) {
  const nextIndex = activeQuestionIndex.value + delta;
  activeQuestionIndex.value = Math.min(Math.max(nextIndex, 0), Math.max(questionCount.value - 1, 0));
}

function onQuestionTouchStart(event) {
  questionTouchStartX.value = Number(event.changedTouches?.[0]?.clientX || 0);
}

function onQuestionTouchEnd(event) {
  const endX = Number(event.changedTouches?.[0]?.clientX || 0);
  const delta = endX - questionTouchStartX.value;
  if (Math.abs(delta) < 48) return;
  goQuestion(delta < 0 ? 1 : -1);
}

function optionClass(question, optionIndex) {
  const selected = answers.value[question.id];
  if (selected === undefined) return '';
  if (optionIndex === question.answerIndex) return 'is-correct';
  if (selected === optionIndex) return 'is-wrong';
  return '';
}

function videoKey(video) {
  return String(video?.id || video?.bvid || video?.url || '');
}

function selectVideo(video) {
  activeVideoKey.value = videoKey(video);
}

function selectAdjacentVideo(delta) {
  const target = delta < 0 ? previousVideo.value : nextVideo.value;
  if (target) selectVideo(target);
}

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(progressKey) || '{}');
    progress.value = parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    progress.value = {};
  }
}

function saveProgress(nextProgress) {
  progress.value = nextProgress;
  localStorage.setItem(progressKey, JSON.stringify(nextProgress));
}

function submitChallenge() {
  if (!canSubmit.value || completed.value) return;
  if (score.value < passingScore.value) {
    quizMessage.value = `还差一点：当前答对 ${score.value} 题，需要至少 ${passingScore.value} 题。可以直接重选答案再提交。`;
    return;
  }
  const id = discipline.value.id;
  const points = totalAvailablePoints.value;
  const currentProfile = profile.value;
  const nextProgress = {
    ...progress.value,
    [id]: {
      completed: true,
      score: score.value,
      points,
      completedAt: new Date().toISOString()
    },
    _profile: {
      totalPoints: currentProfile.totalPoints + points,
      weeklyPoints: Number(progress.value?._profile?.weeklyPoints || 0) + points,
      completedUnits: currentProfile.completedUnits + 1,
      streakDays: Math.max(1, currentProfile.streakDays)
    }
  };
  saveProgress(nextProgress);
  quizMessage.value = '挑战完成，积分已保存。';
  justAwarded.value = true;
  window.setTimeout(() => {
    justAwarded.value = false;
  }, 900);
}

async function loadDetailFallback(id) {
  const [disciplinesRes, unitsRes, coursesRes] = await Promise.all([
    apiFetch('/knowledge/disciplines'),
    apiFetch('/knowledge/learning-units'),
    apiFetch('/courses')
  ]);
  const disciplinesData = await readJsonResponse(disciplinesRes, 'knowledge_disciplines_fallback');
  const unitsData = await readJsonResponse(unitsRes, 'knowledge_units_fallback');
  const coursesData = await readJsonResponse(coursesRes, 'knowledge_courses_fallback');
  if (!disciplinesRes.ok) throw new Error(disciplinesData?.error || 'knowledge_disciplines_failed');
  const foundDiscipline = (disciplinesData.disciplines || []).find(item => String(item.id || '') === id);
  if (!foundDiscipline) throw new Error('knowledge_discipline_not_found');
  const foundUnit = unitsRes.ok
    ? (unitsData.learningUnits || []).find(item => String(item.disciplineId || '') === id) || null
    : staticLearningUnits.find(item => String(item.disciplineId || '') === id) || null;
  const courseIds = Array.isArray(foundUnit?.next?.courseIds) ? foundUnit.next.courseIds : [];
  const courses = Array.isArray(coursesData.courses) ? coursesData.courses : [];
  return {
    discipline: foundDiscipline,
    learningUnit: foundUnit,
    relatedCourses: courseIds
      .map(courseId => courses.find(course => String(course.id || '') === String(courseId)))
      .filter(Boolean)
  };
}

async function loadDetail() {
  loading.value = true;
  error.value = '';
  answers.value = {};
  activeQuestionIndex.value = 0;
  justAwarded.value = false;
  quizMessage.value = '';
  activeVideoKey.value = '';
  loadProgress();
  try {
    const id = String(route.params.disciplineId || '');
    const res = await apiFetch(`/knowledge/disciplines/${encodeURIComponent(id)}`);
    const data = await readJsonResponse(res, 'knowledge_detail');
    const detail = res.ok ? data : await loadDetailFallback(id);
    discipline.value = detail.discipline || {};
    learningUnit.value = detail.learningUnit || null;
    relatedCourses.value = Array.isArray(detail.relatedCourses) ? detail.relatedCourses : [];
  } catch (err) {
    console.error(err);
    error.value = '这个知识方向暂时不存在，或者内容还没有发布。';
    discipline.value = {};
    learningUnit.value = null;
    relatedCourses.value = [];
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.disciplineId, loadDetail, { immediate: true });
</script>

<style scoped>
.knowledge-detail-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 8%, var(--field-glow), transparent 28%),
    radial-gradient(circle at 88% 14%, rgba(160, 117, 61, 0.13), transparent 27%),
    linear-gradient(115deg, rgba(64, 88, 58, 0.04) 25%, transparent 25%) 0 0 / 52px 52px,
    linear-gradient(65deg, rgba(64, 88, 58, 0.035) 25%, transparent 25%) 0 0 / 52px 52px,
    linear-gradient(rgba(77, 100, 79, 0.04) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(90deg, rgba(77, 100, 79, 0.035) 1px, transparent 1px) 0 0 / 28px 28px,
    #f5f7ef;
}

.kb-detail-shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 14px 20px 56px;
}

.kb-detail-main {
  min-width: 0;
}

.kb-back-link,
.kb-primary-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4d644f;
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
  margin-bottom: 10px;
}

.kb-primary-link {
  margin-top: 18px;
}

.kb-panel,
.kb-learning-unit,
.kb-next-section,
.kb-study-summary-card {
  border: 1px solid rgba(75, 94, 71, 0.16);
  background: rgba(255, 253, 246, 0.82);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 45px rgba(51, 67, 45, 0.07);
}

.knowledge-kicker {
  margin: 0;
  color: var(--field-color, #4d644f);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.kb-learning-unit,
.kb-panel,
.kb-next-section {
  margin-top: 18px;
  border-radius: 24px;
  overflow: hidden;
}

.kb-learning-unit {
  margin-top: 0;
}

.kb-learning-unit__header,
.kb-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
}

.kb-learning-unit__header h2,
.kb-section-heading h2,
.kb-panel h2 {
  margin: 6px 0 0;
  color: #0f172a;
  font-size: 1.16rem;
  font-weight: 900;
}

.kb-learning-unit__header p:not(.knowledge-kicker),
.kb-panel p {
  margin-top: 8px;
  color: #64748b;
  line-height: 1.7;
}

.kb-learning-unit__status {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 8px 11px;
  background: var(--field-bg, #eef2e8);
  color: var(--field-color, #4d644f);
  font-size: 0.75rem;
  font-weight: 900;
}

.kb-learning-unit__status.is-complete {
  background: #dcfce7;
  color: #16a34a;
}

.kb-video {
  aspect-ratio: 16 / 9;
  width: 100%;
  background: #020617;
}

.kb-video iframe {
  width: 100%;
  height: 100%;
  display: block;
  border: 0;
}

.kb-video-fallback {
  display: grid;
  place-items: center;
  min-height: 260px;
  color: #e2e8f0;
  text-align: center;
  padding: 24px;
}

.kb-episode-controls {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid rgba(77, 100, 79, 0.14);
  background: rgba(255, 253, 246, 0.9);
  padding: 12px 16px;
}

.kb-episode-controls button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(77, 100, 79, 0.16);
  border-radius: 999px;
  background: #fffdf6;
  color: var(--field-color, #4d644f);
  padding: 9px 12px;
  font-size: 0.76rem;
  font-weight: 950;
}

.kb-episode-controls button:disabled {
  color: #94a3b8;
  background: #f1f5f9;
  cursor: not-allowed;
}

.kb-episode-controls div {
  min-width: 0;
  text-align: center;
}

.kb-episode-controls span {
  display: block;
  color: var(--field-color, #4d644f);
  font-size: 0.72rem;
  font-weight: 950;
}

.kb-episode-controls strong {
  display: block;
  overflow: hidden;
  color: var(--field-ink, #1f2f24);
  font-size: 0.86rem;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-video-fallback a,
.kb-source-note a,
.kb-series-playlist a {
  color: var(--field-color, #4d644f);
  font-weight: 900;
}

.kb-series-playlist {
  border-bottom: 1px solid rgba(77, 100, 79, 0.14);
  background:
    linear-gradient(135deg, var(--field-glow, rgba(77, 100, 79, 0.1)), transparent 36%),
    rgba(255, 253, 246, 0.95);
  padding: 14px 16px 16px;
}

.kb-series-playlist .kb-section-heading {
  align-items: center;
  padding: 0;
}

.kb-series-playlist .kb-section-heading a {
  flex: 0 0 auto;
  font-size: 0.78rem;
  text-decoration: none;
}

.kb-series-list {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x proximity;
}

.kb-series-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  flex: 0 0 min(340px, 78vw);
  border: 1px solid rgba(77, 100, 79, 0.16);
  border-radius: 16px;
  background: rgba(250, 250, 244, 0.92);
  padding: 11px;
  scroll-snap-align: start;
  text-align: left;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.kb-series-item:hover,
.kb-series-item.is-active {
  border-color: var(--field-color, #4d644f);
  background: var(--field-bg, #eef2e8);
  transform: translateY(-1px);
}

.kb-series-item span {
  display: grid;
  place-items: center;
  height: 30px;
  border-radius: 999px;
  background: #ffffff;
  color: var(--field-color, #4d644f);
  font-size: 0.72rem;
  font-weight: 950;
}

.kb-series-item strong {
  min-width: 0;
  overflow: hidden;
  color: var(--field-ink, #1f2f24);
  font-size: 0.84rem;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-series-item em {
  grid-column: 2;
  color: #64748b;
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 800;
}

.kb-source-note {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(77, 100, 79, 0.14);
}

.kb-source-note strong {
  color: var(--field-ink, #1f2f24);
  font-size: 0.9rem;
}

.kb-source-note p {
  margin-top: 5px;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.6;
}

.kb-quiz {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.kb-section-heading {
  padding: 0 0 4px;
}

.kb-section-heading span {
  border-radius: 999px;
  background: var(--field-bg, #eef2e8);
  color: var(--field-color, #4d644f);
  padding: 8px 10px;
  font-size: 0.75rem;
  font-weight: 900;
}

.kb-quiz-question {
  border: 1px solid rgba(77, 100, 79, 0.14);
  border-radius: 20px;
  background: rgba(250, 250, 244, 0.86);
  padding: 18px;
  touch-action: pan-y;
}

.kb-quiz-carousel {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  gap: 12px;
  align-items: stretch;
}

.kb-quiz-nav {
  border: 1px solid rgba(77, 100, 79, 0.16);
  border-radius: 18px;
  background: #fffdf6;
  color: var(--field-color, #4d644f);
  font-weight: 950;
}

.kb-quiz-nav:disabled {
  color: #cbd5e1;
  background: rgba(241, 245, 249, 0.72);
  cursor: not-allowed;
}

.kb-quiz-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.kb-quiz-progress span {
  color: var(--field-color, #4d644f);
  font-size: 0.76rem;
  font-weight: 950;
}

.kb-quiz-progress div,
.kb-quiz-dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.kb-quiz-progress i {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #cbd5e1;
}

.kb-quiz-progress i.is-answered {
  background: #86a873;
}

.kb-quiz-progress i.is-active {
  width: 22px;
  background: var(--field-color, #4d644f);
}

.kb-quiz-question h3 {
  margin: 0 0 12px;
  color: var(--field-ink, #1f2f24);
  font-size: 0.96rem;
  font-weight: 900;
  line-height: 1.5;
}

.kb-quiz-options {
  display: grid;
  gap: 8px;
}

.kb-quiz-option {
  width: 100%;
  min-height: 42px;
  border: 1px solid rgba(77, 100, 79, 0.15);
  border-radius: 13px;
  background: #ffffff;
  color: #334236;
  padding: 10px 12px;
  text-align: left;
  font-weight: 800;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.kb-quiz-option:hover {
  border-color: var(--field-color, #4d644f);
  background: var(--field-bg, #eef2e8);
}

.kb-quiz-option:active {
  transform: translateY(1px);
}

.kb-quiz-option.is-correct {
  border-color: #16a34a;
  background: #dcfce7;
  color: #166534;
}

.kb-quiz-option.is-wrong {
  border-color: #dc2626;
  background: #fee2e2;
  color: #991b1b;
}

.kb-quiz-explanation {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.6;
}

.kb-quiz-mobile-controls {
  display: none;
  gap: 10px;
}

.kb-quiz-mobile-controls button,
.kb-quiz-dots button {
  border: 1px solid rgba(77, 100, 79, 0.16);
  border-radius: 999px;
  background: #fffdf6;
  color: var(--field-color, #4d644f);
  padding: 8px 11px;
  font-size: 0.76rem;
  font-weight: 950;
}

.kb-quiz-mobile-controls button:disabled {
  color: #cbd5e1;
  background: rgba(241, 245, 249, 0.72);
}

.kb-quiz-dots {
  justify-content: center;
}

.kb-quiz-dots button {
  min-width: 34px;
  padding: 8px 10px;
}

.kb-quiz-dots button.is-answered {
  background: var(--field-bg, #eef2e8);
}

.kb-quiz-dots button.is-active {
  background: var(--field-color, #4d644f);
  color: #ffffff;
}

.kb-points {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 0 20px 20px;
  border: 1px solid rgba(77, 100, 79, 0.22);
  border-radius: 18px;
  background:
    radial-gradient(circle at 12% 20%, var(--field-glow, rgba(77, 100, 79, 0.12)), transparent 38%),
    linear-gradient(135deg, var(--field-bg, #eef2e8), #fffdf6);
  padding: 16px;
}

.kb-points span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 900;
}

.kb-points strong {
  display: block;
  color: #0f172a;
  font-size: 2rem;
  font-weight: 950;
  line-height: 1.1;
}

.kb-points p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.84rem;
}

.kb-points button {
  border: 0;
  border-radius: 999px;
  background: var(--field-color, #4d644f);
  color: #ffffff;
  padding: 11px 16px;
  font-size: 0.78rem;
  font-weight: 900;
}

.kb-points button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.kb-rank-change {
  color: #16a34a !important;
  font-weight: 900;
}

.kb-study-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.kb-study-summary-card {
  min-width: 0;
  border-radius: 20px;
  padding: 16px;
}

.kb-study-summary-card strong {
  display: block;
  overflow: hidden;
  margin-top: 6px;
  color: var(--field-ink, #1f2f24);
  font-size: 1.15rem;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-study-summary-card span {
  display: block;
  overflow: hidden;
  margin-top: 5px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-explore-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.kb-panel {
  padding: 20px;
}

.kb-question-list,
.kb-concept-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.kb-question-card,
.kb-concept-card {
  border: 1px solid rgba(77, 100, 79, 0.14);
  border-radius: 16px;
  background: rgba(255, 253, 246, 0.9);
  padding: 14px;
}

.kb-question-card strong,
.kb-concept-card strong {
  color: var(--field-ink, #1f2f24);
  font-size: 0.9rem;
}

.kb-question-card p,
.kb-concept-card p {
  color: #64748b;
  font-size: 0.86rem;
}

.kb-next-section {
  padding: 20px;
}

.kb-next-links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.kb-next-link {
  border: 1px solid rgba(77, 100, 79, 0.14);
  border-radius: 18px;
  background: rgba(250, 250, 244, 0.9);
  padding: 16px;
  color: var(--field-ink, #1f2f24);
  text-decoration: none;
}

.kb-next-link:hover {
  border-color: var(--field-color, #4d644f);
  background: #fffdf6;
}

.kb-next-link span {
  color: var(--field-color, #4d644f);
  font-size: 0.72rem;
  font-weight: 900;
}

.kb-next-link strong {
  display: block;
  margin-top: 6px;
  font-size: 0.92rem;
  font-weight: 900;
}

.kb-next-link p {
  margin-top: 8px;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.6;
}

.kb-empty-state {
  min-height: 320px;
  display: grid;
  place-items: center;
  text-align: center;
}

@media (max-width: 980px) {
  .kb-detail-shell,
  .kb-explore-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .kb-detail-shell {
    padding: 10px 12px 42px;
  }

  .kb-learning-unit__header,
  .kb-points,
  .kb-series-playlist .kb-section-heading,
  .kb-source-note {
    flex-direction: column;
    align-items: stretch;
  }

  .kb-next-links {
    grid-template-columns: 1fr;
  }

  .kb-study-summary {
    grid-template-columns: 1fr;
  }

  .kb-learning-unit__header {
    padding: 14px;
  }

  .kb-learning-unit__header p:not(.knowledge-kicker) {
    display: none;
  }

  .kb-video {
    aspect-ratio: 16 / 10;
  }

  .kb-episode-controls {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .kb-episode-controls button {
    justify-content: center;
  }

  .kb-quiz-carousel {
    grid-template-columns: 1fr;
  }

  .kb-quiz-carousel > .kb-quiz-nav {
    display: none;
  }

  .kb-quiz-mobile-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kb-quiz-mobile-controls button {
    justify-content: center;
  }
}
</style>
