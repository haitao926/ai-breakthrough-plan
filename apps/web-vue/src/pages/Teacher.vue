<template>
  <div class="teacher-ops min-h-screen bg-slate-50 text-slate-900">
    <nav class="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <i class="fas fa-chalkboard-teacher"></i>
          </div>
          <div>
            <div class="text-sm font-black">{{ brandName }}</div>
            <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{{ schoolName }} · 教师运营中心</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <RouterLink to="/" class="nav-link">门户</RouterLink>
          <RouterLink to="/mission-control" class="nav-link">大屏</RouterLink>
          <span class="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold sm:inline-flex">{{ currentUser?.name || '教师' }}</span>
          <button class="icon-btn" @click="logout"><i class="fas fa-sign-out-alt"></i></button>
        </div>
      </div>
    </nav>

    <header class="mx-auto max-w-7xl px-6 py-8">
      <section class="hero-panel">
        <div>
          <p class="kicker">Teacher Operations Desk</p>
          <h1>资源发布与项目干预</h1>
          <p>课程、项目题目、赛事资料由 CLI Skills 写入平台；教师页负责预览发布结果、审核资源上线，并在学生项目卡住时做判断与推动。</p>
        </div>
        <button class="primary-btn" @click="refreshAll">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          刷新数据
        </button>
      </section>

      <section class="todo-grid">
        <button class="todo-card skill-card" @click="activeModule = 'uploads'; uploadKind = 'course'">
          <span>待发布课程</span>
          <strong>{{ pendingCourseCount }}</strong>
          <small>由课程 Skill 写入，等待教师确认</small>
        </button>
        <button class="todo-card skill-card" @click="activeModule = 'uploads'; uploadKind = 'project'">
          <span>待发布项目</span>
          <strong>{{ pendingProjectTopicCount }}</strong>
          <small>由项目 Skill 写入，等待发布到项目广场</small>
        </button>
        <button class="todo-card skill-card" @click="activeModule = 'uploads'; uploadKind = 'competition'">
          <span>待发布赛事</span>
          <strong>{{ pendingCompetitionCount }}</strong>
          <small>由赛事 Skill 整理，等待进入赛事门户</small>
        </button>
        <button class="todo-card" @click="activeModule = 'projects'; activeQueue = 'project_review'">
          <span>项目待干预</span>
          <strong>{{ interventionCount }}</strong>
          <small>阶段待审 {{ stageReviewCount }} · 资源待批 {{ resourceQueueCount }}</small>
        </button>
      </section>

      <section class="module-tabs">
        <button :class="{ active: activeModule === 'uploads' }" @click="activeModule = 'uploads'">
          <i class="fas fa-cloud-arrow-up"></i> 资源发布台
        </button>
        <button :class="{ active: activeModule === 'projects' }" @click="activeModule = 'projects'">
          <i class="fas fa-diagram-project"></i> 项目干预台
        </button>
      </section>
    </header>

    <main class="mx-auto max-w-7xl px-6 pb-14">
      <section v-if="activeModule === 'uploads'" class="ops-layout">
        <aside class="side-panel">
          <div class="panel-title">
            <p>Review queue</p>
            <h2>待发布内容</h2>
          </div>
          <button class="primary-btn small full-skill-btn" @click="uploadKind = 'course'">
            <i class="fas fa-book-open"></i> 课程预览
          </button>
          <button class="primary-btn small full-skill-btn" @click="uploadKind = 'project'">
            <i class="fas fa-lightbulb"></i> 项目预览
          </button>
          <button class="primary-btn small full-skill-btn" @click="uploadKind = 'competition'">
            <i class="fas fa-trophy"></i> 赛事预览
          </button>
          <button class="primary-btn small full-skill-btn" @click="uploadKind = 'banner'">
            <i class="fas fa-images"></i> 门户 Banner
          </button>
          <button class="primary-btn small full-skill-btn" @click="uploadKind = 'story'">
            <i class="fas fa-star"></i> 成果故事
          </button>
          <div class="upload-switch">
            <button :class="{ active: uploadKind === 'course' }" @click="uploadKind = 'course'">课程</button>
            <button :class="{ active: uploadKind === 'project' }" @click="uploadKind = 'project'">项目</button>
            <button :class="{ active: uploadKind === 'competition' }" @click="uploadKind = 'competition'">赛事</button>
            <button :class="{ active: uploadKind === 'banner' }" @click="uploadKind = 'banner'">Banner</button>
            <button :class="{ active: uploadKind === 'story' }" @click="uploadKind = 'story'">故事</button>
          </div>
          <button
            v-if="uploadKind === 'course'"
            v-for="course in myCourses"
            :key="course.id"
            class="list-item"
            :class="{ active: selectedCourseId === course.id }"
            @click="selectCourse(course)"
          >
            <strong>{{ course.title }}</strong>
            <span>{{ course.teacherName || '导师组' }} · {{ course.status === 'published' ? '已发布' : '待发布' }}</span>
          </button>
          <div v-if="uploadKind === 'course' && !myCourses.length" class="empty-note compact">还没有通过课程 Skill 上传课程。</div>
          <button
            v-if="uploadKind === 'project'"
            v-for="topic in myProjectTopics"
            :key="topic.id"
            class="list-item"
            @click="editProjectTopic(topic)"
          >
            <strong>{{ topic.title }}</strong>
            <span>{{ topic.difficulty || '难度待定' }} · {{ topic.status === 'published' ? '已发布' : '待发布' }}</span>
          </button>
          <div v-if="uploadKind === 'project' && !myProjectTopics.length" class="empty-note compact">还没有通过项目 Skill 上传题目。</div>
          <button
            v-if="uploadKind === 'competition'"
            v-for="competition in myCompetitions"
            :key="competition.slug"
            class="list-item"
            :class="{ active: selectedCompetitionSlug === competition.slug }"
            @click="selectCompetition(competition)"
          >
            <strong>{{ competition.title }}</strong>
            <span>{{ competition.publishStatus === 'published' ? '已发布' : '待发布' }} · 报名 {{ competition.registrationStats?.total || 0 }}</span>
          </button>
          <div v-if="uploadKind === 'competition' && !myCompetitions.length" class="empty-note compact">还没有通过赛事 Skill 整理赛事。</div>
          <button
            v-if="uploadKind === 'banner'"
            v-for="(banner, index) in banners"
            :key="`${banner.title}-${index}`"
            class="list-item"
            :class="{ active: selectedBannerIndex === index }"
            @click="selectBanner(index)"
          >
            <strong>{{ banner.title }}</strong>
            <span>{{ banner.tag || banner.type || 'Banner' }} · {{ banner.targetUrl }}</span>
          </button>
          <div v-if="uploadKind === 'banner' && !banners.length" class="empty-note compact">还没有配置门户 Banner。</div>
          <button
            v-if="uploadKind === 'story'"
            v-for="story in stories"
            :key="story.slug"
            class="list-item"
            :class="{ active: selectedStorySlug === story.slug }"
            @click="selectStory(story)"
          >
            <strong>{{ story.title }}</strong>
            <span>{{ story.result || '成果故事' }}</span>
          </button>
          <div v-if="uploadKind === 'story' && !stories.length" class="empty-note compact">还没有配置成果故事。</div>
        </aside>

        <section class="main-panel">
          <template v-if="uploadKind === 'course'">
            <div class="panel-title row-title">
              <div>
                <p>Course Skill output</p>
                <h2>{{ selectedCourse?.title || '等待课程 Skill 上传结果' }}</h2>
              </div>
              <div v-if="selectedCourse" class="button-row">
                <button class="secondary-btn" type="button" :disabled="courseSaving" @click="saveCourseAs('draft')">保留草稿</button>
                <button class="secondary-btn danger" type="button" :disabled="courseSaving" @click="saveCourseAs('archived')">归档</button>
                <button class="primary-btn small" type="button" :disabled="courseSaving || selectedCourse.status === 'published'" @click="saveCourseAs('published')">
                  {{ selectedCourse.status === 'published' ? '已发布' : '确认发布' }}
                </button>
              </div>
            </div>

            <section v-if="selectedCourse" class="preview-layout">
              <article class="preview-panel">
                <div class="preview-head">
                  <span class="status-pill">{{ statusLabel(selectedCourse.status) }}</span>
                  <span>{{ selectedCourse.id }}</span>
                </div>
                <h3>{{ selectedCourse.title }}</h3>
                <p>{{ selectedCourse.summary || selectedCourse.description || '课程 Skill 尚未提供简介。' }}</p>
                <div class="metric-strip">
                  <span>课时 {{ selectedCourseLessons.length }}</span>
                  <span>资料 {{ selectedCourse.materials?.length || 0 }}</span>
                  <span>作业 {{ assignments.length }}</span>
                  <span>{{ selectedCourse.pace || '节奏待补齐' }}</span>
                </div>
              </article>

              <article class="preview-panel">
                <h3>发布前检查</h3>
                <ul class="check-list">
                  <li :class="{ ok: Boolean(selectedCourse.summary || selectedCourse.description) }">课程简介</li>
                  <li :class="{ ok: selectedCourseLessons.length > 0 }">课时结构</li>
                  <li :class="{ ok: (selectedCourse.materials?.length || 0) > 0 }">资料清单</li>
                  <li :class="{ ok: assignments.length > 0 }">作业入口</li>
                </ul>
              </article>
            </section>

            <section v-if="selectedCourse" class="data-grid">
              <article v-for="lesson in selectedCourseLessons" :key="lesson.id" class="data-card">
                <strong>{{ lesson.title }}</strong>
                <span>{{ lesson.duration || 0 }} 分钟 · {{ lesson.id }}</span>
                <p>{{ lesson.description || lesson.essentialQuestion }}</p>
              </article>
              <article v-for="assignment in assignments" :key="`assignment-${assignment.id}`" class="data-card">
                <strong>{{ assignment.title }}</strong>
                <span>{{ lessonName(assignment.lessonId) }} · {{ statusLabel(assignment.status) }}</span>
                <p>{{ assignment.requirements || assignment.description || '作业要求待补齐。' }}</p>
                <button class="secondary-btn full" @click="loadAssignmentSubmissions(assignment)">查看提交情况</button>
              </article>
            </section>

            <div v-else class="empty-note">课程 Skill 上传完成后，会在这里出现课程结构、资料、作业和发布检查结果。</div>
            <section v-if="selectedAssignment" class="review-panel">
              <div class="panel-title row-title">
                <div>
                  <p>Review</p>
                  <h2>{{ selectedAssignment.title }} · 提交情况</h2>
                </div>
                <span class="status-pill">{{ submissions.length }} 份提交</span>
              </div>
              <div class="submission-list">
                <article v-for="submission in submissions" :key="submission.id" class="submission-card">
                  <div>
                    <strong>{{ submission.studentName || submission.studentEmail }}</strong>
                    <span>{{ submission.status }} · {{ formatDate(submission.updatedAt) }}</span>
                    <p v-if="submission.content">{{ submission.content }}</p>
                    <a v-if="submission.link" :href="submission.link" target="_blank" rel="noreferrer">{{ submission.link }}</a>
                    <p v-if="submission.attachmentNote">附件说明：{{ submission.attachmentNote }}</p>
                  </div>
                  <form class="review-form" @submit.prevent="reviewAssignmentSubmission(submission)">
                    <input v-model="reviewDrafts[submission.id].score" type="number" min="0" max="100" placeholder="分数" />
                    <select v-model="reviewDrafts[submission.id].status">
                      <option value="reviewed">通过</option>
                      <option value="needs_changes">退回修改</option>
                    </select>
                    <textarea v-model="reviewDrafts[submission.id].feedback" placeholder="反馈"></textarea>
                    <button class="primary-btn small" type="submit">提交批改</button>
                  </form>
                </article>
              </div>
            </section>
          </template>

          <template v-else-if="uploadKind === 'project'">
            <div class="panel-title row-title">
              <div>
                <p>Project Skill output</p>
                <h2>{{ selectedProjectTopic?.title || '等待项目 Skill 上传结果' }}</h2>
              </div>
              <div v-if="selectedProjectTopic" class="button-row">
                <button class="secondary-btn" type="button" @click="saveProjectTopicAs('draft')">保留草稿</button>
                <button class="secondary-btn danger" type="button" @click="saveProjectTopicAs('archived')">归档</button>
                <button class="primary-btn small" type="button" :disabled="selectedProjectTopic.status === 'published'" @click="saveProjectTopicAs('published')">
                  {{ selectedProjectTopic.status === 'published' ? '已发布' : '确认发布' }}
                </button>
              </div>
            </div>

            <section v-if="selectedProjectTopic" class="preview-layout">
              <article class="preview-panel">
                <div class="preview-head">
                  <span class="status-pill">{{ statusLabel(selectedProjectTopic.status) }}</span>
                  <span>{{ selectedProjectTopic.difficulty || '难度待定' }}</span>
                </div>
                <h3>{{ selectedProjectTopic.title }}</h3>
                <p>{{ selectedProjectTopic.description || '项目 Skill 尚未提供项目描述。' }}</p>
                <div class="metric-strip">
                  <span>建议人数 {{ selectedProjectTopic.suggestedTeamSize || '-' }}</span>
                  <span>关联课程 {{ selectedProjectTopic.relatedCourseId || '-' }}</span>
                  <span>关联赛事 {{ selectedProjectTopic.relatedCompetitionSlug || '-' }}</span>
                </div>
              </article>
              <article class="preview-panel">
                <h3>发布前检查</h3>
                <ul class="check-list">
                  <li :class="{ ok: Boolean(selectedProjectTopic.description) }">项目描述</li>
                  <li :class="{ ok: Boolean(selectedProjectTopic.goals) }">项目目标</li>
                  <li :class="{ ok: Boolean(selectedProjectTopic.deliverables) }">交付物</li>
                  <li :class="{ ok: Boolean(selectedProjectTopic.difficulty) }">难度标注</li>
                </ul>
              </article>
            </section>

            <section v-if="selectedProjectTopic" class="preview-panel">
              <h3>交付与目标</h3>
              <p v-if="selectedProjectTopic.background"><strong>背景：</strong>{{ selectedProjectTopic.background }}</p>
              <p v-if="selectedProjectTopic.goals"><strong>目标：</strong>{{ selectedProjectTopic.goals }}</p>
              <p v-if="selectedProjectTopic.deliverables"><strong>交付物：</strong>{{ selectedProjectTopic.deliverables }}</p>
            </section>

            <div class="data-grid">
              <article v-for="topic in myProjectTopics" :key="topic.id" class="data-card">
                <div class="data-card-head">
                  <div>
                    <strong>{{ topic.title }}</strong>
                    <span>{{ topic.difficulty || '难度待定' }} · {{ statusLabel(topic.status) }}</span>
                  </div>
                  <button class="text-btn" @click="editProjectTopic(topic)">预览</button>
                </div>
                <p>{{ topic.description }}</p>
              </article>
            </div>
            <div v-if="!selectedProjectTopic" class="empty-note">项目 Skill 上传完成后，会在这里出现题目背景、目标、人数、交付物和发布检查结果。</div>
          </template>

          <template v-else-if="uploadKind === 'competition'">
            <div class="panel-title row-title">
              <div>
                <p>Competition Skill output</p>
                <h2>{{ selectedCompetition?.title || '等待赛事 Skill 上传结果' }}</h2>
              </div>
              <div v-if="selectedCompetition" class="button-row">
                <button class="secondary-btn" type="button" @click="saveCompetitionAs('draft')">保留草稿</button>
                <button class="secondary-btn danger" type="button" @click="saveCompetitionAs('archived')">归档</button>
                <button class="primary-btn small" type="button" :disabled="selectedCompetition.publishStatus === 'published'" @click="saveCompetitionAs('published')">
                  {{ selectedCompetition.publishStatus === 'published' ? '已发布' : '确认发布' }}
                </button>
              </div>
            </div>
            <section v-if="selectedCompetition" class="preview-layout">
              <article class="preview-panel">
                <div class="preview-head">
                  <span class="status-pill">{{ selectedCompetition.publishStatus === 'published' ? '已发布' : '待发布' }}</span>
                  <span>{{ selectedCompetition.status || '报名中' }}</span>
                </div>
                <h3>{{ selectedCompetition.title }}</h3>
                <p>{{ selectedCompetition.fitSummary || selectedCompetition.tagline || '赛事 Skill 尚未提供摘要。' }}</p>
                <div class="metric-strip">
                  <span>时间 {{ selectedCompetition.dateRange || '-' }}</span>
                  <span>主办 {{ selectedCompetition.host || '-' }}</span>
                  <span>地点 {{ selectedCompetition.location || '-' }}</span>
                </div>
              </article>
              <article class="preview-panel">
                <h3>发布前检查</h3>
                <ul class="check-list">
                  <li :class="{ ok: Boolean(selectedCompetition.title) }">赛事标题</li>
                  <li :class="{ ok: Boolean(selectedCompetition.dateRange) }">时间范围</li>
                  <li :class="{ ok: Boolean(selectedCompetition.host) }">主办单位</li>
                  <li :class="{ ok: Boolean(selectedCompetition.fitSummary || selectedCompetition.tagline) }">赛事摘要</li>
                </ul>
              </article>
            </section>

            <section v-if="selectedCompetition" class="preview-panel">
              <h3>报名信息</h3>
              <p><strong>报名状态：</strong>{{ selectedCompetition.status || '-' }}</p>
              <p><strong>关联课程：</strong>{{ (selectedCompetition.relatedCourses || []).map(item => item.title).join('、') || '-' }}</p>
              <p><strong>补充说明：</strong>{{ selectedCompetition.whyJoin || selectedCompetition.prepAdvice || '暂无补充说明。' }}</p>
            </section>

            <section v-if="selectedCompetition" class="uploaded-status">
              <div class="metric-strip">
                <span>总报名 {{ registrationStats.total || 0 }}</span>
                <span>待确认 {{ registrationStats.pending || 0 }}</span>
                <span>需补材料 {{ registrationStats.needsMaterials || 0 }}</span>
                <span>已通过 {{ registrationStats.approved || 0 }}</span>
              </div>
              <div class="submission-list">
                <article v-for="registration in registrations" :key="registration.id" class="submission-card">
                  <div>
                    <strong>{{ registration.teamName || registration.studentName || '个人报名' }}</strong>
                    <span>{{ registration.className || '未填班级' }} · {{ registration.status }}</span>
                    <p>成员：{{ registration.members || registration.studentName }}</p>
                    <p>材料：{{ registration.materials || '未提交材料说明' }}</p>
                  </div>
                  <div class="button-row">
                    <button class="secondary-btn" @click="reviewRegistration(registration, 'approved')">通过</button>
                    <button class="secondary-btn" @click="reviewRegistration(registration, 'needs_materials')">补材料</button>
                    <button class="secondary-btn danger" @click="reviewRegistration(registration, 'rejected')">驳回</button>
                  </div>
                </article>
                <div v-if="!registrations.length" class="empty-note">这项赛事还没有学生报名。</div>
              </div>
            </section>
            <section v-if="myCompetitions.length" class="data-grid">
              <article v-for="competition in myCompetitions" :key="competition.slug" class="data-card">
                <div class="data-card-head">
                  <div>
                    <strong>{{ competition.title }}</strong>
                    <span>{{ statusLabel(competition.publishStatus) }} · 报名 {{ competition.registrationStats?.total || 0 }}</span>
                  </div>
                  <button class="text-btn" @click="selectCompetition(competition)">预览</button>
                </div>
              </article>
            </section>
            <div v-if="!selectedCompetition" class="empty-note">赛事 Skill 写入平台后，会在这里展示赛事摘要、报名信息和发布确认状态。</div>
          </template>

          <template v-else-if="uploadKind === 'banner'">
            <div class="panel-title row-title">
              <div>
                <p>Portal banner manager</p>
                <h2>{{ selectedBannerIndex >= 0 ? '编辑门户 Banner' : '新建门户 Banner' }}</h2>
              </div>
              <div class="button-row">
                <button class="secondary-btn" type="button" @click="startBannerCreate">新建</button>
                <button v-if="selectedBannerIndex >= 0" class="secondary-btn danger" type="button" @click="deleteBanner">删除</button>
                <button class="primary-btn small" type="button" @click="saveBanner">保存 Banner</button>
              </div>
            </div>
            <section class="preview-panel">
              <div class="form-grid">
                <label>标题<input v-model="bannerForm.title" placeholder="例如：高一 AI 成果展" /></label>
                <label>标签<input v-model="bannerForm.tag" placeholder="展示 / 赛事 / 课程" /></label>
                <label>类型<input v-model="bannerForm.type" placeholder="feature" /></label>
                <label>优先级<input v-model.number="bannerForm.priority" type="number" min="0" /></label>
                <label>图片地址<input v-model="bannerForm.image" placeholder="/assets/banners/..." /></label>
                <label>目标链接<input v-model="bannerForm.targetUrl" placeholder="/showcase" /></label>
              </div>
            </section>
            <section class="data-grid">
              <article v-for="(banner, index) in banners" :key="`${banner.title}-${index}`" class="data-card">
                <div class="data-card-head">
                  <div>
                    <strong>{{ banner.title }}</strong>
                    <span>{{ banner.tag || banner.type }} · {{ banner.targetUrl }}</span>
                  </div>
                  <button class="text-btn" @click="selectBanner(index)">编辑</button>
                </div>
              </article>
            </section>
          </template>

          <template v-else-if="uploadKind === 'story'">
            <div class="panel-title row-title">
              <div>
                <p>Portal story manager</p>
                <h2>{{ selectedStorySlug ? '编辑成果故事' : '新建成果故事' }}</h2>
              </div>
              <div class="button-row">
                <button class="secondary-btn" type="button" @click="startStoryCreate">新建</button>
                <button v-if="selectedStorySlug" class="secondary-btn danger" type="button" @click="deleteStory">删除</button>
                <button class="primary-btn small" type="button" @click="saveStory">保存故事</button>
              </div>
            </div>
            <section class="preview-panel">
              <div class="form-grid">
                <label>标题<input v-model="storyForm.title" placeholder="成果故事标题" /></label>
                <label>Slug<input v-model="storyForm.slug" :disabled="Boolean(selectedStorySlug)" placeholder="story-slug" /></label>
                <label>学生/团队<input v-model="storyForm.studentLabel" placeholder="高一某团队" /></label>
                <label>成果标签<input v-model="storyForm.result" placeholder="市级展示 / 校内路演" /></label>
                <label>关联赛事<input v-model="storyForm.relatedCompetitionSlug" placeholder="competition-slug" /></label>
                <label>关联课程<input v-model="storyForm.relatedCourseIdsText" placeholder="project1, robotics-club" /></label>
                <label>封面<input v-model="storyForm.cover" placeholder="/assets/portal/..." /></label>
                <label>精选<select v-model="storyForm.featured"><option :value="false">否</option><option :value="true">是</option></select></label>
              </div>
              <label class="mt-4 block">摘要<textarea v-model="storyForm.summary" placeholder="简要描述学生成果、过程与亮点"></textarea></label>
            </section>
            <section class="data-grid">
              <article v-for="story in stories" :key="story.slug" class="data-card">
                <div class="data-card-head">
                  <div>
                    <strong>{{ story.title }}</strong>
                    <span>{{ story.result || '成果故事' }}</span>
                  </div>
                  <button class="text-btn" @click="selectStory(story)">编辑</button>
                </div>
                <p>{{ story.summary }}</p>
              </article>
            </section>
          </template>
        </section>
      </section>

      <section v-else class="ops-layout">
        <aside class="side-panel">
          <div class="panel-title">
            <p>Review queues</p>
            <h2>项目干预队列</h2>
          </div>
          <button
            v-for="queue in projectQueues"
            :key="queue.key"
            class="list-item"
            :class="{ active: activeQueue === queue.key }"
            @click="activeQueue = queue.key"
          >
            <strong>{{ queue.label }}</strong>
            <span>{{ queue.count }} 个项目</span>
          </button>

          <div class="queue-list">
            <button
              v-for="project in filteredReviewProjects"
              :key="project.id"
              class="project-queue-card"
              :class="{ active: selectedReviewProjectId === project.id }"
              @click="selectReviewProject(project.id)"
            >
              <div class="queue-head">
                <strong>{{ project.title }}</strong>
                <span class="status-pill">{{ statusLabel(project.status) }}</span>
              </div>
              <p>{{ project.class_name || '未分班' }} · {{ project.memberNames?.join('、') || project.team_members || '成员待补齐' }}</p>
              <div class="queue-meta">
                <span>提交 {{ project.pendingSubmissionCount || 0 }}</span>
                <span>里程碑 {{ project.pendingMilestoneCount || 0 }}</span>
                <span>资源 {{ project.resourcesPendingCount || 0 }}</span>
              </div>
            </button>
            <div v-if="!filteredReviewProjects.length" class="empty-note compact">当前队列没有项目。</div>
          </div>
        </aside>

        <section class="main-panel intervention-workbench">
          <div class="panel-title row-title">
            <div>
              <p>Intervention dossier</p>
              <h2>{{ reviewDossier?.project?.title || '选择一个学生项目' }}</h2>
            </div>
            <button v-if="reviewDossier?.project" class="secondary-btn" @click="openProject(reviewDossier.project)">
              学生视图
            </button>
          </div>

          <div v-if="reviewDossierLoading" class="empty-note">正在整理项目审核包...</div>

          <template v-else-if="reviewDossier?.project">
            <section class="preview-layout">
              <article class="preview-panel">
                <div class="preview-head">
                  <span class="status-pill">{{ statusLabel(reviewDossier.project.status) }}</span>
                  <span>{{ formatDate(reviewDossier.project.updated_at) }}</span>
                </div>
                <h3>{{ reviewDossier.project.title }}</h3>
                <p>{{ reviewDossier.project.summary || '学生尚未填写项目摘要。' }}</p>
                <div class="metric-strip">
                  <span>{{ reviewDossier.project.class_name || '未分班' }}</span>
                  <span>成员 {{ reviewDossier.members?.length || 0 }}</span>
                  <span>进度 {{ reviewDossier.meta?.milestoneProgress?.percent || 0 }}%</span>
                  <span>资源待批 {{ reviewDossier.meta?.resourcesPendingCount || 0 }}</span>
                </div>
                <a v-if="reviewDossier.project.gitea_repo_url" class="repo-link" :href="reviewDossier.project.gitea_repo_url" target="_blank" rel="noreferrer">
                  {{ reviewDossier.project.gitea_repo_url }}
                </a>
              </article>

              <article class="preview-panel">
                <h3>教师动作</h3>
                <div class="button-row">
                  <button
                    v-for="action in statusActions"
                    :key="action.status"
                    class="secondary-btn"
                    :class="{ danger: action.danger }"
                    :disabled="!canManage || actionWorking"
                    @click="advanceProjectStatus(action.status, action.note)"
                  >
                    {{ action.label }}
                  </button>
                </div>
                <textarea v-model="projectActionNote" placeholder="状态推进说明，可选"></textarea>
              </article>
            </section>

            <section class="workbench-grid">
              <article class="workbench-card">
                <div class="panel-title row-title">
                  <div>
                    <p>Stage submissions</p>
                    <h3>阶段提交审核</h3>
                  </div>
                  <span class="status-pill">{{ reviewDossier.submissions?.length || 0 }} 份</span>
                </div>
                <div class="submission-list compact-list">
                  <article v-for="submission in reviewDossier.submissions" :key="submission.id" class="submission-card review-submission">
                    <div>
                      <strong>{{ submissionTypeLabel(submission.type) }} · {{ submission.title || '未命名提交' }}</strong>
                      <span>{{ statusLabel(submission.status) }} · {{ formatDate(submission.created_at) }}</span>
                      <p>{{ submission.content || submissionSummary(submission) || '没有正文摘要。' }}</p>
                      <div class="attachment-row" v-if="submission.attachments?.length">
                        <a v-for="attachment in submission.attachments" :key="attachment.path" :href="attachment.url" target="_blank" rel="noreferrer">
                          {{ attachment.name || '附件' }}
                        </a>
                      </div>
                    </div>
                    <form class="review-form" @submit.prevent="reviewProjectSubmission(submission)">
                      <select v-model="projectReviewDrafts[submission.id].status">
                        <option value="reviewed">通过</option>
                        <option value="needs_changes">退回修改</option>
                      </select>
                      <textarea v-model="projectReviewDrafts[submission.id].feedback" placeholder="退回必须填写反馈，通过可选"></textarea>
                      <button class="primary-btn small" type="submit" :disabled="!canManage || actionWorking">提交审核</button>
                    </form>
                  </article>
                  <div v-if="!reviewDossier.submissions?.length" class="empty-note compact">还没有阶段提交。</div>
                </div>
              </article>

              <article class="workbench-card">
                <div class="panel-title row-title">
                  <div>
                    <p>Milestones</p>
                    <h3>里程碑验收</h3>
                  </div>
                  <span class="status-pill">{{ reviewDossier.meta?.milestoneProgress?.done || 0 }}/{{ reviewDossier.meta?.milestoneProgress?.total || 0 }}</span>
                </div>
                <div class="submission-list compact-list">
                  <article v-for="milestone in reviewDossier.milestones" :key="milestone.id" class="mini-review-card">
                    <div>
                      <strong>{{ milestone.title }}</strong>
                      <span>{{ milestone.description || '未分阶段' }} · {{ statusLabel(milestone.status) }}</span>
                      <p>{{ milestone.deliverables?.output || milestone.teacher_comment || '暂无交付说明。' }}</p>
                    </div>
                    <div class="button-row">
                      <button class="secondary-btn" :disabled="!canManage || actionWorking" @click="reviewMilestone(milestone, 'approved')">验收</button>
                      <button class="secondary-btn danger" :disabled="!canManage || actionWorking" @click="reviewMilestone(milestone, 'rejected')">退回</button>
                    </div>
                  </article>
                  <div v-if="!reviewDossier.milestones?.length" class="empty-note compact">学生还没有拆解里程碑。</div>
                </div>
              </article>

              <article class="workbench-card">
                <div class="panel-title row-title">
                  <div>
                    <p>Resources</p>
                    <h3>资源申请</h3>
                  </div>
                  <span class="status-pill">{{ reviewDossier.resources?.length || 0 }} 条</span>
                </div>
                <div class="submission-list compact-list">
                  <article v-for="resource in reviewDossier.resources" :key="resource.id" class="mini-review-card">
                    <div>
                      <strong>{{ resource.item_name }}</strong>
                      <span>{{ resource.type }} · 数量 {{ resource.quantity }} · {{ statusLabel(resource.status) }}</span>
                      <p>{{ resource.reason || '未填写申请理由。' }}</p>
                    </div>
                    <div class="button-row">
                      <button class="secondary-btn" :disabled="!canManage || actionWorking || resource.status !== 'pending'" @click="auditResource(resource.id, 'approved')">同意</button>
                      <button class="secondary-btn danger" :disabled="!canManage || actionWorking || resource.status !== 'pending'" @click="auditResource(resource.id, 'rejected')">驳回</button>
                    </div>
                  </article>
                  <div v-if="!reviewDossier.resources?.length" class="empty-note compact">没有资源申请。</div>
                </div>
              </article>

              <article class="workbench-card">
                <div class="panel-title">
                  <p>Implementation logs</p>
                  <h3>实施日志</h3>
                </div>
                <div class="timeline-list">
                  <div v-for="log in reviewDossier.implementationLogs?.slice(0, 6)" :key="log.id" class="timeline-item">
                    <strong>{{ log.author_name || '学生' }}</strong>
                    <span>{{ formatDate(log.created_at) }}</span>
                    <p>{{ log.content }}</p>
                  </div>
                  <div v-if="!reviewDossier.implementationLogs?.length" class="empty-note compact">还没有实施日志。</div>
                </div>
              </article>
            </section>
          </template>

          <div v-else class="empty-note">学生提交立项、中期、结题、里程碑或资源申请后，教师会在这里完成审核与状态推进。</div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { apiFetch, readJsonResponse } from '@/api/client';
import { brandName, schoolName } from '@/constants/brand';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { useProjectStore } from '@/stores/project';
import { formatDate } from '@/utils/format';

const router = useRouter();
const authStore = useAuthStore();
const notification = useNotificationStore();
const projectStore = useProjectStore();
authStore.hydrate();

const { user: currentUser } = storeToRefs(authStore);
const { list: projects } = storeToRefs(projectStore);

const activeModule = ref('uploads');
const uploadKind = ref('course');
const activeQueue = ref('project_review');
const loading = ref(false);
const courses = ref([]);
const selectedCourseId = ref('');
const selectedCourseLessons = ref([]);
const assignments = ref([]);
const selectedAssignment = ref(null);
const submissions = ref([]);
const competitions = ref([]);
const selectedCompetitionSlug = ref('');
const registrations = ref([]);
const registrationStats = ref({});
const resources = ref([]);
const projectTopics = ref([]);
const banners = ref([]);
const stories = ref([]);
const selectedBannerIndex = ref(-1);
const selectedStorySlug = ref('');
const reviewDrafts = reactive({});
const projectReviewDrafts = reactive({});
const courseSaving = ref(false);
const assignmentSaving = ref(false);
const selectedProjectTopicId = ref('');
const reviewQueue = ref([]);
const reviewDossier = ref(null);
const reviewDossierLoading = ref(false);
const selectedReviewProjectId = ref('');
const actionWorking = ref(false);
const projectActionNote = ref('');

const courseForm = reactive({
  mode: 'edit',
  id: '',
  title: '',
  teacherName: '',
  summary: '',
  audience: '',
  pace: '',
  learningObjectivesText: '',
  status: 'draft'
});
const assignmentForm = reactive({
  id: null,
  title: '',
  lessonId: '',
  dueAt: '',
  submitType: 'mixed',
  requirements: '',
  status: 'published'
});
const competitionForm = reactive({
  editing: false,
  title: '',
  slug: '',
  status: '报名中',
  publishStatus: 'draft',
  dateRange: '',
  host: '',
  location: '',
  fitSummary: '',
  relatedCourseIdsText: ''
});
const competitionRawText = ref('');
const bannerForm = reactive({
  title: '',
  type: 'feature',
  tag: '',
  image: '',
  targetUrl: '',
  priority: 999
});
const storyForm = reactive({
  title: '',
  slug: '',
  studentLabel: '',
  summary: '',
  result: '',
  relatedCompetitionSlug: '',
  relatedCourseIdsText: '',
  cover: '',
  featured: false
});
const projectTopicForm = reactive({
  id: null,
  title: '',
  description: '',
  difficulty: '',
  suggestedTeamSize: '',
  deliverables: '',
  status: 'published'
});

const currentTeacherId = computed(() => Number(currentUser.value?.id || 0));
const canManage = computed(() => currentUser.value?.role === 'teacher');
const isOwnedByCurrentTeacher = item => {
  const ownerId = item?.createdBy || item?.created_by;
  return !ownerId || Number(ownerId) === currentTeacherId.value;
};
const myCourses = computed(() => courses.value.filter(isOwnedByCurrentTeacher));
const selectedCourse = computed(() => courses.value.find(item => item.id === selectedCourseId.value) || null);
const selectedCompetition = computed(() => competitions.value.find(item => item.slug === selectedCompetitionSlug.value) || null);
const selectedProjectTopic = computed(() => projectTopics.value.find(item => String(item.id) === String(selectedProjectTopicId.value)) || null);
const myProjectTopics = computed(() => projectTopics.value.filter(isOwnedByCurrentTeacher));
const myCompetitions = computed(() => competitions.value.filter(isOwnedByCurrentTeacher));
const pendingCourseCount = computed(() => myCourses.value.filter(item => item.status !== 'published').length);
const pendingProjectTopicCount = computed(() => myProjectTopics.value.filter(item => item.status !== 'published').length);
const pendingCompetitionCount = computed(() => myCompetitions.value.filter(item => item.publishStatus !== 'published').length);
const pendingAssignmentReviewCount = computed(() => assignments.value.reduce((sum, item) => sum + (item.stats?.pendingReview || 0), 0));
const pendingRegistrationCount = computed(() => competitions.value.reduce((sum, item) => sum + (item.registrationStats?.pending || 0), 0));
const pendingResourceCount = computed(() => resources.value.length);
const reviewProjects = computed(() => reviewQueue.value);
const projectReviewCount = computed(() => reviewProjects.value.filter(item => item.reviewBucket === 'project_review').length);
const stageReviewCount = computed(() => reviewProjects.value.filter(item => item.reviewBucket === 'stage_review').length);
const resourceQueueCount = computed(() => reviewProjects.value.filter(item => item.reviewBucket === 'resource_pending').length);
const interventionCount = computed(() => reviewProjects.value.length);
const activeStudentProjectCount = computed(() => projects.value.filter(item => item.status === 'in_progress').length);
const rejectedStudentProjectCount = computed(() => projects.value.filter(item => item.status === 'rejected').length);
const projectQueues = computed(() => [
  { key: 'project_review', label: '待立项审核', count: reviewProjects.value.filter(item => item.reviewBucket === 'project_review').length },
  { key: 'stage_review', label: '阶段待审核', count: reviewProjects.value.filter(item => item.reviewBucket === 'stage_review').length },
  { key: 'active', label: '进行中', count: reviewProjects.value.filter(item => item.reviewBucket === 'active').length },
  { key: 'attention', label: '需关注', count: reviewProjects.value.filter(item => item.reviewBucket === 'attention').length },
  { key: 'resource_pending', label: '资源待审批', count: reviewProjects.value.filter(item => item.reviewBucket === 'resource_pending').length },
  { key: 'archived', label: '已归档', count: reviewProjects.value.filter(item => item.reviewBucket === 'archived').length }
]);
const filteredReviewProjects = computed(() => reviewProjects.value.filter(item => item.reviewBucket === activeQueue.value));
const statusActions = computed(() => {
  const current = reviewDossier.value?.project?.status || '';
  const items = [];
  if (current === 'submitted') {
    items.push({ status: 'reviewing', label: '进入审核', note: '教师进入立项审核', danger: false });
    items.push({ status: 'rejected', label: '退回立项', note: '立项不通过，需修改后再提', danger: true });
  } else if (current === 'reviewing') {
    items.push({ status: 'approved', label: '通过立项', note: '立项通过', danger: false });
    items.push({ status: 'rejected', label: '退回立项', note: '立项不通过，需修改后再提', danger: true });
  } else if (current === 'approved') {
    items.push({ status: 'in_progress', label: '推进实施', note: '允许进入实施阶段', danger: false });
  } else if (current === 'in_progress') {
    items.push({ status: 'midterm_review', label: '进入中期审核', note: '中期提交已到达审核节点', danger: false });
    items.push({ status: 'final_review', label: '进入结题审核', note: '结题提交已到达审核节点', danger: false });
  } else if (current === 'midterm_review') {
    items.push({ status: 'in_progress', label: '通过中期', note: '中期通过，回到实施状态', danger: false });
    items.push({ status: 'in_progress', label: '退回中期', note: '中期需修改后再提交', danger: true });
  } else if (current === 'final_review') {
    items.push({ status: 'archived', label: '归档结题', note: '结题通过，归档项目', danger: false });
    items.push({ status: 'in_progress', label: '退回结题', note: '结题需修改', danger: true });
  } else if (current === 'rejected') {
    items.push({ status: 'submitted', label: '重新提交', note: '允许学生再次提交', danger: false });
  }
  return items;
});

function resetAssignmentForm() {
  Object.assign(assignmentForm, {
    id: null,
    title: '',
    lessonId: selectedCourseLessons.value[0]?.id || '',
    dueAt: '',
    submitType: 'mixed',
    requirements: '',
    status: 'published'
  });
}

function syncCourseForm(course) {
  courseForm.mode = 'edit';
  courseForm.id = course?.id || '';
  courseForm.title = course?.title || '';
  courseForm.teacherName = course?.teacherName || '';
  courseForm.summary = course?.summary || '';
  courseForm.audience = course?.audience || '';
  courseForm.pace = course?.pace || '';
  courseForm.learningObjectivesText = Array.isArray(course?.learningObjectives) ? course.learningObjectives.join('\n') : '';
  courseForm.status = course?.status || 'draft';
}

function startCourseCreate() {
  activeModule.value = 'uploads';
  uploadKind.value = 'course';
  selectedCourseId.value = '';
  selectedCourseLessons.value = [];
  assignments.value = [];
  selectedAssignment.value = null;
  submissions.value = [];
  Object.assign(courseForm, {
    mode: 'edit',
    id: '',
    title: '',
    teacherName: currentUser.value?.name || '',
    summary: '',
    audience: '',
    pace: '4 课时',
    learningObjectivesText: '',
    status: 'draft'
  });
  resetAssignmentForm();
}

function lessonName(lessonId) {
  if (!lessonId) return '未绑定课时';
  return selectedCourseLessons.value.find(item => item.id === lessonId)?.title || lessonId;
}

function statusLabel(status) {
  return {
    draft: '草稿',
    published: '已发布',
    archived: '已归档',
    submitted: '已提交',
    reviewed: '已批改',
    needs_changes: '需修改',
    pending: '待处理',
    approved: '已通过',
    rejected: '已退回',
    reviewing: '审核中',
    in_progress: '进行中',
    midterm_review: '中期审核',
    final_review: '结题审核',
    archived: '已归档'
  }[status] || status || '未设置';
}

function submissionTypeLabel(type) {
  return {
    proposal: '立项',
    milestone_1: '里程碑一',
    milestone_2: '里程碑二',
    milestone_3: '里程碑三',
    midterm: '中期',
    final: '结题',
    showcase: '展示'
  }[type] || type || '提交';
}

function submissionSummary(submission) {
  const detail = submission?.details || {};
  return detail.problem || detail.progressSummary || detail.featureSummary || detail.deliverables || detail.demo || '';
}

async function loadCourses() {
  const res = await apiFetch('/courses');
  const data = await readJsonResponse(res, 'courses');
  if (!res.ok) throw new Error(data?.error || '课程加载失败');
  courses.value = data.courses || [];
  const ownedCourses = myCourses.value;
  const selectedIsOwned = ownedCourses.some(item => item.id === selectedCourseId.value);
  if ((!selectedCourseId.value || !selectedIsOwned) && ownedCourses.length) {
    await selectCourse(ownedCourses[0]);
  } else if (selectedCourse.value) {
    syncCourseForm(selectedCourse.value);
    await loadAssignments();
  } else {
    selectedCourseId.value = '';
    selectedCourseLessons.value = [];
    assignments.value = [];
  }
}

async function selectCourse(course) {
  if (!course?.id) return;
  selectedCourseId.value = course.id;
  syncCourseForm(course);
  const lessonsRes = await apiFetch(`/courses/${course.id}/lessons`);
  const lessonsData = await readJsonResponse(lessonsRes, 'course_lessons');
  selectedCourseLessons.value = lessonsData.lessons || [];
  resetAssignmentForm();
  await loadAssignments();
}

async function saveCourse() {
  if (courseForm.mode !== 'create' && !selectedCourse.value) return;
  courseSaving.value = true;
  try {
    const payload = {
      ...(selectedCourse.value || {}),
      id: courseForm.id,
      title: courseForm.title,
      teacherName: courseForm.teacherName,
      summary: courseForm.summary,
      description: courseForm.summary,
      audience: courseForm.audience,
      pace: courseForm.pace,
      learningObjectives: courseForm.learningObjectivesText.split('\n').map(item => item.trim()).filter(Boolean),
      status: courseForm.status,
      direction: selectedCourse.value?.direction || 'foundation',
      materialsRoot: courseForm.id,
      relatedProjects: selectedCourse.value?.relatedProjects || [],
      materials: selectedCourse.value?.materials || []
    };
    const res = await apiFetch(courseForm.mode === 'create' ? '/courses' : `/courses/${selectedCourse.value.id}`, {
      method: courseForm.mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await readJsonResponse(res, 'course_save');
    if (!res.ok) throw new Error(data?.error || '课程保存失败');
    if (courseForm.mode === 'create') {
      courses.value = [data.course, ...courses.value.filter(item => item.id !== data.course.id)];
      notification.success('课程已上传到平台');
    } else {
      courses.value = courses.value.map(item => item.id === data.course.id ? data.course : item);
      notification.success('课程信息已保存');
    }
    await selectCourse(data.course);
  } catch (err) {
    notification.error(err.message || '课程保存失败');
  } finally {
    courseSaving.value = false;
  }
}

async function saveCourseAs(status) {
  courseForm.status = status;
  await saveCourse();
}

async function loadAssignments() {
  if (!selectedCourseId.value) return;
  const res = await apiFetch(`/assignments?courseId=${encodeURIComponent(selectedCourseId.value)}`);
  const data = await readJsonResponse(res, 'assignments');
  if (!res.ok) throw new Error(data?.error || '作业加载失败');
  assignments.value = data.assignments || [];
}

function startAssignmentCreate() {
  resetAssignmentForm();
}

function editAssignment(assignment) {
  Object.assign(assignmentForm, {
    id: assignment.id,
    title: assignment.title,
    lessonId: assignment.lessonId || '',
    dueAt: assignment.dueAt ? assignment.dueAt.slice(0, 16) : '',
    submitType: assignment.submitType || 'mixed',
    requirements: assignment.requirements || '',
    status: assignment.status || 'published'
  });
}

async function saveAssignment() {
  if (!selectedCourseId.value) return;
  assignmentSaving.value = true;
  try {
    const payload = {
      courseId: selectedCourseId.value,
      lessonId: assignmentForm.lessonId,
      title: assignmentForm.title,
      dueAt: assignmentForm.dueAt ? new Date(assignmentForm.dueAt).toISOString() : '',
      submitType: assignmentForm.submitType,
      requirements: assignmentForm.requirements,
      status: assignmentForm.status
    };
    const endpoint = assignmentForm.id ? `/assignments/${assignmentForm.id}` : '/assignments';
    const res = await apiFetch(endpoint, {
      method: assignmentForm.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await readJsonResponse(res, 'assignment_save');
    if (!res.ok) throw new Error(data?.error || '作业保存失败');
    notification.success('作业已保存');
    resetAssignmentForm();
    await loadAssignments();
  } catch (err) {
    notification.error(err.message || '作业保存失败');
  } finally {
    assignmentSaving.value = false;
  }
}

async function loadAssignmentSubmissions(assignment) {
  selectedAssignment.value = assignment;
  const res = await apiFetch(`/assignments/${assignment.id}/submissions`);
  const data = await readJsonResponse(res, 'assignment_submissions');
  if (!res.ok) throw new Error(data?.error || '提交加载失败');
  submissions.value = data.submissions || [];
  submissions.value.forEach(item => {
    reviewDrafts[item.id] = {
      status: item.status === 'needs_changes' ? 'needs_changes' : 'reviewed',
      score: item.score ?? '',
      feedback: item.feedback || ''
    };
  });
}

async function reviewAssignmentSubmission(submission) {
  const draft = reviewDrafts[submission.id];
  const res = await apiFetch(`/assignments/${selectedAssignment.value.id}/submissions/${submission.id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft)
  });
  const data = await readJsonResponse(res, 'assignment_review');
  if (!res.ok) {
    notification.error(data?.error || '批改失败');
    return;
  }
  notification.success('批改已提交');
  await loadAssignmentSubmissions(selectedAssignment.value);
  await loadAssignments();
}

async function loadCompetitions() {
  const res = await apiFetch('/admin/competitions');
  const data = await readJsonResponse(res, 'admin_competitions');
  if (!res.ok) throw new Error(data?.error || '赛事加载失败');
  competitions.value = data.competitions || [];
  const ownedCompetitions = myCompetitions.value;
  const selectedIsOwned = ownedCompetitions.some(item => item.slug === selectedCompetitionSlug.value);
  if ((!selectedCompetitionSlug.value || !selectedIsOwned) && ownedCompetitions.length) {
    await selectCompetition(ownedCompetitions[0]);
  } else if (!ownedCompetitions.length) {
    selectedCompetitionSlug.value = '';
    registrations.value = [];
    registrationStats.value = {};
  }
}

function syncCompetitionForm(item) {
  Object.assign(competitionForm, {
    editing: Boolean(item),
    title: item?.title || '',
    slug: item?.slug || '',
    status: item?.status || '报名中',
    publishStatus: item?.publishStatus || 'draft',
    dateRange: item?.dateRange || '',
    host: item?.host || '',
    location: item?.location || '',
    fitSummary: item?.fitSummary || '',
    relatedCourseIdsText: (item?.relatedCourseIds || []).join(',')
  });
}

async function selectCompetition(competition) {
  selectedCompetitionSlug.value = competition.slug;
  syncCompetitionForm(competition);
  await loadRegistrations();
}

function startCompetitionCreate() {
  activeModule.value = 'uploads';
  uploadKind.value = 'competition';
  selectedCompetitionSlug.value = '';
  registrations.value = [];
  registrationStats.value = {};
  competitionRawText.value = '';
  syncCompetitionForm(null);
}

function draftCompetitionFromText() {
  const text = competitionRawText.value.trim();
  if (!text) {
    notification.warning('先粘贴赛事通知或章程内容');
    return;
  }
  const lines = text.split(/\n+/).map(item => item.trim()).filter(Boolean);
  const title = lines.find(line => /赛|活动|挑战|展示|马拉松/.test(line)) || lines[0] || '';
  const dateLine = lines.find(line => /(20\d{2}|报名|截止|时间|日期|学期|全年)/.test(line)) || '';
  const hostLine = lines.find(line => /(主办|承办|组织|中心|协会|联盟|学校|少年宫)/.test(line)) || '';
  const locationLine = lines.find(line => /(上海|校内|线上|线下|赛区|地点|地址)/.test(line)) || '';
  competitionForm.title = title.replace(/^(赛事名称|活动名称)[:：]\s*/, '').slice(0, 80);
  competitionForm.slug = competitionForm.slug || competitionForm.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || `competition-${Date.now()}`;
  competitionForm.publishStatus = 'draft';
  competitionForm.status = /截止|已结束/.test(text) ? '已结束' : (/即将|预告/.test(text) ? '即将开始' : '报名中');
  competitionForm.dateRange = dateLine.replace(/^(时间|报名时间|日期)[:：]\s*/, '').slice(0, 80);
  competitionForm.host = hostLine.replace(/^(主办|主办单位|组织单位)[:：]\s*/, '').slice(0, 80);
  competitionForm.location = locationLine.replace(/^(地点|比赛地点|地址)[:：]\s*/, '').slice(0, 80);
  competitionForm.fitSummary = lines.slice(0, 4).join(' ').slice(0, 220);
  notification.success('已整理为赛事草稿，请检查后上传');
}

async function saveCompetition() {
  const payload = {
    title: competitionForm.title,
    slug: competitionForm.slug,
    status: competitionForm.status,
    publishStatus: competitionForm.publishStatus,
    dateRange: competitionForm.dateRange,
    host: competitionForm.host,
    location: competitionForm.location,
    fitSummary: competitionForm.fitSummary,
    relatedCourseIds: competitionForm.relatedCourseIdsText.split(',').map(item => item.trim()).filter(Boolean)
  };
  const endpoint = competitionForm.editing ? `/admin/competitions/${competitionForm.slug}` : '/admin/competitions';
  const res = await apiFetch(endpoint, {
    method: competitionForm.editing ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(res, 'competition_save');
  if (!res.ok) {
    notification.error(data?.error || '赛事保存失败');
    return;
  }
  notification.success('赛事已保存');
  await loadCompetitions();
  await selectCompetition(data.competition);
}

async function saveCompetitionAs(status) {
  competitionForm.publishStatus = status;
  await saveCompetition();
}

async function loadBanners() {
  const res = await apiFetch('/admin/banners');
  const data = await readJsonResponse(res, 'admin_banners');
  if (!res.ok) throw new Error(data?.error || 'Banner 加载失败');
  banners.value = data.banners || [];
  if (selectedBannerIndex.value >= banners.value.length) selectedBannerIndex.value = -1;
}

function syncBannerForm(item) {
  Object.assign(bannerForm, {
    title: item?.title || '',
    type: item?.type || 'feature',
    tag: item?.tag || '',
    image: item?.image || '',
    targetUrl: item?.targetUrl || '',
    priority: Number.isFinite(Number(item?.priority)) ? Number(item.priority) : 999
  });
}

function selectBanner(index) {
  selectedBannerIndex.value = index;
  syncBannerForm(banners.value[index]);
}

function startBannerCreate() {
  uploadKind.value = 'banner';
  selectedBannerIndex.value = -1;
  syncBannerForm(null);
}

async function saveBanner() {
  const payload = { ...bannerForm };
  const editing = selectedBannerIndex.value >= 0;
  const endpoint = editing ? `/admin/banners/${selectedBannerIndex.value}` : '/admin/banners';
  const res = await apiFetch(endpoint, {
    method: editing ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(res, 'banner_save');
  if (!res.ok) {
    notification.error(data?.error || 'Banner 保存失败');
    return;
  }
  notification.success('Banner 已保存');
  await loadBanners();
  if (!editing) selectedBannerIndex.value = 0;
}

async function deleteBanner() {
  if (selectedBannerIndex.value < 0) return;
  const res = await apiFetch(`/admin/banners/${selectedBannerIndex.value}`, { method: 'DELETE' });
  const data = await readJsonResponse(res, 'banner_delete');
  if (!res.ok) {
    notification.error(data?.error || 'Banner 删除失败');
    return;
  }
  notification.success('Banner 已删除');
  selectedBannerIndex.value = -1;
  syncBannerForm(null);
  await loadBanners();
}

async function loadStories() {
  const res = await apiFetch('/admin/stories');
  const data = await readJsonResponse(res, 'admin_stories');
  if (!res.ok) throw new Error(data?.error || '成果故事加载失败');
  stories.value = data.stories || [];
}

function syncStoryForm(item) {
  Object.assign(storyForm, {
    title: item?.title || '',
    slug: item?.slug || '',
    studentLabel: item?.studentLabel || '',
    summary: item?.summary || '',
    result: item?.result || '',
    relatedCompetitionSlug: item?.relatedCompetitionSlug || '',
    relatedCourseIdsText: (item?.relatedCourseIds || []).join(','),
    cover: item?.cover || '',
    featured: Boolean(item?.featured)
  });
}

function selectStory(story) {
  selectedStorySlug.value = story.slug;
  syncStoryForm(story);
}

function startStoryCreate() {
  uploadKind.value = 'story';
  selectedStorySlug.value = '';
  syncStoryForm(null);
}

async function saveStory() {
  const payload = {
    ...storyForm,
    relatedCourseIds: storyForm.relatedCourseIdsText.split(',').map(item => item.trim()).filter(Boolean)
  };
  const editing = Boolean(selectedStorySlug.value);
  const endpoint = editing ? `/admin/stories/${selectedStorySlug.value}` : '/admin/stories';
  const res = await apiFetch(endpoint, {
    method: editing ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(res, 'story_save');
  if (!res.ok) {
    notification.error(data?.error || '成果故事保存失败');
    return;
  }
  notification.success('成果故事已保存');
  await loadStories();
  selectStory(data.story);
}

async function deleteStory() {
  if (!selectedStorySlug.value) return;
  const res = await apiFetch(`/admin/stories/${selectedStorySlug.value}`, { method: 'DELETE' });
  const data = await readJsonResponse(res, 'story_delete');
  if (!res.ok) {
    notification.error(data?.error || '成果故事删除失败');
    return;
  }
  notification.success('成果故事已删除');
  selectedStorySlug.value = '';
  syncStoryForm(null);
  await loadStories();
}

async function loadRegistrations() {
  if (!selectedCompetitionSlug.value) return;
  const res = await apiFetch(`/competitions/${selectedCompetitionSlug.value}/registrations`);
  const data = await readJsonResponse(res, 'competition_registrations');
  if (!res.ok) throw new Error(data?.error || '报名加载失败');
  registrations.value = data.registrations || [];
  registrationStats.value = data.stats || {};
}

async function reviewRegistration(registration, status) {
  const res = await apiFetch(`/competitions/${selectedCompetitionSlug.value}/registrations/${registration.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await readJsonResponse(res, 'registration_review');
  if (!res.ok) {
    notification.error(data?.error || '报名处理失败');
    return;
  }
  notification.success('报名状态已更新');
  await loadRegistrations();
  await loadCompetitions();
}

async function loadResources() {
  const res = await apiFetch('/admin/resources?status=pending');
  const data = await readJsonResponse(res, 'resources');
  resources.value = res.ok ? (data.requests || []) : [];
}

async function auditResource(id, status) {
  actionWorking.value = true;
  const res = await apiFetch(`/resources/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await readJsonResponse(res, 'resource_audit');
  actionWorking.value = false;
  if (!res.ok) {
    notification.error(data?.error || '资源审批失败');
    return;
  }
  notification.success('资源审批已更新');
  await loadResources();
  await loadProjectReviewQueue();
  if (selectedReviewProjectId.value) await loadReviewDossier(selectedReviewProjectId.value);
}

async function loadProjectReviewQueue() {
  const res = await apiFetch('/admin/project-review-queue');
  const data = await readJsonResponse(res, 'project_review_queue');
  if (!res.ok) throw new Error(data?.error || '项目审核队列加载失败');
  reviewQueue.value = data.projects || [];
  if (!reviewQueue.value.length) {
    selectedReviewProjectId.value = '';
    reviewDossier.value = null;
    return;
  }
  const stillSelected = reviewQueue.value.some(item => String(item.id) === String(selectedReviewProjectId.value));
  const preferredQueueItem = filteredReviewProjects.value[0] || reviewQueue.value[0];
  if (!selectedReviewProjectId.value || !stillSelected) {
    await selectReviewProject(preferredQueueItem.id);
  }
}

async function selectReviewProject(projectId) {
  selectedReviewProjectId.value = projectId;
  await loadReviewDossier(projectId);
}

async function loadReviewDossier(projectId) {
  if (!projectId) return;
  reviewDossierLoading.value = true;
  try {
    const res = await apiFetch(`/admin/projects/${projectId}/review-dossier`);
    const data = await readJsonResponse(res, 'project_review_dossier');
    if (!res.ok) throw new Error(data?.error || '审核包加载失败');
    reviewDossier.value = data;
    projectActionNote.value = '';
    (data.submissions || []).forEach((submission) => {
      projectReviewDrafts[submission.id] = {
        status: submission.status === 'needs_changes' ? 'needs_changes' : 'reviewed',
        feedback: submission.feedback || ''
      };
    });
  } catch (err) {
    notification.error(err.message || '审核包加载失败');
  } finally {
    reviewDossierLoading.value = false;
  }
}

async function advanceProjectStatus(status, defaultNote) {
  if (!reviewDossier.value?.project?.id) return;
  actionWorking.value = true;
  try {
    const res = await apiFetch(`/projects/${reviewDossier.value.project.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note: projectActionNote.value || defaultNote || '' })
    });
    const data = await readJsonResponse(res, 'project_status_update');
    if (!res.ok) throw new Error(data?.error || '项目状态推进失败');
    notification.success('项目状态已更新');
    await loadProjectReviewQueue();
    await loadReviewDossier(reviewDossier.value.project.id);
  } catch (err) {
    notification.error(err.message || '项目状态推进失败');
  } finally {
    actionWorking.value = false;
  }
}

async function reviewProjectSubmission(submission) {
  const draft = projectReviewDrafts[submission.id];
  if (draft?.status === 'needs_changes' && !String(draft.feedback || '').trim()) {
    notification.warning('退回提交必须填写反馈');
    return;
  }
  actionWorking.value = true;
  try {
    const res = await apiFetch(`/submissions/${submission.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });
    const data = await readJsonResponse(res, 'submission_feedback');
    if (!res.ok) throw new Error(data?.error || '提交审核失败');
    notification.success('阶段提交审核已回流学生端');
    await loadProjectReviewQueue();
    await loadReviewDossier(reviewDossier.value.project.id);
  } catch (err) {
    notification.error(err.message || '提交审核失败');
  } finally {
    actionWorking.value = false;
  }
}

async function reviewMilestone(milestone, status) {
  actionWorking.value = true;
  try {
    const res = await apiFetch(`/milestones/${milestone.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await readJsonResponse(res, 'milestone_review');
    if (!res.ok) throw new Error(data?.error || '里程碑处理失败');
    notification.success(status === 'approved' ? '里程碑已验收' : '里程碑已退回');
    await loadProjectReviewQueue();
    await loadReviewDossier(reviewDossier.value.project.id);
  } catch (err) {
    notification.error(err.message || '里程碑处理失败');
  } finally {
    actionWorking.value = false;
  }
}

async function loadProjectTopics() {
  const res = await apiFetch('/admin/project-topics');
  const data = await readJsonResponse(res, 'project_topics');
  projectTopics.value = res.ok ? (data.topics || []) : [];
  const ownedTopics = myProjectTopics.value;
  const selectedIsOwned = ownedTopics.some(item => String(item.id) === String(selectedProjectTopicId.value));
  if ((!selectedProjectTopicId.value || !selectedIsOwned) && ownedTopics.length) {
    selectedProjectTopicId.value = String(myProjectTopics.value[0].id);
  } else if (!ownedTopics.length) {
    selectedProjectTopicId.value = '';
  }
}

function startProjectTopicCreate() {
  activeModule.value = 'uploads';
  uploadKind.value = 'project';
  selectedProjectTopicId.value = '';
}

function editProjectTopic(topic) {
  selectedProjectTopicId.value = String(topic.id);
}

async function saveProjectTopic() {
  const topic = selectedProjectTopic.value;
  if (!topic) return;
  const endpoint = `/admin/project-topics/${topic.id}`;
  const res = await apiFetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...topic, status: topic.status })
  });
  const data = await readJsonResponse(res, 'project_topic_save');
  if (!res.ok) {
    notification.error(data?.error || '项目题目保存失败');
    return;
  }
  notification.success('项目题目已保存');
  await loadProjectTopics();
}

async function saveProjectTopicAs(status) {
  if (!selectedProjectTopic.value) return;
  selectedProjectTopic.value.status = status;
  await saveProjectTopic();
}

function openProject(project) {
  router.push(`/workspace?project=${project.id}`);
}

async function refreshAll() {
  loading.value = true;
  try {
    await Promise.all([
      loadCourses(),
      loadCompetitions(),
      loadBanners(),
      loadStories(),
      loadResources(),
      loadProjectTopics(),
      loadProjectReviewQueue(),
      projectStore.fetchList()
    ]);
  } catch (err) {
    notification.error(err.message || '数据刷新失败');
  } finally {
    loading.value = false;
  }
}

function logout() {
  authStore.logout();
  router.replace('/login');
}

watch(activeModule, value => {
  if (value === 'projects') {
    loadProjectReviewQueue();
    loadResources();
  }
});

watch(activeQueue, async () => {
  const first = filteredReviewProjects.value[0];
  if (first) {
    await selectReviewProject(first.id);
  } else {
    reviewDossier.value = null;
    selectedReviewProjectId.value = '';
  }
});

onMounted(async () => {
  const user = authStore.user;
  if (!user) {
    authStore.setRedirect('/teacher');
    router.replace('/login');
    return;
  }
  if (!['teacher', 'judge'].includes(user.role)) {
    router.replace('/workspace');
    return;
  }
  await refreshAll();
});
</script>

<style scoped>
.nav-link,
.icon-btn,
.module-tabs button,
.primary-btn,
.secondary-btn,
.text-btn {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.teacher-ops {
  font-family: inherit;
  background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.04), transparent 45%);
}

.nav-link {
  border-radius: 12px;
  padding: 0.55rem 0.8rem;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
}

.nav-link:hover,
.icon-btn:hover {
  background: rgba(99, 102, 241, 0.06);
  color: #4f46e5;
}

.icon-btn {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  color: #64748b;
}

.hero-panel {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  border-radius: 32px;
  background: linear-gradient(135deg, #121026, #242254);
  padding: 40px;
  color: #fff;
  box-shadow: 0 20px 50px rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.kicker,
.panel-title p {
  margin: 0;
  color: #818cf8;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-panel h1 {
  margin: 12px 0 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.hero-panel p:not(.kicker) {
  margin: 12px 0 0;
  max-width: 42rem;
  color: #94a3b8;
  line-height: 1.8;
  font-size: 0.95rem;
}

.todo-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.todo-card {
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  padding: 24px;
  text-align: left;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.02);
}

.todo-card:hover {
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.06);
}

.todo-card span {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
}

.todo-card strong {
  display: block;
  margin-top: 10px;
  font-size: 2.2rem;
  font-weight: 900;
  color: #1e1b4b;
  line-height: 1.1;
}

.todo-card small {
  display: block;
  margin-top: 10px;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1.5;
}

.skill-card strong {
  font-size: 1.5rem;
}

.module-tabs {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  overflow-x: auto;
}

.module-tabs button {
  min-height: 46px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  padding: 0 22px;
  color: #475569;
  font-weight: 800;
  font-size: 0.85rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.module-tabs button:hover {
  border-color: rgba(99, 102, 241, 0.25);
  color: #4f46e5;
  background: #fff;
}

.module-tabs button.active {
  border-color: #4f46e5;
  background: #4f46e5;
  color: #fff;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.25);
}

.ops-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.side-panel,
.main-panel,
.editor-card,
.data-card,
.review-panel,
.submission-card {
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.025);
}

.side-panel {
  position: sticky;
  top: 88px;
  display: grid;
  gap: 12px;
  padding: 20px;
}

.main-panel {
  padding: 24px;
}

.panel-title {
  margin-bottom: 16px;
}

.panel-title h2 {
  margin: 6px 0 0;
  font-size: 1.5rem;
  font-weight: 900;
  color: #1e1b4b;
}

.row-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.list-item {
  display: grid;
  gap: 6px;
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.list-item:hover,
.list-item.active {
  background: rgba(99, 102, 241, 0.06);
  border-color: rgba(99, 102, 241, 0.1);
}

.list-item strong,
.data-card strong,
.submission-card strong {
  font-weight: 800;
  color: #1e1b4b;
}

.list-item span,
.data-card span,
.submission-card span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
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
  font-weight: 800;
  transition: all 0.2s ease;
}

.upload-switch button.active {
  background: #fff;
  color: #4f46e5;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.queue-list {
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 410px);
  overflow-y: auto;
  padding-right: 4px;
}

.project-queue-card {
  display: grid;
  gap: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.6);
  padding: 16px;
  text-align: left;
  transition: all 0.2s ease;
}

.project-queue-card:hover,
.project-queue-card.active {
  border-color: rgba(99, 102, 241, 0.25);
  background: rgba(99, 102, 241, 0.06);
}

.queue-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.queue-head strong {
  font-size: 0.9rem;
  font-weight: 800;
  color: #1e1b4b;
}

.project-queue-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.45;
}

.queue-meta,
.attachment-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.queue-meta span,
.attachment-row a {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.03);
  padding: 0.28rem 0.55rem;
  color: #475569;
  font-size: 0.68rem;
  font-weight: 800;
}

.course-edit-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 16px;
}

.editor-card {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.editor-card.wide {
  margin-bottom: 16px;
}

.skill-wizard {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 16px;
}

.wizard-input,
.wizard-preview,
.uploaded-status {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  padding: 20px;
}

.wizard-input h3,
.wizard-preview h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #1e1b4b;
}

.wizard-input p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.7;
}

.wizard-input textarea {
  min-height: 320px;
}

.advanced-fields {
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 18px;
  padding: 14px;
}

.advanced-fields summary {
  cursor: pointer;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 800;
}

.advanced-fields label {
  margin-top: 12px;
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

.editor-card h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #1e1b4b;
}

label {
  display: grid;
  gap: 6px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.75);
  padding: 0.75rem 0.85rem;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
  outline: none;
  transition: all 0.25s ease;
}

input:focus,
textarea:focus,
select:focus {
  background: #fff;
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.05);
}

textarea {
  min-height: 92px;
  resize: vertical;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.primary-btn,
.secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 16px;
  padding: 0.8rem 1.2rem;
  font-weight: 800;
}

.primary-btn {
  background: #4f46e5;
  color: #fff;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
}

.primary-btn:hover {
  background: #4338ca;
  box-shadow: 0 12px 25px rgba(99, 102, 241, 0.25);
}

.primary-btn.small,
.secondary-btn {
  min-height: 40px;
  padding: 0.55rem 1rem;
  font-size: 0.8rem;
}

.full-skill-btn {
  width: 100%;
}

.secondary-btn {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.8);
  color: #334155;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.01);
}

.secondary-btn:hover {
  border-color: rgba(99, 102, 241, 0.25);
  color: #4f46e5;
  background: #fff;
}

.secondary-btn.danger {
  border-color: #fca5a5;
  color: #dc2626;
  background: rgba(254, 242, 242, 0.5);
}

.secondary-btn.danger:hover {
  background: #fef2f2;
}

.secondary-btn.full {
  width: 100%;
  margin-top: 12px;
}

.text-btn {
  color: #4f46e5;
  font-size: 0.78rem;
  font-weight: 800;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.data-card {
  padding: 20px;
}

.data-card-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.preview-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(290px, 0.8fr);
  gap: 16px;
  margin-bottom: 18px;
}

.preview-panel {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  padding: 20px;
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 800;
}

.preview-panel h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 900;
  color: #1e1b4b;
}

.preview-panel p {
  margin: 0;
  color: #475569;
  line-height: 1.75;
  font-size: 0.9rem;
}

.check-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.check-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 14px;
  background: #fff7ed;
  padding: 0.75rem 0.85rem;
  color: #9a3412;
  font-size: 0.82rem;
  font-weight: 800;
}

.check-list li::after {
  content: "待确认";
  font-size: 0.72rem;
}

.check-list li.ok {
  background: #ecfdf5;
  color: #047857;
}

.check-list li.ok::after {
  content: "已识别";
}

.metric-row,
.metric-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.metric-row span,
.metric-strip span,
.status-pill {
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  padding: 0.35rem 0.65rem;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
}

.review-panel {
  margin-top: 20px;
  padding: 20px;
}

.intervention-workbench {
  min-height: 680px;
}

.workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 16px;
}

.workbench-card {
  display: grid;
  align-content: start;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  padding: 20px;
}

.workbench-card h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1e1b4b;
}

.workbench-card:first-child {
  grid-row: span 2;
}

.repo-link {
  overflow-wrap: anywhere;
  color: #4f46e5;
  font-size: 0.8rem;
  font-weight: 800;
}

.submission-list {
  display: grid;
  gap: 12px;
}

.submission-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(250px, 0.5fr);
  gap: 16px;
  padding: 20px;
}

.compact-list {
  max-height: 520px;
  overflow-y: auto;
}

.review-submission {
  grid-template-columns: minmax(0, 1fr) minmax(240px, 0.5fr);
}

.mini-review-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  border: 1px solid rgba(0, 0, 0, 0.03);
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.015);
  padding: 16px;
}

.mini-review-card strong,
.timeline-item strong {
  display: block;
  font-weight: 800;
  color: #1e1b4b;
}

.mini-review-card span,
.timeline-item span {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
}

.mini-review-card p,
.timeline-item p {
  margin: 8px 0 0;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.6;
}

.timeline-list {
  display: grid;
  gap: 12px;
}

.timeline-item {
  border-left: 3px solid #c7d2fe;
  padding-left: 12px;
}

.submission-card p,
.data-card p {
  color: #475569;
  line-height: 1.65;
}

.submission-card a {
  color: #4f46e5;
  font-weight: 800;
}

.review-form {
  display: grid;
  gap: 8px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: start;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.empty-note.compact {
  padding: 12px;
  font-size: 0.78rem;
}

@media (max-width: 980px) {
  .todo-grid,
  .ops-layout,
  .course-edit-grid,
  .skill-wizard,
  .preview-layout,
  .data-grid,
  .submission-card,
  .workbench-grid,
  .mini-review-card {
    grid-template-columns: 1fr;
  }

  .side-panel {
    position: static;
  }

  .queue-list,
  .compact-list {
    max-height: none;
  }

  .hero-panel {
    align-items: start;
    flex-direction: column;
  }
}
</style>
