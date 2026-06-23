<template>
  <aside class="side-panel">
    <div class="panel-title">
      <p>Publish Queue</p>
      <h2>待发布内容</h2>
    </div>
    <button class="primary-btn small full-skill-btn" @click="$emit('set-kind', 'course')">
      <i class="fas fa-book-open"></i> 课程预览
    </button>
    <button class="primary-btn small full-skill-btn" @click="$emit('set-kind', 'project')">
      <i class="fas fa-lightbulb"></i> 项目预览
    </button>
    <button class="primary-btn small full-skill-btn" @click="$emit('set-kind', 'competition')">
      <i class="fas fa-trophy"></i> 赛事预览
    </button>
    <button class="primary-btn small full-skill-btn" @click="$emit('set-kind', 'banner')">
      <i class="fas fa-images"></i> 门户 Banner
    </button>
    <button class="primary-btn small full-skill-btn" @click="$emit('set-kind', 'story')">
      <i class="fas fa-star"></i> 成果故事
    </button>

    <div class="upload-switch">
      <button :class="{ active: uploadKind === 'course' }" @click="$emit('set-kind', 'course')">课程</button>
      <button :class="{ active: uploadKind === 'project' }" @click="$emit('set-kind', 'project')">项目</button>
      <button :class="{ active: uploadKind === 'competition' }" @click="$emit('set-kind', 'competition')">赛事</button>
      <button :class="{ active: uploadKind === 'banner' }" @click="$emit('set-kind', 'banner')">Banner</button>
      <button :class="{ active: uploadKind === 'story' }" @click="$emit('set-kind', 'story')">故事</button>
    </div>

    <template v-if="uploadKind === 'course'">
      <button
        v-for="course in myCourses"
        :key="course.id"
        class="list-item"
        :class="{ active: selectedCourseId === course.id }"
        @click="$emit('select-course', course)"
      >
        <strong>{{ course.title }}</strong>
        <span>{{ course.teacherName || '导师组' }} · {{ course.status === 'published' ? '已发布' : '待发布' }}</span>
      </button>
      <div v-if="!myCourses.length" class="empty-note compact">还没有通过课程 Skill 上传课程。</div>
    </template>

    <template v-else-if="uploadKind === 'project'">
      <button
        v-for="topic in myProjectTopics"
        :key="topic.id"
        class="list-item"
        @click="$emit('select-project-topic', topic)"
      >
        <strong>{{ topic.title }}</strong>
        <span>{{ topic.difficulty || '难度待定' }} · {{ topic.status === 'published' ? '已发布' : '待发布' }}</span>
      </button>
      <div v-if="!myProjectTopics.length" class="empty-note compact">还没有通过项目 Skill 上传题目。</div>
    </template>

    <template v-else-if="uploadKind === 'competition'">
      <button
        v-for="competition in myCompetitions"
        :key="competition.slug"
        class="list-item"
        :class="{ active: selectedCompetitionSlug === competition.slug }"
        @click="$emit('select-competition', competition)"
      >
        <strong>{{ competition.title }}</strong>
        <span>{{ competition.publishStatus === 'published' ? '已发布' : '待发布' }} · 报名 {{ competition.registrationStats?.total || 0 }}</span>
      </button>
      <div v-if="!myCompetitions.length" class="empty-note compact">还没有通过赛事 Skill 整理赛事。</div>
    </template>

    <template v-else-if="uploadKind === 'banner'">
      <button
        v-for="(banner, index) in banners"
        :key="`${banner.title}-${index}`"
        class="list-item"
        :class="{ active: selectedBannerIndex === index }"
        @click="$emit('select-banner', index)"
      >
        <strong>{{ banner.title }}</strong>
        <span>{{ banner.tag || banner.type || 'Banner' }} · {{ banner.targetUrl }}</span>
      </button>
      <div v-if="!banners.length" class="empty-note compact">还没有配置门户 Banner。</div>
    </template>

    <template v-else-if="uploadKind === 'story'">
      <button
        v-for="story in stories"
        :key="story.slug"
        class="list-item"
        :class="{ active: selectedStorySlug === story.slug }"
        @click="$emit('select-story', story)"
      >
        <strong>{{ story.title }}</strong>
        <span>{{ story.result || '成果故事' }}</span>
      </button>
      <div v-if="!stories.length" class="empty-note compact">还没有配置成果故事。</div>
    </template>
  </aside>
</template>

<script setup>
defineProps({
  uploadKind: { type: String, default: 'course' },
  myCourses: { type: Array, default: () => [] },
  selectedCourseId: { type: [String, Number], default: '' },
  myProjectTopics: { type: Array, default: () => [] },
  myCompetitions: { type: Array, default: () => [] },
  selectedCompetitionSlug: { type: String, default: '' },
  banners: { type: Array, default: () => [] },
  selectedBannerIndex: { type: Number, default: -1 },
  stories: { type: Array, default: () => [] },
  selectedStorySlug: { type: String, default: '' }
});

defineEmits([
  'set-kind',
  'select-course',
  'select-project-topic',
  'select-competition',
  'select-banner',
  'select-story'
]);
</script>

<style scoped>
.side-panel {
  position: sticky;
  top: 88px;
  display: grid;
  gap: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.02);
}

.panel-title {
  margin-bottom: 4px;
}

.panel-title p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
}

.panel-title h2 {
  margin: 6px 0 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 16px;
  min-height: 40px;
  padding: 0.55rem 1rem;
  background: var(--color-brand-accent);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(15, 118, 110, 0.15);
  transition: color 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.primary-btn:hover {
  background: var(--color-brand-accent-hover);
  box-shadow: 0 12px 25px rgba(15, 118, 110, 0.25);
}

.small {
  font-size: 0.8rem;
}

.full-skill-btn {
  width: 100%;
}

.upload-switch {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.04);
  padding: 6px;
}

.upload-switch button {
  min-height: 36px;
  border-radius: 12px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.upload-switch button.active {
  background: #fff;
  color: #1e293b;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.list-item {
  display: grid;
  gap: 6px;
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  border: 1px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.list-item:hover,
.list-item.active {
  background: rgba(148, 163, 184, 0.06);
  border-color: rgba(148, 163, 184, 0.1);
}

.list-item strong {
  font-weight: 600;
  color: #0f172a;
}

.list-item span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
}

.empty-note {
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.02);
  padding: 20px;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 800;
  border: 1px dashed rgba(0, 0, 0, 0.08);
}

.empty-note.compact {
  padding: 12px;
  font-size: 0.78rem;
}

@media (max-width: 980px) {
  .side-panel {
    position: static;
  }
}
</style>
