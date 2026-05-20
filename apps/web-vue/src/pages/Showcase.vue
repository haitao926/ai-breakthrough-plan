<template>
  <div class="portal-page">
    <SiteNav active="showcase" />

    <main class="portal-shell portal-main">
      <section v-if="featuredStory" class="story-hero">
        <img :src="featuredStory.cover" :alt="featuredStory.title" class="story-hero-cover" />
        <div class="story-hero-copy">
          <p class="poster-eyebrow">Featured Story</p>
          <h1>{{ featuredStory.title }}</h1>
          <p>学生成果页负责证明“课程和项目真的能产出作品”，因此保留案例陈列，并与大模型深度协同创作。</p>
          <div class="meta-row">
            <span class="route-pill">{{ featuredStory.result }}</span>
            <span class="route-pill muted">{{ featuredStory.studentLabel }}</span>
            <span class="ai-badge"><i class="fas fa-magic"></i> HAI Co-Created</span>
          </div>
        </div>
      </section>

      <!-- 优秀成果案例 -->
      <section class="portal-section">
        <div class="section-heading">
          <p class="poster-eyebrow">Gallery</p>
          <h2>成果案例</h2>
        </div>
        <div class="story-grid">
          <article v-for="story in stories" :key="story.slug" class="story-card">
            <div class="story-cover-wrap">
              <img :src="story.cover" :alt="story.title" class="story-cover" />
            </div>
            <div class="story-copy">
              <div class="meta-row">
                <span class="route-pill">{{ story.result }}</span>
                <span class="route-pill muted">{{ story.studentLabel }}</span>
                <span class="ai-badge"><i class="fas fa-magic"></i> HAI Co-Created</span>
              </div>
              <h3>{{ story.title }}</h3>
              <p>{{ story.summary }}</p>
            </div>
          </article>
        </div>
      </section>

      <!-- 学生课题展示台 (Student Project Showcase Wall) -->
      <section class="portal-section" style="margin-top: 56px;">
        <div class="section-heading-row">
          <div class="section-heading">
            <p class="poster-eyebrow">Showcase Wall</p>
            <h2>学生优秀项目展示</h2>
          </div>
          
          <div class="search-control">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                v-model="searchTerm" 
                type="text" 
                placeholder="搜索项目标题、简介或学生姓名..." 
              />
              <button v-if="searchTerm" class="clear-btn" @click="searchTerm = ''">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-if="showcaseLoading" class="showcase-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>正在加载学生作品...</span>
        </div>

        <div v-else-if="filteredShowcase.length === 0" class="showcase-empty">
          <i class="fas fa-folder-open"></i>
          <span>暂无符合条件的学生项目展示</span>
        </div>

        <div v-else class="showcase-grid">
          <article v-for="item in filteredShowcase" :key="item.id" class="showcase-card">
            <div class="showcase-cover-wrap">
              <img
                v-if="item.coverUrl"
                :src="item.coverUrl"
                :alt="item.projectTitle"
                class="showcase-cover"
              />
              <div v-else class="showcase-cover-placeholder">
                <i class="fas fa-cubes"></i>
                <span>HAI TECH LAB</span>
              </div>
              <span class="badge-tag primary">优秀项目</span>
              <span v-if="item.className" class="badge-tag class-label">{{ item.className }}</span>
            </div>

            <div class="showcase-card-body">
              <h3>{{ item.projectTitle }}</h3>
              <p class="summary">{{ item.projectSummary }}</p>
              
              <div class="showcase-card-footer">
                <span class="student-author">
                  <i class="fas fa-user-friends"></i>
                  {{ item.studentName }}
                </span>
                
                <div class="action-links">
                  <template v-if="item.attachments && item.attachments.length">
                    <a
                      v-for="att in item.attachments"
                      :key="att.url"
                      :href="att.url"
                      target="_blank"
                      rel="noreferrer"
                      class="view-artifact-btn"
                    >
                      <i class="fas fa-paperclip"></i>
                      查看成果
                    </a>
                  </template>
                  <span v-else class="no-attachment">无附件</span>
                </div>
              </div>
            </div>
          </article>
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
import { fetchStories } from '@/api/portal';
import { apiFetch, readJsonResponse } from '@/api/client';

const stories = ref([]);
const showcaseItems = ref([]);
const showcaseLoading = ref(true);
const searchTerm = ref('');

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
.story-hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 32px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 36px;
  padding: 32px;
  margin-bottom: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.02);
  align-items: center;
}

.story-hero-cover {
  width: 100%;
  height: 380px;
  object-fit: cover;
  border-radius: 24px;
  transition: transform 0.5s ease;
}

.story-hero:hover .story-hero-cover {
  transform: scale(1.01);
}

.story-hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.story-hero-copy h1 {
  font-size: 2.8rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.story-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.story-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.story-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 25px 50px rgba(99, 102, 241, 0.08);
}

.story-cover-wrap {
  overflow: hidden;
  height: 240px;
}

.story-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.story-card:hover .story-cover {
  transform: scale(1.06);
}

.story-copy {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
}

.story-copy h3 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.story-copy p {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 99px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(99, 102, 241, 0.1));
  border: 1px solid rgba(6, 182, 212, 0.25);
  color: #0891b2;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.05);
}

/* Student Showcase Wall styles */
.section-heading-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-control {
  min-width: 320px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 99px;
  padding: 0 16px;
  min-height: 44px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}

.search-box:focus-within {
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.08);
  background: #fff;
}

.search-box i {
  color: #94a3b8;
  font-size: 0.88rem;
}

.search-box input {
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 0.88rem;
  color: #0f172a;
  width: 100%;
}

.clear-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #94a3b8;
}

.clear-btn:hover {
  color: #64748b;
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.showcase-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.showcase-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 25px 50px rgba(99, 102, 241, 0.08);
}

.showcase-cover-wrap {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #f8fafc;
}

.showcase-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.showcase-card:hover .showcase-cover {
  transform: scale(1.06);
}

.showcase-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(6, 182, 212, 0.05));
  color: #818cf8;
  gap: 8px;
}

.showcase-cover-placeholder i {
  font-size: 2.2rem;
  opacity: 0.6;
}

.showcase-cover-placeholder span {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  opacity: 0.6;
}

.badge-tag {
  position: absolute;
  top: 16px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 5px 10px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.badge-tag.primary {
  left: 16px;
  background: #4f46e5;
  color: #fff;
}

.badge-tag.class-label {
  right: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  color: #475569;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.showcase-card-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
}

.showcase-card-body h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.showcase-card-body .summary {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

.showcase-card-footer {
  margin-top: 10px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.84rem;
}

.student-author {
  font-weight: 750;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.student-author i {
  color: #6366f1;
}

.action-links {
  display: flex;
  gap: 6px;
}

.view-artifact-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.06);
  color: #4f46e5;
  font-weight: 800;
  text-decoration: none;
  font-size: 0.78rem;
  transition: all 0.2s ease;
}

.view-artifact-btn:hover {
  background: rgba(99, 102, 241, 0.12);
  color: #3730a3;
}

.no-attachment {
  color: #94a3b8;
  font-size: 0.78rem;
}

.showcase-loading,
.showcase-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #94a3b8;
  gap: 16px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 28px;
  border: 1px dashed rgba(0, 0, 0, 0.08);
}

.showcase-loading i,
.showcase-empty i {
  font-size: 2rem;
}

.showcase-loading span,
.showcase-empty span {
  font-size: 0.92rem;
  font-weight: 700;
}

@media (max-width: 980px) {
  .story-hero {
    grid-template-columns: 1fr;
    padding: 20px;
  }
  .story-hero-cover {
    height: 260px;
  }
}
</style>
