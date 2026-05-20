<template>
  <div class="competition-detail-page">
    <SiteNav active="competitions" />

    <main v-if="competition" class="detail-shell">
      <RouterLink to="/competitions" class="back-link">
        <i class="fas fa-arrow-left"></i>
        返回赛事作战台
      </RouterLink>

      <section class="detail-hero">
        <div class="detail-copy">
          <p class="detail-kicker">Competition brief</p>
          <div class="detail-meta">
            <span>{{ competition.tier }}</span>
            <span :class="statusClass(competition.status)">{{ competition.status }}</span>
            <span>{{ competition.dateRange }}</span>
          </div>
          <h1>{{ competition.title }}</h1>
          <p>{{ competition.fitSummary }}</p>
        </div>

        <aside class="decision-panel" aria-label="参赛判断">
          <p class="panel-kicker">Entry decision</p>
          <div class="decision-score">
            <span>推荐指数</span>
            <strong>{{ decisionScore }}</strong>
          </div>
          <dl class="fact-list">
            <div>
              <dt>主办单位</dt>
              <dd>{{ competition.host }}</dd>
            </div>
            <div>
              <dt>比赛地点</dt>
              <dd>{{ competition.location }}</dd>
            </div>
            <div>
              <dt>适合学段</dt>
              <dd>{{ competition.schoolStage.join(' / ') }}</dd>
            </div>
            <div>
              <dt>赛事方向</dt>
              <dd>{{ competition.discipline.join(' / ') }}</dd>
            </div>
          </dl>
          <a
            class="decision-action"
            :href="competition.externalLink"
            target="_blank"
            rel="noreferrer"
          >
            <i class="fas fa-arrow-up-right-from-square"></i>
            打开官方入口
          </a>
          <button class="decision-action register-action" type="button" @click="submitRegistration">
            <i class="fas fa-paper-plane"></i>
            {{ ownRegistration ? '更新校内报名' : '提交校内报名' }}
          </button>
        </aside>
      </section>

      <section class="detail-status-strip" aria-label="赛事关键指标">
        <article>
          <span>报名状态</span>
          <strong>{{ competition.status }}</strong>
        </article>
        <article>
          <span>赛道数量</span>
          <strong>{{ detail.tracks?.length || 0 }}</strong>
        </article>
        <article>
          <span>时间节点</span>
          <strong>{{ detail.timeline?.length || 0 }}</strong>
        </article>
        <article>
          <span>课程联动</span>
          <strong>{{ competition.relatedCourses?.length || 0 }}</strong>
        </article>
      </section>

      <section class="registration-panel">
        <div class="panel-heading">
          <p>Registration</p>
          <h2>校内报名信息</h2>
        </div>
        <div class="registration-grid">
          <form class="registration-form" @submit.prevent="submitRegistration">
            <label>队伍名称<input v-model="registrationForm.teamName" placeholder="个人报名可留空" /></label>
            <label>班级<input v-model="registrationForm.className" placeholder="例如 高一 3 班" /></label>
            <label>成员<textarea v-model="registrationForm.members" placeholder="填写成员姓名，逗号或换行分隔"></textarea></label>
            <label>材料说明<textarea v-model="registrationForm.materials" placeholder="作品链接、报名表、附件说明等"></textarea></label>
            <label>备注<textarea v-model="registrationForm.note" placeholder="需要老师知道的信息"></textarea></label>
            <button class="decision-action register-submit" type="submit">{{ ownRegistration ? '更新报名' : '提交报名' }}</button>
          </form>
          <div class="registration-status">
            <div>
              <span>我的状态</span>
              <strong>{{ ownRegistration?.status || '未报名' }}</strong>
            </div>
            <p v-if="ownRegistration?.teacherFeedback">教师反馈：{{ ownRegistration.teacherFeedback }}</p>
            <p v-else>提交后老师会在教师端确认报名、要求补材料或驳回。</p>
          </div>
        </div>
      </section>

      <section class="decision-grid">
        <article class="decision-card">
          <p>为什么参加</p>
          <h2>{{ competition.whyJoin }}</h2>
        </article>
        <article class="decision-card">
          <p>准备建议</p>
          <h2>{{ competition.prepAdvice }}</h2>
        </article>
        <article class="decision-card accent-card">
          <p>参与方式</p>
          <h2>{{ participationText }}</h2>
        </article>
      </section>

      <section class="detail-layout">
        <div class="main-column">
          <section class="content-panel">
            <div class="panel-heading">
              <p>Tracks</p>
              <h2>赛道与作品方向</h2>
            </div>
            <p class="panel-intro">{{ detail.overview || competition.fitSummary }}</p>
            <div v-if="detail.tracks?.length" class="track-grid">
              <div v-for="track in detail.tracks" :key="track" class="track-item">
                <i class="fas fa-location-crosshairs"></i>
                <span>{{ track }}</span>
              </div>
            </div>
          </section>

          <section class="content-panel">
            <div class="panel-heading">
              <p>Timeline</p>
              <h2>关键时间线</h2>
            </div>
            <div v-if="detail.timeline?.length" class="timeline">
              <article
                v-for="(item, index) in detail.timeline"
                :key="`${item.label}-${item.date}`"
                class="timeline-item"
              >
                <span>{{ String(index + 1).padStart(2, '0') }}</span>
                <div>
                  <h3>{{ item.label }}</h3>
                  <p>{{ item.date }}</p>
                </div>
              </article>
            </div>
            <div v-else class="muted-note">暂未提供详细时间节点，请以官方通知为准。</div>
          </section>

          <section v-if="detail.faq?.length" class="content-panel">
            <div class="panel-heading">
              <p>FAQ</p>
              <h2>常见问题</h2>
            </div>
            <div class="faq-grid">
              <article v-for="item in detail.faq" :key="item.q" class="faq-card">
                <h3>{{ item.q }}</h3>
                <p>{{ item.a }}</p>
              </article>
            </div>
          </section>
        </div>

        <aside class="side-column">
          <section class="content-panel">
            <div class="panel-heading">
              <p>Course map</p>
              <h2>课程联动</h2>
            </div>
            <div v-if="competition.relatedCourses?.length" class="course-list">
              <RouterLink
                v-for="course in competition.relatedCourses"
                :key="course.id"
                :to="`/courses/${course.id}`"
                class="course-item"
              >
                <strong>{{ course.title }}</strong>
                <span>{{ course.summary || course.positioning || '查看课程准备内容' }}</span>
              </RouterLink>
            </div>
            <div v-else class="muted-note">还没有关联课程，后续创建赛事时应补齐。</div>
          </section>

          <section class="content-panel">
            <div class="panel-heading">
              <p>Resources</p>
              <h2>资料与联系人</h2>
            </div>
            <dl class="fact-list side-facts">
              <div>
                <dt>报名方式</dt>
                <dd>{{ detail.participation?.mode || '以官方通知为准' }}</dd>
              </div>
              <div>
                <dt>联系人</dt>
                <dd>{{ detail.participation?.contact || '以学校通知为准' }}</dd>
              </div>
            </dl>
            <div v-if="resourceLinks.length" class="resource-list">
              <a
                v-for="item in resourceLinks"
                :key="item.url"
                :href="item.url"
                target="_blank"
                rel="noreferrer"
              >
                <span>{{ item.label }}</span>
                <i class="fas fa-arrow-up-right-from-square"></i>
              </a>
            </div>
          </section>

          <section class="next-step-panel">
            <p>下一步</p>
            <ol>
              <li>确认学生学段和方向是否匹配。</li>
              <li>根据时间线倒排训练节点。</li>
              <li>从关联课程挑一个作品原型开始。</li>
            </ol>
          </section>
        </aside>
      </section>
    </main>

    <main v-else class="detail-shell">
      <section class="loading-panel">
        正在加载赛事内容，请稍候。
      </section>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import { fetchCompetitionDetail } from '@/api/portal';
import { getAuthToken } from '@/api/auth';
import { apiFetch, readJsonResponse } from '@/api/client';

const route = useRoute();
const competition = ref(null);
const registrations = ref([]);
const registrationForm = reactive({
  teamName: '',
  className: '',
  members: '',
  materials: '',
  note: ''
});

const detail = computed(() => competition.value?.detail || {});
const ownRegistration = computed(() => registrations.value[0] || null);

const resourceLinks = computed(() => {
  const resources = Array.isArray(detail.value.resources) ? detail.value.resources : [];
  const attachments = Array.isArray(competition.value?.attachments) ? competition.value.attachments : [];
  return [...resources, ...attachments].filter((item, index, list) => (
    item.url && list.findIndex(entry => entry.url === item.url) === index
  ));
});

const participationText = computed(() => (
  detail.value.participation?.notes
  || detail.value.participation?.mode
  || '先提供赛事信息、时间节点和参与入口，课程与项目联动会持续补齐。'
));

const decisionScore = computed(() => {
  if (!competition.value) return 0;
  let score = 58;
  if (competition.value.status === '报名中') score += 18;
  if (competition.value.status === '即将开始') score += 12;
  if (competition.value.tier === '白名单赛事') score += 14;
  if (competition.value.tier === '上海市赛事') score += 10;
  score += (competition.value.relatedCourses?.length || 0) * 4;
  return Math.min(score, 98);
});

function statusClass(status) {
  if (status === '报名中') return 'is-open';
  if (status === '即将开始') return 'is-upcoming';
  if (status === '进行中') return 'is-live';
  return 'is-muted';
}

async function loadCompetition() {
  competition.value = await fetchCompetitionDetail(route.params.slug);
  await loadRegistrations();
}

function syncRegistrationForm(registration) {
  registrationForm.teamName = registration?.teamName || '';
  registrationForm.className = registration?.className || '';
  registrationForm.members = registration?.members || '';
  registrationForm.materials = registration?.materials || '';
  registrationForm.note = registration?.note || '';
}

async function loadRegistrations() {
  if (!getAuthToken()) {
    registrations.value = [];
    syncRegistrationForm(null);
    return;
  }
  try {
    const res = await apiFetch(`/competitions/${route.params.slug}/registrations`);
    const data = await readJsonResponse(res, 'competition_registrations');
    registrations.value = res.ok ? (data.registrations || []) : [];
    syncRegistrationForm(ownRegistration.value);
  } catch (err) {
    registrations.value = [];
  }
}

async function submitRegistration() {
  if (!getAuthToken()) {
    window.alert('请先登录学生或教师账号后再提交校内报名。');
    return;
  }
  const res = await apiFetch(`/competitions/${route.params.slug}/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationForm)
  });
  const data = await readJsonResponse(res, 'competition_registration_submit');
  if (!res.ok) {
    window.alert(data?.error || '报名提交失败，请先登录学生或教师账号。');
    return;
  }
  await loadRegistrations();
}

watch(() => route.params.slug, loadCompetition);
onMounted(loadCompetition);
</script>

<style scoped>
.competition-detail-page {
  min-height: 100vh;
  color: #0f172a;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
}

.detail-shell {
  width: min(1240px, calc(100vw - 28px));
  margin: 0 auto;
  padding: 104px 0 56px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(79, 70, 229, 0.15);
  border-radius: 12px;
  background: #fff;
  color: #4f46e5;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.back-link:hover {
  transform: translateY(-1px);
  background: rgba(99, 102, 241, 0.05);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.12);
}

.detail-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  margin-top: 18px;
}

.detail-copy,
.decision-panel,
.content-panel,
.decision-card,
.next-step-panel,
.loading-panel {
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03), 
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border-radius: 28px;
}

.detail-copy {
  padding: clamp(28px, 5vw, 52px);
}

.detail-kicker {
  margin: 0 0 14px;
  color: #4f46e5;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-meta span {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

.detail-meta .is-open {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  border-color: transparent;
}

.detail-meta .is-upcoming {
  background: #fef3c7;
  color: #d97706;
  border-color: transparent;
}

.detail-meta .is-live {
  background: #d1fae5;
  color: #065f46;
  border-color: transparent;
}

.detail-meta .is-muted {
  background: #f1f5f9;
  color: #64748b;
  border-color: transparent;
}

.detail-copy h1 {
  margin: 20px 0 0;
  max-width: 780px;
  color: #0f172a;
  font-family: inherit;
  font-size: clamp(2.1rem, 5vw, 4.4rem);
  font-weight: 800;
  line-height: 1;
}

.detail-copy > p:not(.detail-kicker) {
  max-width: 690px;
  margin: 22px 0 0;
  color: #4b5560;
  font-size: 1.06rem;
  line-height: 1.85;
  font-weight: 750;
}

.decision-panel {
  padding: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: #fff;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.3);
}

.panel-kicker,
.panel-heading p,
.decision-card p,
.next-step-panel p {
  margin: 0;
  color: #55d6c2;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.decision-score {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  background: #101312;
}

.decision-score span {
  display: block;
  color: #a8b4b2;
  font-size: 0.76rem;
  font-weight: 900;
}

.decision-score strong {
  display: block;
  margin-top: 6px;
  color: #f7c94b;
  font-family: inherit;
  font-size: 4.2rem;
  line-height: 0.9;
}

.fact-list {
  display: grid;
  gap: 12px;
  margin: 18px 0 0;
}

.fact-list div {
  display: grid;
  gap: 4px;
}

.fact-list dt {
  color: #96a09f;
  font-size: 0.74rem;
  font-weight: 900;
}

.fact-list dd {
  margin: 0;
  color: inherit;
  line-height: 1.55;
  font-weight: 800;
}

.decision-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  min-height: 44px;
  margin-top: 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
}

.decision-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(217, 119, 6, 0.35);
}

.register-action {
  margin-top: 10px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
}

.register-action:hover {
  box-shadow: 0 6px 18px rgba(5, 150, 105, 0.35);
}

.registration-panel {
  margin-top: 20px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03), 
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border-radius: 28px;
  padding: 24px;
}

.registration-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
  margin-top: 16px;
}

.registration-form {
  display: grid;
  gap: 14px;
}

.registration-form label {
  display: grid;
  gap: 6px;
  color: #4b5560;
  font-size: 0.8rem;
  font-weight: 800;
}

.registration-form input,
.registration-form textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 0.75rem 0.85rem;
  color: #0f172a;
  outline: none;
  transition: all 0.3s ease;
}

.registration-form input:focus,
.registration-form textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.registration-form textarea {
  min-height: 90px;
  resize: vertical;
}

.register-submit {
  width: auto;
  margin-top: 0;
  padding: 0 24px;
}

.registration-status {
  display: grid;
  align-content: start;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
  padding: 20px;
}

.registration-status span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.registration-status strong {
  display: block;
  margin-top: 6px;
  font-size: 1.5rem;
  font-weight: 800;
}

.decision-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.detail-status-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;

}

.detail-status-strip article {
  min-height: 82px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

.detail-status-strip span {
  display: block;
  color: #697077;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.detail-status-strip strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-family: inherit;
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 800;
  line-height: 1.05;
}

.decision-card {
  padding: 20px;
}

.decision-card h2 {
  margin: 12px 0 0;
  color: #0f172a;
  font-size: 1.05rem;
  line-height: 1.75;
  font-weight: 800;
}

.accent-card {
  background: #fff8df;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 350px;
  gap: 20px;
  align-items: start;
  margin-top: 20px;
}

.main-column,
.side-column {
  display: grid;
  gap: 20px;
}

.side-column {
  position: sticky;
  top: 92px;
}

.content-panel,
.next-step-panel,
.loading-panel {
  padding: 20px;
}

.panel-heading {
  padding-bottom: 14px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-heading h2 {
  margin: 5px 0 0;
  color: #0f172a;
  font-family: inherit;
  font-size: 1.45rem;
  font-weight: 900;
}

.panel-intro {
  margin: 16px 0 0;
  color: #4b5560;
  font-size: 1rem;
  line-height: 1.78;
  font-weight: 750;
}

.track-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.track-item {
  min-height: 92px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  font-weight: 800;
}

.track-item i {
  color: #6366f1;
}

.timeline {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 14px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.timeline-item span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #6366f1;
  color: #fff;
  font-family: inherit;
  font-weight: 800;
}

.timeline-item h3,
.faq-card h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
}

.timeline-item p,
.faq-card p {
  margin: 5px 0 0;
  color: #64748b;
  line-height: 1.7;
  font-weight: 700;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.faq-card,
.course-item,
.resource-list a {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.faq-card {
  padding: 16px;
}

.course-list,
.resource-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.course-item,
.resource-list a {
  display: grid;
  gap: 6px;
  padding: 13px;
  color: inherit;
  text-decoration: none;
  transition: 0.18s ease;
}

.course-item:hover,
.resource-list a:hover {
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.08);
}

.course-item strong,
.resource-list a span {
  color: #0f172a;
  font-weight: 800;
}

.course-item span {
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.6;
  font-weight: 700;
}

.side-facts dt {
  color: #64748b;
}

.side-facts dd {
  color: #0f172a;
}

.resource-list a {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.resource-list i {
  color: #6366f1;
}

.next-step-panel {
  background: #fffbeb;
  border-color: rgba(251, 191, 36, 0.2);
}

.next-step-panel ol {
  margin: 12px 0 0;
  padding-left: 20px;
  color: #78350f;
  line-height: 1.8;
  font-weight: 700;
}

.muted-note,
.loading-panel {
  color: #64748b;
  line-height: 1.7;
  font-weight: 800;
}

@media (max-width: 1040px) {
  .detail-hero,
  .detail-layout,
  .decision-grid,
  .detail-status-strip {
    grid-template-columns: 1fr;
  }

  .side-column {
    position: static;
  }
}

@media (max-width: 720px) {
  .detail-shell {
    width: min(100vw - 20px, 1240px);
    padding-top: 128px;
  }

  .track-grid,
  .faq-grid {
    grid-template-columns: 1fr;
  }

  .detail-copy,
  .decision-panel,
  .content-panel,
  .decision-card,
  .next-step-panel,
  .loading-panel {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
  }
}
</style>
