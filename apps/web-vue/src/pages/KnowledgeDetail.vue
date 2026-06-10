<template>
  <div class="knowledge-detail-page text-slate-800">
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

          <article class="kb-detail-hero" :style="{ '--field-color': fieldColor.text, '--field-bg': fieldColor.bg }">
            <div class="kb-detail-hero__copy">
              <p class="knowledge-kicker">{{ categoryLabel(categoryKey(discipline)) }} · Knowledge Quest</p>
              <h1>{{ discipline.name }}</h1>
              <p class="kb-detail-hero__en">{{ discipline.en }}</p>
              <p class="kb-detail-hero__definition">{{ discipline.definition }}</p>
            </div>
            <div class="kb-detail-hero__score">
              <span>{{ completed ? '已完成挑战' : '本次可获得' }}</span>
              <strong>{{ totalAvailablePoints }}</strong>
              <em>知识积分</em>
            </div>
          </article>

          <article v-if="learningUnit" class="kb-learning-unit">
            <header class="kb-learning-unit__header">
              <div>
                <p class="knowledge-kicker">Video Challenge</p>
                <h2>{{ learningUnit.title }}</h2>
                <p>{{ learningUnit.summary }}</p>
              </div>
              <span class="kb-learning-unit__status" :class="{ 'is-complete': completed }">
                {{ completed ? '已完成' : `${learningUnit.durationMinutes || 10} 分钟` }}
              </span>
            </header>

            <div class="kb-video">
              <iframe
                v-if="embedUrl"
                :src="embedUrl"
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

            <div class="kb-source-note">
              <div>
                <strong>{{ learningUnit.source?.title || '推荐视频' }}</strong>
                <p>{{ learningUnit.source?.note || '看完视频后完成下面的挑战题。' }}</p>
              </div>
              <a v-if="learningUnit.source?.url" :href="learningUnit.source.url" target="_blank" rel="noreferrer">
                外链观看 <i class="fas fa-up-right-from-square"></i>
              </a>
            </div>

            <section class="kb-quiz">
              <div class="kb-section-heading">
                <p class="knowledge-kicker">Quest Check</p>
                <h2>看完挑战</h2>
                <span>{{ score }} / {{ learningUnit.questions?.length || 0 }} 正确</span>
              </div>

              <article
                v-for="(question, questionIndex) in learningUnit.questions"
                :key="question.id"
                class="kb-quiz-question"
              >
                <h3>{{ questionIndex + 1 }}. {{ question.prompt }}</h3>
                <div class="kb-quiz-options">
                  <button
                    v-for="(option, optionIndex) in question.options"
                    :key="option"
                    type="button"
                    class="kb-quiz-option"
                    :class="optionClass(question, optionIndex)"
                    @click="selectAnswer(question.id, optionIndex)"
                  >
                    {{ option }}
                  </button>
                </div>
                <p v-if="answers[question.id] !== undefined" class="kb-quiz-explanation">
                  {{ question.explanation }}
                </p>
              </article>
            </section>

            <section class="kb-points" :class="{ 'is-awarded': justAwarded }">
              <div>
                <span>{{ completed ? '已计入你的知识积分' : '完成挑战后获得积分' }}</span>
                <strong>+{{ totalAvailablePoints }}</strong>
                <p v-if="completed" class="kb-rank-change">当前探索记录已保存，本周榜单会优先展示近期完成。</p>
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

        <aside class="kb-detail-sidebar">
          <article class="kb-sidebar-card">
            <p class="knowledge-kicker">My Progress</p>
            <strong>{{ profile.totalPoints }}</strong>
            <span>累计知识积分</span>
            <div class="kb-sidebar-stats">
              <span>{{ profile.completedUnits }} 个挑战</span>
              <span>{{ profile.streakDays }} 天连续</span>
            </div>
          </article>

          <article class="kb-sidebar-card">
            <p class="knowledge-kicker">Discipline Board</p>
            <div class="kb-mini-rank" v-for="(item, index) in detailLeaderboard" :key="item.id">
              <span>#{{ index + 1 }}</span>
              <div>
                <strong>{{ item.name }}</strong>
                <p>{{ item.action }}</p>
              </div>
              <em>{{ item.points }}</em>
            </div>
          </article>

          <article class="kb-sidebar-card">
            <p class="knowledge-kicker">Why It Matters</p>
            <p>{{ discipline.why_matters || discipline.tagline || '从真实问题中寻找研究与实践切口。' }}</p>
          </article>
        </aside>
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
const progressKey = 'kbLearningProgress:v1';

const palette = {
  science: { bg: '#eff6ff', text: '#2563eb' },
  engineering: { bg: '#eef2ff', text: '#4f46e5' },
  social: { bg: '#ecfeff', text: '#0891b2' },
  humanities: { bg: '#fff7ed', text: '#ea580c' },
  all: { bg: '#f3f4f6', text: '#4b5563' }
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

const embedUrl = computed(() => String(learningUnit.value?.source?.embedUrl || '').trim());

const passingScore = computed(() => Number(learningUnit.value?.passingScore || learningUnit.value?.questions?.length || 0));

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
    completedUnits: Number(saved.completedUnits || completedEntries.length),
    streakDays: Number(saved.streakDays || 0)
  };
});

const detailLeaderboard = computed(() => {
  const fieldName = discipline.value?.name || '知识';
  const mine = completed.value
    ? [{
        id: 'me',
        name: '我的探索',
        action: `完成 ${fieldName} 挑战`,
        points: Number(progress.value?.[discipline.value.id]?.points || totalAvailablePoints.value)
      }]
    : [];
  return [
    ...mine,
    { id: 'seed-1', name: '知识先锋', action: `正在探索 ${fieldName}`, points: 42 },
    { id: 'seed-2', name: '跨界小队', action: '完成跨学科挑战', points: 35 },
    { id: 'seed-3', name: '项目发起人', action: '从知识进入项目', points: 28 }
  ].sort((a, b) => b.points - a.points).slice(0, 3);
});

function selectAnswer(questionId, optionIndex) {
  if (completed.value) return;
  quizMessage.value = '';
  answers.value = {
    ...answers.value,
    [questionId]: optionIndex
  };
}

function optionClass(question, optionIndex) {
  const selected = answers.value[question.id];
  if (selected === undefined) return '';
  if (optionIndex === question.answerIndex) return 'is-correct';
  if (selected === optionIndex) return 'is-wrong';
  return '';
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
  justAwarded.value = false;
  quizMessage.value = '';
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
    linear-gradient(90deg, rgba(15, 23, 42, 0.025) 1px, transparent 1px),
    linear-gradient(180deg, rgba(15, 23, 42, 0.025) 1px, transparent 1px),
    radial-gradient(circle at top left, rgba(79, 70, 229, 0.1), transparent 32%),
    #f8fafc;
  background-size: 42px 42px, 42px 42px, 100% 100%, 100% 100%;
}

.kb-detail-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.kb-detail-main {
  min-width: 0;
}

.kb-back-link,
.kb-primary-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4f46e5;
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
  margin-bottom: 16px;
}

.kb-primary-link {
  margin-top: 18px;
}

.kb-detail-hero,
.kb-panel,
.kb-learning-unit,
.kb-next-section,
.kb-sidebar-card {
  border: 1px solid rgba(255, 255, 255, 0.66);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.035);
}

.kb-detail-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 18px;
  border-radius: 28px;
  padding: 26px;
}

.knowledge-kicker {
  margin: 0;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.kb-detail-hero h1 {
  margin: 10px 0 0;
  color: #0f172a;
  font-size: clamp(2rem, 5vw, 3.1rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.kb-detail-hero__en {
  margin-top: 8px;
  color: #94a3b8;
  font-size: 0.95rem;
  font-weight: 700;
}

.kb-detail-hero__definition {
  margin-top: 18px;
  color: #475569;
  line-height: 1.8;
}

.kb-detail-hero__score {
  display: grid;
  place-items: center;
  border: 1px solid #c7d2fe;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--field-bg), #ffffff);
  color: var(--field-color);
  text-align: center;
  padding: 18px;
}

.kb-detail-hero__score span,
.kb-detail-hero__score em {
  font-size: 0.76rem;
  font-style: normal;
  font-weight: 900;
}

.kb-detail-hero__score strong {
  color: #0f172a;
  font-size: 2.4rem;
  font-weight: 950;
  line-height: 1;
}

.kb-learning-unit,
.kb-panel,
.kb-next-section {
  margin-top: 24px;
  border-radius: 24px;
  overflow: hidden;
}

.kb-learning-unit__header,
.kb-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
}

.kb-learning-unit__header h2,
.kb-section-heading h2,
.kb-panel h2 {
  margin: 6px 0 0;
  color: #0f172a;
  font-size: 1.25rem;
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
  background: #eef2ff;
  color: #4f46e5;
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

.kb-video-fallback a,
.kb-source-note a {
  color: #4f46e5;
  font-weight: 900;
}

.kb-source-note {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.kb-source-note strong {
  color: #0f172a;
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
  padding: 20px;
}

.kb-section-heading {
  padding: 0 0 4px;
}

.kb-section-heading span {
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  padding: 8px 10px;
  font-size: 0.75rem;
  font-weight: 900;
}

.kb-quiz-question {
  border: 1px solid #f1f5f9;
  border-radius: 18px;
  background: #f8fafc;
  padding: 16px;
}

.kb-quiz-question h3 {
  margin: 0 0 12px;
  color: #0f172a;
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
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  background: #ffffff;
  color: #334155;
  padding: 10px 12px;
  text-align: left;
  font-weight: 800;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.kb-quiz-option:hover {
  border-color: #c7d2fe;
  background: #eef2ff;
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

.kb-points {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 0 20px 20px;
  border: 1px solid #c7d2fe;
  border-radius: 18px;
  background: linear-gradient(135deg, #eef2ff, #ffffff);
  padding: 16px;
}

.kb-points span,
.kb-sidebar-card span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 900;
}

.kb-points strong,
.kb-sidebar-card > strong {
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
  background: #4f46e5;
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
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  background: #ffffff;
  padding: 14px;
}

.kb-question-card strong,
.kb-concept-card strong {
  color: #0f172a;
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
  border: 1px solid #f1f5f9;
  border-radius: 18px;
  background: #f8fafc;
  padding: 16px;
  color: #0f172a;
  text-decoration: none;
}

.kb-next-link:hover {
  border-color: #c7d2fe;
  background: #ffffff;
}

.kb-next-link span {
  color: #4f46e5;
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

.kb-detail-sidebar {
  position: sticky;
  top: 96px;
  align-self: start;
  display: grid;
  gap: 14px;
}

.kb-sidebar-card {
  border-radius: 22px;
  padding: 18px;
}

.kb-sidebar-stats {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.kb-sidebar-stats span {
  border-radius: 999px;
  background: #f1f5f9;
  padding: 7px 9px;
}

.kb-mini-rank {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
}

.kb-mini-rank > span {
  display: grid;
  place-items: center;
  height: 30px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
}

.kb-mini-rank strong {
  display: block;
  color: #0f172a;
  font-size: 0.86rem;
}

.kb-mini-rank p {
  color: #64748b;
  font-size: 0.76rem;
}

.kb-mini-rank em {
  color: #0f172a;
  font-style: normal;
  font-weight: 950;
}

.kb-empty-state {
  min-height: 320px;
  display: grid;
  place-items: center;
  text-align: center;
}

@media (max-width: 980px) {
  .kb-detail-shell,
  .kb-detail-hero,
  .kb-explore-grid {
    grid-template-columns: 1fr;
  }

  .kb-detail-sidebar {
    position: static;
  }
}

@media (max-width: 720px) {
  .kb-detail-shell {
    padding: 18px 14px 42px;
  }

  .kb-learning-unit__header,
  .kb-points,
  .kb-source-note {
    flex-direction: column;
    align-items: stretch;
  }

  .kb-next-links {
    grid-template-columns: 1fr;
  }
}
</style>
