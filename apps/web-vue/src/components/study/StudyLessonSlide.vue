<template>
  <div
    class="study-slide-card study-slide-card--lesson rounded-[32px] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
    :class="[`study-slide-card--${slide?.type}`]"
  >
    <div class="study-slide-head" :class="`study-slide-head--${slide?.type}`">
      <div class="study-slide-head-main">
        <div class="study-slide-badge-row">
          <span class="study-slide-pill">
            {{ slide?.typeLabel }}
          </span>
          <span v-if="slide?.unitTitle" class="study-slide-unit">{{ slide.unitTitle }}</span>
        </div>
        <div class="study-slide-head-copy">
          <div class="study-slide-mode">{{ slideModeLabel(slide?.type) }}</div>
          <h2 class="study-slide-head-title">{{ slide?.phaseTitle || slide?.title }}</h2>
        </div>
      </div>
      <div class="study-slide-head-side">
        <div class="study-slide-type-icon" :class="`study-slide-type-icon--${slide?.type}`">
          <i class="fas" :class="slideTypeIcon(slide?.type)"></i>
        </div>
        <div v-if="slide?.duration" class="study-slide-duration">
          {{ slide.duration }} min
        </div>
      </div>
    </div>

    <div class="study-slide-body" :class="`study-slide-body--${slide?.type}`">
      <template v-if="slide?.type === 'phase'">
        <div class="study-phase-layout">
          <section v-if="slide.slideRefs?.length" class="study-phase-ppt">
            <div class="study-content-intro">
              <div class="study-content-intro__label">课件内容</div>
              <h3 class="study-slide-subtitle">{{ slide.title }}</h3>
            </div>
            <div class="study-inline-deck">
              <div class="study-inline-deck__toolbar">
                <div class="study-inline-deck__meta">
                  <span class="study-inline-deck__mode">PPT 课件模式</span>
                  <span class="study-inline-deck__count">{{ currentInlineIndex + 1 }} / {{ inlineSlides.length }}</span>
                </div>
                <button
                  type="button"
                  class="study-slide-viewer-trigger"
                  @click="openSlideViewer(slide, currentInlineIndex)"
                >
                  <i class="fas fa-expand"></i>
                  <span>进入全屏课件</span>
                </button>
              </div>

              <div v-if="currentInlineSlide" class="study-inline-deck__stage">
                <button
                  type="button"
                  class="study-inline-deck__nav study-inline-deck__nav--prev"
                  :disabled="!hasInlinePrev"
                  @click="showPrevInlineSlide"
                >
                  <i class="fas fa-chevron-left"></i>
                  <span class="sr-only">上一页</span>
                </button>

                <button
                  type="button"
                  class="study-inline-deck__canvas"
                  @click="openSlideViewer(slide, currentInlineIndex)"
                >
                  <span class="study-inline-deck__badge">第 {{ currentInlineIndex + 1 }} 页</span>
                  <img
                    class="study-inline-deck__image study-phase-ppt__image"
                    :src="currentInlineSlide.src"
                    :alt="currentInlineSlide.alt"
                  />
                  <span class="study-inline-deck__hint">
                    <i class="fas fa-up-right-and-down-left-from-center"></i>
                    点击进入沉浸查看
                  </span>
                </button>

                <button
                  type="button"
                  class="study-inline-deck__nav study-inline-deck__nav--next"
                  :disabled="!hasInlineNext"
                  @click="showNextInlineSlide"
                >
                  <i class="fas fa-chevron-right"></i>
                  <span class="sr-only">下一页</span>
                </button>
              </div>

              <div v-if="inlineSlides.length > 1" class="study-inline-deck__thumbs">
                <button
                  v-for="(deckSlide, imageIndex) in inlineSlides"
                  :key="`${slide.id}-slide-thumb-${imageIndex}`"
                  type="button"
                  class="study-inline-deck__thumb"
                  :class="{ 'is-active': imageIndex === currentInlineIndex }"
                  @click="setInlineSlideIndex(imageIndex)"
                >
                  <img
                    class="study-inline-deck__thumb-image"
                    :src="deckSlide.src"
                    :alt="deckSlide.alt"
                  />
                  <span class="study-inline-deck__thumb-index">{{ imageIndex + 1 }}</span>
                </button>
              </div>
            </div>
          </section>

          <section class="study-phase-tasks">
            <div class="study-content-intro">
              <div class="study-content-intro__label">任务点</div>
              <h3 class="study-slide-subtitle">{{ slide.title }}</h3>
              <p v-if="slide.content" class="study-content-intro__text" v-html="safeHtml(slide.content)"></p>
            </div>

            <div v-if="slide.tasks?.length" class="study-task-box">
              <div class="study-task-kicker">实践任务</div>
              <div class="study-task-list">
                <div
                  v-for="(task, taskIndex) in slide.tasks"
                  :key="taskIndex"
                  class="study-task-item"
                >
                  <div class="study-task-index">
                    {{ taskIndex + 1 }}
                  </div>
                  <div class="study-task-copy slide-prose" v-html="safeHtml(task)"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>

      <template v-if="slide?.type === 'knowledge'">
        <div class="study-knowledge-layout">
          <section class="study-knowledge-main">
            <div class="study-content-intro">
              <div class="study-content-intro__label">知识讲解</div>
              <h3 class="study-slide-subtitle">{{ slide.title }}</h3>
              <p v-if="slide.description" class="study-content-intro__text">{{ slide.description }}</p>
            </div>
            <article v-if="slide.content" class="slide-prose markdown-premium study-content-panel" v-html="safeHtml(slide.content)"></article>
          </section>

          <aside class="study-knowledge-side">
            <section v-if="slide.examples?.length" class="study-side-card study-side-card--examples">
              <div class="study-side-card__eyebrow">关键例子</div>
              <div class="study-bullet-list">
                <div v-for="(example, exampleIndex) in slide.examples" :key="`${slide.id}-example-${exampleIndex}`" class="study-bullet-item">
                  <span class="study-bullet-index">{{ exampleIndex + 1 }}</span>
                  <span>{{ example }}</span>
                </div>
              </div>
            </section>

            <section v-if="slide.misconceptions?.length" class="study-side-card study-side-card--warning">
              <div class="study-side-card__eyebrow">容易误解</div>
              <div class="study-warning-list">
                <div v-for="(item, misconceptionIndex) in slide.misconceptions" :key="`${slide.id}-mis-${misconceptionIndex}`" class="study-warning-item">
                  <i class="fas fa-triangle-exclamation"></i>
                  <span>{{ item }}</span>
                </div>
              </div>
            </section>

            <section v-if="slide.resources?.length" class="study-resource-box">
              <div class="study-resource-head">
                <div class="study-resource-icon">
                  <i class="fas fa-bolt"></i>
                </div>
                <div>
                  <div class="study-resource-kicker">Crash Course</div>
                  <div class="study-resource-title">直接对应当前知识点的速学资源</div>
                </div>
              </div>

              <div class="study-resource-list">
                <a
                  v-for="(resource, resourceIndex) in slide.resources"
                  :key="resourceIndex"
                  :href="resource.url"
                  target="_blank"
                  rel="noreferrer"
                  class="study-resource-link"
                >
                  <div class="study-resource-copy min-w-0">
                    <div class="study-resource-meta">
                      <span>{{ resource.provider || '外部链接' }}</span>
                      <span v-if="resource.tag" class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] text-amber-800">{{ resource.tag }}</span>
                    </div>
                    <div class="study-resource-link-title">{{ resource.title }}</div>
                  </div>
                  <div class="study-resource-arrow">
                    <i class="fas fa-arrow-up-right-from-square text-xs"></i>
                  </div>
                </a>
              </div>
            </section>
          </aside>
        </div>
      </template>

      <template v-else-if="slide?.type === 'check'">
        <div class="study-check-stage">
          <div class="study-content-intro">
            <div class="study-content-intro__label">理解检查</div>
            <h3 class="study-slide-subtitle">{{ slide.title }}</h3>
            <p class="study-content-intro__text">
              先判断你是否真正理解了刚才的知识点，再决定是否进入下一步。
            </p>
          </div>

          <div class="study-check-box">
            <div class="study-check-box__question">{{ slide.question }}</div>
            <div class="study-check-options">
              <button
                v-for="(option, optionIndex) in slide.options"
                :key="`${slide.id}-option-${optionIndex}`"
                type="button"
                class="study-check-option"
                :class="checkOptionClass(slide.id, optionIndex, slide.answer)"
                @click="selectCheckOption(slide.id, optionIndex)"
              >
                <span class="study-check-option__index">{{ optionIndex + 1 }}</span>
                <span v-html="safeHtml(option)"></span>
              </button>
            </div>
            <div
              v-if="hasCheckResponse(slide.id)"
              class="study-check-result"
              :class="checkResultClass(slide.id, slide.answer)"
            >
              <div class="study-check-result__label">{{ isCheckCorrect(slide.id, slide.answer) ? '判断正确' : '先别急着翻页' }}</div>
              <p v-if="slide.explanation" class="study-check-result__text">{{ slide.explanation }}</p>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="slide?.type === 'activity'">
        <div class="study-activity-layout">
          <section class="study-activity-main">
            <div class="study-content-intro">
              <div class="study-content-intro__label">活动任务</div>
              <h3 class="study-slide-subtitle">{{ slide.title }}</h3>
              <p v-if="slide.description" class="study-content-intro__text">{{ slide.description }}</p>
            </div>

            <div v-if="slide.steps?.length || slide.tasks?.length" class="study-task-box">
              <div class="study-task-kicker">实践步骤</div>
              <div class="study-task-list">
                <div
                  v-for="(task, taskIndex) in (slide.steps || slide.tasks)"
                  :key="taskIndex"
                  class="study-task-item"
                >
                  <div class="study-task-index">
                    {{ taskIndex + 1 }}
                  </div>
                  <div class="study-task-copy slide-prose" v-html="safeHtml(task)"></div>
                </div>
              </div>
            </div>
          </section>

          <aside class="study-activity-side">
            <section v-if="slide.criteria?.length" class="study-side-card study-side-card--success">
              <div class="study-side-card__eyebrow">完成标准</div>
              <div class="study-checklist">
                <div v-for="(criterion, criterionIndex) in slide.criteria" :key="`${slide.id}-criteria-${criterionIndex}`" class="study-checklist-item">
                  <i class="fas fa-circle-check"></i>
                  <span>{{ criterion }}</span>
                </div>
              </div>
            </section>

            <section v-if="slide.deliverable" class="study-side-card study-side-card--deliverable">
              <div class="study-side-card__eyebrow">本页产出</div>
              <div class="study-deliverable-card">
                <strong>{{ slide.deliverable }}</strong>
                <p>完成后可在右侧任务面板中整理并提交。</p>
              </div>
            </section>
          </aside>
        </div>
      </template>

      <template v-else-if="slide?.type === 'video'">
        <div class="study-video-layout">
          <section class="study-video-stage">
            <div class="study-content-intro">
              <div class="study-content-intro__label">后续扩展视频</div>
              <h3 class="study-slide-subtitle">{{ slide.title }}</h3>
              <p class="study-content-intro__text">
                {{ slide.video?.summary || slide.description || '观看演示并提取动作顺序、判断节点或调试策略。' }}
              </p>
            </div>

            <div class="study-video-box">
              <div class="study-video-screen">
                <div class="study-video-screen__meta">
                  <span class="study-video-provider">{{ videoProviderLabel(slide.video) }}</span>
                  <span v-if="slide.video?.duration" class="study-video-duration">{{ slide.video.duration }} min</span>
                </div>
                <div class="study-video-screen__play">
                  <i class="fas fa-circle-play"></i>
                </div>
                <p class="study-video-screen__hint">本页重点不是“看完”，而是“看出顺序、线索和错误点”。</p>
              </div>

              <a
                v-if="videoHref(slide.video?.src)"
                :href="videoHref(slide.video?.src)"
                target="_blank"
                rel="noreferrer"
                class="study-video-action"
              >
                <i class="fas fa-up-right-from-square"></i>
                打开视频 / 演示
              </a>
              <div v-else class="study-video-inline-note">
                该页使用内部演示资源标识：{{ slide.video?.src }}。课堂中可由教师现场演示或后续绑定本地视频资源。
              </div>
            </div>
          </section>

          <aside v-if="slide.checkpoints?.length" class="study-video-side">
            <div class="study-side-card study-side-card--observe">
              <div class="study-side-card__eyebrow">观看观察点</div>
              <div class="study-observe-list">
                <div v-for="(point, pointIndex) in slide.checkpoints" :key="`${slide.id}-checkpoint-${pointIndex}`" class="study-observe-item">
                  <span class="study-bullet-index">{{ pointIndex + 1 }}</span>
                  <span>{{ point }}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </template>

      <template v-else-if="slide?.type === 'presentation'">
        <div class="study-presentation-layout">
          <section class="study-presentation-main">
            <div class="study-content-intro">
              <div class="study-content-intro__label">中心课件</div>
              <h3 class="study-slide-subtitle">{{ slide.title }}</h3>
              <p v-if="slide.description" class="study-content-intro__text">{{ slide.description }}</p>
            </div>

            <div v-if="slide.slideRefs?.length" class="study-presentation-stack">
              <div class="study-inline-deck study-inline-deck--presentation">
                <div class="study-inline-deck__toolbar">
                  <div class="study-inline-deck__meta">
                    <span class="study-inline-deck__mode">中心 PPT</span>
                    <span class="study-inline-deck__count">{{ currentInlineIndex + 1 }} / {{ inlineSlides.length }}</span>
                  </div>
                  <button
                    type="button"
                    class="study-slide-viewer-trigger"
                    @click="openSlideViewer(slide, currentInlineIndex)"
                  >
                    <i class="fas fa-expand"></i>
                    <span>进入全屏课件</span>
                  </button>
                </div>

                <div v-if="currentInlineSlide" class="study-inline-deck__stage">
                  <button
                    type="button"
                    class="study-inline-deck__nav study-inline-deck__nav--prev"
                    :disabled="!hasInlinePrev"
                    @click="showPrevInlineSlide"
                  >
                    <i class="fas fa-chevron-left"></i>
                    <span class="sr-only">上一页</span>
                  </button>

                  <button
                    type="button"
                    class="study-inline-deck__canvas"
                    @click="openSlideViewer(slide, currentInlineIndex)"
                  >
                    <span class="study-inline-deck__badge">第 {{ currentInlineIndex + 1 }} 页</span>
                    <img
                      class="study-inline-deck__image study-presentation-image"
                      :src="currentInlineSlide.src"
                      :alt="currentInlineSlide.alt"
                    />
                    <span class="study-inline-deck__hint">
                      <i class="fas fa-up-right-and-down-left-from-center"></i>
                      点击进入沉浸查看
                    </span>
                  </button>

                  <button
                    type="button"
                    class="study-inline-deck__nav study-inline-deck__nav--next"
                    :disabled="!hasInlineNext"
                    @click="showNextInlineSlide"
                  >
                    <i class="fas fa-chevron-right"></i>
                    <span class="sr-only">下一页</span>
                  </button>
                </div>

                <div v-if="inlineSlides.length > 1" class="study-inline-deck__thumbs">
                  <button
                    v-for="(deckSlide, imageIndex) in inlineSlides"
                    :key="`${slide.id}-presentation-slide-${imageIndex}`"
                    type="button"
                    class="study-inline-deck__thumb"
                    :class="{ 'is-active': imageIndex === currentInlineIndex }"
                    @click="setInlineSlideIndex(imageIndex)"
                  >
                    <img
                      class="study-inline-deck__thumb-image"
                      :src="deckSlide.src"
                      :alt="deckSlide.alt"
                    />
                    <span class="study-inline-deck__thumb-index">{{ imageIndex + 1 }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="study-presentation-frame">
              <div class="study-slide-viewer-toolbar study-slide-viewer-toolbar--frame">
                <button
                  v-if="presentationSrc(slide)"
                  type="button"
                  class="study-slide-viewer-trigger"
                  @click="openPresentationViewer(slide)"
                >
                  <i class="fas fa-expand"></i>
                  <span>全屏查看课件</span>
                </button>
              </div>
              <iframe
                v-if="presentationSrc(slide)"
                class="study-presentation-iframe"
                :src="presentationSrc(slide)"
                :title="slide.title || '课件预览'"
              ></iframe>
              <div v-else class="study-presentation-fallback">
                当前课件预览资源尚未生成。
              </div>
            </div>
          </section>

          <aside class="study-presentation-side">
            <section class="study-side-card study-side-card--deliverable">
              <div class="study-side-card__eyebrow">使用方式</div>
              <div class="study-deliverable-card">
                <strong>{{ slide.slideRefs?.length ? '按图片页顺序讲解，再按左侧路径推进' : '先看中间课件，再按左侧路径推进' }}</strong>
                <p>如果需要原始课件文件，仍可在右侧资料区下载 PPT。</p>
              </div>
            </section>
          </aside>
        </div>
      </template>

      <template v-else-if="slide?.type === 'code'">
        <div class="study-code-layout">
          <section class="study-code-main">
            <div class="study-content-intro">
              <div class="study-content-intro__label">代码实验</div>
              <h3 class="study-slide-subtitle">{{ slide.title }}</h3>
              <p v-if="slide.description" class="study-content-intro__text">{{ slide.description }}</p>
            </div>

            <div v-if="slide.prompt" class="study-prompt-box">
              <div class="study-prompt-head">
                <div class="study-prompt-head-main">
                  <div class="study-prompt-dots flex gap-1">
                    <div class="h-2 w-2 rounded-full bg-rose-500"></div>
                    <div class="h-2 w-2 rounded-full bg-amber-500"></div>
                    <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
                  </div>
                  <div class="study-prompt-label">Code Prompt</div>
                </div>
                <button
                  type="button"
                  class="study-prompt-copy"
                  @click="copyPrompt(slide.prompt)"
                >
                  <i class="fas fa-copy"></i>
                  <span>复制提示词</span>
                </button>
              </div>
              <pre class="study-prompt-code">{{ slide.prompt }}</pre>
            </div>

            <div v-if="slide.starterCode" class="study-code-console">
              <div class="study-code-console__head">
                <div class="study-code-console__label">Starter Code</div>
                <div class="study-code-console__lang">
                  {{ slide.language || 'text' }}
                </div>
              </div>
              <pre class="study-prompt-code">{{ slide.starterCode }}</pre>
            </div>
          </section>

          <aside class="study-code-side">
            <section v-if="slide.runHint || slide.expectedOutput" class="study-side-card study-side-card--console">
              <div class="study-side-card__eyebrow">实验提示</div>
              <div class="study-code-notes">
                <div v-if="slide.runHint" class="study-code-note study-code-note--warning">
                  <strong>运行提示</strong>
                  <p>{{ slide.runHint }}</p>
                </div>
                <div v-if="slide.expectedOutput" class="study-code-note study-code-note--success">
                  <strong>预期输出</strong>
                  <p>{{ slide.expectedOutput }}</p>
                </div>
              </div>
            </section>

            <section v-if="slide.files?.length" class="study-side-card study-side-card--files">
              <div class="study-side-card__eyebrow">建议文件结构</div>
              <div class="study-file-list">
                <div v-for="(file, fileIndex) in slide.files" :key="`${slide.id}-file-${fileIndex}`" class="study-file-item">
                  <div class="study-file-item__head">
                    <strong>{{ file.path }}</strong>
                    <span v-if="file.language">{{ file.language }}</span>
                  </div>
                  <pre class="study-file-item__content">{{ file.content }}</pre>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </template>

      <template v-else-if="slide?.type === 'quiz'">
        <div class="study-quiz-stage">
          <div class="study-quiz-stage__hero">
            <div>
              <div class="study-content-intro__label">随堂测验</div>
              <h3 class="study-slide-subtitle">{{ slide.title }}</h3>
            </div>
            <div class="study-quiz-stage__count">{{ slide.items.length }} 题</div>
          </div>

          <div class="study-quiz-box">
            <div class="study-quiz-list">
              <div v-for="(item, itemIndex) in slide.items" :key="item.id || `${slide.id}-quiz-${itemIndex}`" class="study-quiz-item">
                <div class="study-quiz-item__head">
                  <div class="study-quiz-item__index">{{ itemIndex + 1 }}</div>
                  <h4 class="study-quiz-item__question">{{ item.question }}</h4>
                </div>
                <div class="study-check-options">
                  <button
                    v-for="(option, optionIndex) in item.options"
                    :key="`${slide.id}-quiz-${itemIndex}-option-${optionIndex}`"
                    type="button"
                    class="study-check-option"
                    :class="quizOptionClass(slide.id, itemIndex, optionIndex, item.answer)"
                    @click="selectQuizOption(slide.id, itemIndex, optionIndex)"
                  >
                    <span class="study-check-option__index">{{ optionIndex + 1 }}</span>
                    <span v-html="safeHtml(option)"></span>
                  </button>
                </div>
                <div
                  v-if="hasQuizResponse(slide.id, itemIndex)"
                  class="study-check-result"
                  :class="quizResultClass(slide.id, itemIndex, item.answer)"
                >
                  <div class="study-check-result__label">{{ isQuizCorrect(slide.id, itemIndex, item.answer) ? '本题正确' : '本题再想想' }}</div>
                  <p v-if="item.explanation" class="study-check-result__text">{{ item.explanation }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <h3 v-if="slide?.title && slide.title !== slide.phaseTitle" class="study-slide-subtitle">
          {{ slide.title }}
        </h3>
        <article v-if="slide?.content" class="slide-prose markdown-premium" v-html="safeHtml(slide.content)"></article>
        <p v-else-if="slide?.description" class="text-base font-medium leading-7 text-slate-700">
          {{ slide.description }}
        </p>

        <div v-if="slide?.resources?.length" class="study-resource-box">
          <div class="study-resource-head">
            <div class="study-resource-icon">
              <i class="fas fa-bolt"></i>
            </div>
            <div>
              <div class="study-resource-kicker">Crash Course</div>
              <div class="study-resource-title">和当前知识点直接对应的速学资源</div>
            </div>
          </div>

          <div class="study-resource-list">
            <a
              v-for="(resource, resourceIndex) in slide.resources"
              :key="resourceIndex"
              :href="resource.url"
              target="_blank"
              rel="noreferrer"
              class="study-resource-link"
            >
              <div class="study-resource-copy min-w-0">
                <div class="study-resource-meta">
                  <span>{{ resource.provider || '外部链接' }}</span>
                  <span v-if="resource.tag" class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] text-amber-800">{{ resource.tag }}</span>
                </div>
                <div class="study-resource-link-title">{{ resource.title }}</div>
              </div>
              <div class="study-resource-arrow">
                <i class="fas fa-arrow-up-right-from-square text-xs"></i>
              </div>
            </a>
          </div>
        </div>

        <div v-if="slide?.prompts?.length" class="study-prompt-list">
          <div v-for="(prompt, promptIndex) in slide.prompts" :key="promptIndex" class="study-prompt-box">
            <div class="study-prompt-head">
              <div class="study-prompt-head-main">
                <div class="study-prompt-dots flex gap-1">
                  <div class="h-2 w-2 rounded-full bg-rose-500"></div>
                  <div class="h-2 w-2 rounded-full bg-amber-500"></div>
                  <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
                </div>
                <div class="study-prompt-label">{{ prompt.label || 'Prompt' }}</div>
              </div>
              <button
                class="study-prompt-copy"
                @click="copyPrompt(prompt.text)"
              >
                <i class="fas fa-copy"></i>
                <span>复制提示词</span>
              </button>
            </div>
            <pre class="study-prompt-code">{{ prompt.text }}</pre>
          </div>
        </div>

        <div v-if="slide?.steps?.length || slide?.tasks?.length" class="study-task-box">
          <div class="study-task-kicker">实践任务</div>
          <div class="study-task-list">
            <div
              v-for="(task, taskIndex) in (slide.steps || slide.tasks)"
              :key="taskIndex"
              class="study-task-item"
            >
              <div class="study-task-index">
                {{ taskIndex + 1 }}
              </div>
              <div class="study-task-copy slide-prose" v-html="safeHtml(task)"></div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="viewerOpen"
      class="study-slide-viewer"
      role="dialog"
      aria-modal="true"
      :aria-label="viewerTitle || '课件全屏查看'"
      @click.self="closeSlideViewer"
    >
      <div class="study-slide-viewer__panel">
        <div class="study-slide-viewer__topbar">
          <div class="study-slide-viewer__topbar-card">
            <div class="study-slide-viewer__meta">
              <div class="study-slide-viewer__eyebrow">
                {{ viewerMode === 'iframe' ? '中心课件预览' : '沉浸式课件模式' }}
              </div>
              <div class="study-slide-viewer__title">{{ viewerTitle }}</div>
            </div>

            <div class="study-slide-viewer__actions">
              <div v-if="viewerMode === 'images' && viewerSlides.length" class="study-slide-viewer__counter">
                {{ viewerIndex + 1 }} / {{ viewerSlides.length }}
              </div>
              <button
                type="button"
                class="study-slide-viewer__close"
                @click="closeSlideViewer"
              >
                <i class="fas fa-xmark"></i>
                <span>关闭</span>
              </button>
            </div>
          </div>
        </div>

        <div class="study-slide-viewer__stage">
          <button
            v-if="viewerMode === 'images' && viewerSlides.length > 1"
            type="button"
            class="study-slide-viewer__nav study-slide-viewer__nav--prev"
            :disabled="!hasPrevViewerSlide"
            @click="showPrevSlide"
          >
            <i class="fas fa-chevron-left"></i>
            <span class="sr-only">上一页</span>
          </button>

          <div class="study-slide-viewer__canvas">
            <img
              v-if="viewerMode === 'images' && currentViewerSlide"
              class="study-slide-viewer__image"
              :src="currentViewerSlide.src"
              :alt="currentViewerSlide.alt"
            />
            <iframe
              v-else-if="viewerMode === 'iframe' && viewerFrameSrc"
              class="study-slide-viewer__iframe"
              :src="viewerFrameSrc"
              :title="viewerTitle || '课件预览'"
            ></iframe>
          </div>

          <button
            v-if="viewerMode === 'images' && viewerSlides.length > 1"
            type="button"
            class="study-slide-viewer__nav study-slide-viewer__nav--next"
            :disabled="!hasNextViewerSlide"
            @click="showNextSlide"
          >
            <i class="fas fa-chevron-right"></i>
            <span class="sr-only">下一页</span>
          </button>
        </div>

        <div
          v-if="viewerMode === 'images' && viewerSlides.length > 1"
          class="study-slide-viewer__thumbs"
        >
          <button
            v-for="(deckSlide, imageIndex) in viewerSlides"
            :key="`${viewerTitle}-viewer-thumb-${imageIndex}`"
            type="button"
            class="study-slide-viewer__thumb"
            :class="{ 'is-active': imageIndex === viewerIndex }"
            @click="setViewerSlideIndex(imageIndex)"
          >
            <img
              class="study-slide-viewer__thumb-image"
              :src="deckSlide.src"
              :alt="deckSlide.alt"
            />
            <span class="study-slide-viewer__thumb-index">{{ imageIndex + 1 }}</span>
          </button>
        </div>

        <div class="study-slide-viewer__hint">
          {{ viewerMode === 'iframe' ? '点击右上角关闭返回课程舞台。' : '左右方向键切换页面，Esc 关闭。' }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { safeHtml } from '../../utils/safeHtml.js';
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue';

const props = defineProps({
  slide: { type: Object, default: null },
  slideModeLabel: { type: Function, required: true },
  slideTypeIcon: { type: Function, required: true },
  presentationSrc: { type: Function, required: true },
  videoProviderLabel: { type: Function, required: true },
  videoHref: { type: Function, required: true },
  copyPrompt: { type: Function, required: true },
  selectCheckOption: { type: Function, required: true },
  hasCheckResponse: { type: Function, required: true },
  checkOptionClass: { type: Function, required: true },
  checkResultClass: { type: Function, required: true },
  isCheckCorrect: { type: Function, required: true },
  selectQuizOption: { type: Function, required: true },
  hasQuizResponse: { type: Function, required: true },
  quizOptionClass: { type: Function, required: true },
  quizResultClass: { type: Function, required: true },
  isQuizCorrect: { type: Function, required: true }
});

const viewerOpen = ref(false);
const viewerMode = ref('images');
const viewerTitle = ref('');
const viewerSlides = ref([]);
const viewerIndex = ref(0);
const viewerFrameSrc = ref('');
const activeInlineIndex = ref(0);

const currentViewerSlide = computed(() => viewerSlides.value[viewerIndex.value] || null);
const hasPrevViewerSlide = computed(() => viewerIndex.value > 0);
const hasNextViewerSlide = computed(() => viewerIndex.value < viewerSlides.value.length - 1);
const inlineSlides = computed(() => {
  const slide = props.slide;
  return (slide?.slideRefs || [])
    .map((refPath, pageIndex) => ({
      src: buildSlideImageSrc(slide, refPath),
      alt: `${slide?.title || slide?.phaseTitle || '课件'} 课件页 ${pageIndex + 1}`
    }))
    .filter(page => page.src);
});
const currentInlineIndex = computed(() => clampIndex(activeInlineIndex.value, inlineSlides.value.length));
const currentInlineSlide = computed(() => inlineSlides.value[currentInlineIndex.value] || null);
const hasInlinePrev = computed(() => currentInlineIndex.value > 0);
const hasInlineNext = computed(() => currentInlineIndex.value < inlineSlides.value.length - 1);

let previousBodyOverflow = '';
let bodyScrollLocked = false;

watch(
  () => [props.slide?.id, inlineSlides.value.length],
  () => {
    activeInlineIndex.value = 0;
  }
);

function clampIndex(index, length) {
  if (!length) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

function buildSlideImageSrc(slide, refPath) {
  const materialsRoot = String(slide?.project || slide?.courseId || '').trim();
  if (!materialsRoot || !refPath) return '';
  const encoded = String(refPath)
    .split('/')
    .filter(Boolean)
    .map(part => encodeURIComponent(part))
    .join('/');
  return `/api/v1/download/${encodeURIComponent(materialsRoot)}/${encoded}?inline=1`;
}

function lockBodyScroll() {
  if (typeof document === 'undefined' || bodyScrollLocked) return;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  bodyScrollLocked = true;
}

function unlockBodyScroll() {
  if (typeof document === 'undefined' || !bodyScrollLocked) return;
  document.body.style.overflow = previousBodyOverflow;
  previousBodyOverflow = '';
  bodyScrollLocked = false;
}

function openSlideViewer(slide, initialIndex = 0) {
  const pages = slide === props.slide ? inlineSlides.value : (slide?.slideRefs || [])
    .map((refPath, pageIndex) => ({
      src: buildSlideImageSrc(slide, refPath),
      alt: `${slide?.title || slide?.phaseTitle || '课件'} 课件页 ${pageIndex + 1}`
    }))
    .filter(page => page.src);

  if (!pages.length) return;

  viewerMode.value = 'images';
  viewerTitle.value = slide?.title || slide?.phaseTitle || '课件';
  viewerSlides.value = pages;
  viewerIndex.value = clampIndex(initialIndex, pages.length);
  viewerFrameSrc.value = '';
  viewerOpen.value = true;
  lockBodyScroll();
  requestNativeFullscreen();
}

function openPresentationViewer(slide) {
  const src = props.presentationSrc(slide);
  if (!src) return;

  viewerMode.value = 'iframe';
  viewerTitle.value = slide?.title || slide?.phaseTitle || '课件';
  viewerSlides.value = [];
  viewerIndex.value = 0;
  viewerFrameSrc.value = src;
  viewerOpen.value = true;
  lockBodyScroll();
  requestNativeFullscreen();
}

function closeSlideViewer() {
  viewerOpen.value = false;
  viewerMode.value = 'images';
  viewerTitle.value = '';
  viewerSlides.value = [];
  viewerIndex.value = 0;
  viewerFrameSrc.value = '';
  unlockBodyScroll();
  exitNativeFullscreen();
}

function requestNativeFullscreen() {
  nextTick(() => {
    const viewerEl = document.querySelector('.study-slide-viewer');
    if (viewerEl && viewerEl.requestFullscreen) {
      viewerEl.requestFullscreen().catch(() => {});
    }
  });
}

function exitNativeFullscreen() {
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function handleFullscreenChange() {
  if (!document.fullscreenElement && viewerOpen.value) {
    closeSlideViewer();
  }
}

function showPrevSlide() {
  if (!hasPrevViewerSlide.value) return;
  viewerIndex.value -= 1;
}

function showNextSlide() {
  if (!hasNextViewerSlide.value) return;
  viewerIndex.value += 1;
}

function setViewerSlideIndex(index) {
  viewerIndex.value = clampIndex(index, viewerSlides.value.length);
}

function setInlineSlideIndex(index) {
  activeInlineIndex.value = clampIndex(index, inlineSlides.value.length);
}

function showPrevInlineSlide() {
  if (!hasInlinePrev.value) return;
  activeInlineIndex.value = currentInlineIndex.value - 1;
}

function showNextInlineSlide() {
  if (!hasInlineNext.value) return;
  activeInlineIndex.value = currentInlineIndex.value + 1;
}

function handleViewerKeydown(event) {
  if (!viewerOpen.value) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeSlideViewer();
    return;
  }

  if (viewerMode.value !== 'images') return;

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    showPrevSlide();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    showNextSlide();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleViewerKeydown);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleViewerKeydown);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  unlockBodyScroll();
});
</script>

<style scoped>
.study-phase-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.study-phase-ppt__stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.study-phase-ppt__page {
  position: relative;
  margin: 0;
  overflow: hidden;
  border-radius: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #f8fafc;
  box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.22);
}

.study-phase-ppt__image {
  display: block;
  width: 100%;
  height: auto;
}

.study-presentation-layout {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(0, 1fr) 20rem;
}

.study-presentation-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.study-presentation-page {
  position: relative;
  margin: 0;
  overflow: hidden;
  border-radius: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #f8fafc;
  box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.22);
}

.study-presentation-image {
  display: block;
  width: 100%;
  height: auto;
}

.study-presentation-frame {
  overflow: hidden;
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #f8fafc;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.study-presentation-iframe {
  display: block;
  width: 100%;
  min-height: 860px;
  border: 0;
  background: white;
}

.study-presentation-fallback {
  min-height: 360px;
  display: grid;
  place-items: center;
  padding: 2rem;
  color: #64748b;
  font-weight: 700;
}

.study-inline-deck {
  position: relative;
  border-radius: 1.8rem;
  padding: 1rem;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 32%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.03), rgba(15, 23, 42, 0.01));
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 28px 60px -42px rgba(15, 23, 42, 0.35);
}

.study-inline-deck__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.study-inline-deck__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.study-inline-deck__mode,
.study-inline-deck__count {
  display: inline-flex;
  align-items: center;
  min-height: 2.4rem;
  padding: 0 0.9rem;
  border-radius: 999px;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.study-inline-deck__mode {
  color: #0f766e;
  background: rgba(209, 250, 229, 0.8);
}

.study-inline-deck__count {
  color: #475569;
  background: rgba(241, 245, 249, 0.9);
}

.study-inline-deck__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 18rem;
}

.study-inline-deck__canvas {
  position: relative;
  display: block;
  width: min(100%, 980px);
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 1.6rem;
  cursor: zoom-in;
  background:
    radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 38%),
    #020617;
  box-shadow: 0 32px 70px -42px rgba(15, 23, 42, 0.52);
}

.study-inline-deck__image {
  display: block;
  width: 100%;
  height: auto;
}

.study-inline-deck__badge {
  position: absolute;
  left: 1rem;
  top: 1rem;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  min-height: 2.2rem;
  padding: 0 0.8rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: white;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  backdrop-filter: blur(10px);
}

.study-inline-deck__hint {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.4rem;
  padding: 0 0.95rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.74);
  color: rgba(248, 250, 252, 0.94);
  font-size: 0.84rem;
  font-weight: 700;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 160ms ease, transform 160ms ease;
}

.study-inline-deck__canvas:hover .study-inline-deck__hint,
.study-inline-deck__canvas:focus-visible .study-inline-deck__hint {
  opacity: 1;
  transform: translateY(0);
}

.study-inline-deck__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  box-shadow: 0 18px 44px -30px rgba(15, 23, 42, 0.38);
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.study-inline-deck__nav:hover:not(:disabled) {
  background: white;
  border-color: rgba(59, 130, 246, 0.32);
}

.study-inline-deck__nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.study-inline-deck__nav--prev {
  left: 1rem;
}

.study-inline-deck__nav--next {
  right: 1rem;
}

.study-inline-deck__thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5.25rem, 1fr));
  gap: 0.75rem;
  margin-top: 0.95rem;
}

.study-inline-deck__thumb {
  position: relative;
  padding: 0;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #e2e8f0;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.study-inline-deck__thumb:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.34);
}

.study-inline-deck__thumb.is-active {
  border-color: rgba(16, 185, 129, 0.58);
  box-shadow: 0 18px 42px -28px rgba(16, 185, 129, 0.5);
}

.study-inline-deck__thumb-image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.study-inline-deck__thumb-index {
  position: absolute;
  left: 0.55rem;
  bottom: 0.55rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.8rem;
  min-height: 1.8rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.76);
  color: white;
  font-size: 0.76rem;
  font-weight: 800;
}

.study-slide-viewer-toolbar--frame {
  margin: 1rem 1rem 0;
}

.study-slide-viewer-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.7rem 1rem;
  box-shadow: 0 16px 40px -28px rgba(15, 23, 42, 0.4);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.study-slide-viewer-trigger:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.32);
  box-shadow: 0 20px 46px -28px rgba(37, 99, 235, 0.32);
}

.study-slide-image-button {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}

.study-slide-image-button:focus-visible,
.study-slide-viewer-trigger:focus-visible,
.study-slide-viewer__nav:focus-visible,
.study-slide-viewer__close:focus-visible {
  outline: 3px solid rgba(59, 130, 246, 0.55);
  outline-offset: 2px;
}

.study-slide-image-hint {
  position: absolute;
  right: 1rem;
  top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.76);
  color: #f8fafc;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 160ms ease, transform 160ms ease;
  pointer-events: none;
}

.study-slide-image-button:hover .study-slide-image-hint,
.study-slide-image-button:focus-visible .study-slide-image-hint {
  opacity: 1;
  transform: translateY(0);
}

.study-slide-viewer {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background:
    radial-gradient(circle at top, rgba(59, 130, 246, 0.18), transparent 28%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.98));
  backdrop-filter: blur(14px);
}

.study-slide-viewer__panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
}

.study-slide-viewer__topbar {
  padding: 1rem 1rem 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 300ms ease, transform 300ms ease;
}

.study-slide-viewer__panel:hover .study-slide-viewer__topbar {
  opacity: 1;
  transform: translateY(0);
}

.study-slide-viewer__topbar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.15rem;
  border-radius: 1.4rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.48);
  box-shadow: 0 24px 60px -42px rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
}

.study-slide-viewer__meta {
  min-width: 0;
}

.study-slide-viewer__eyebrow {
  color: rgba(191, 219, 254, 0.92);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.study-slide-viewer__title {
  color: white;
  font-size: 1.1rem;
  font-weight: 800;
  margin-top: 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.study-slide-viewer__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.study-slide-viewer__counter,
.study-slide-viewer__close {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 23, 42, 0.45);
  color: #f8fafc;
  font-weight: 700;
  min-height: 2.8rem;
  padding: 0 1rem;
}

.study-slide-viewer__close {
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.study-slide-viewer__close:hover {
  background: rgba(30, 41, 59, 0.82);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.study-slide-viewer__stage {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.study-slide-viewer__canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  border-radius: 0;
  background: transparent;
  border: 0;
}

.study-slide-viewer__image,
.study-slide-viewer__iframe {
  display: block;
  width: auto;
  max-width: 100%;
  max-height: 100%;
  border-radius: 0.25rem;
  box-shadow: 0 24px 72px -40px rgba(15, 23, 42, 0.62);
  background: white;
  object-fit: contain;
}

.study-slide-viewer__iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.study-slide-viewer__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(15, 23, 42, 0.68);
  color: white;
  box-shadow: 0 18px 44px -32px rgba(15, 23, 42, 0.8);
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.study-slide-viewer__nav:hover:not(:disabled) {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(191, 219, 254, 0.4);
}

.study-slide-viewer__nav:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

.study-slide-viewer__nav--prev {
  left: 1.4rem;
}

.study-slide-viewer__nav--next {
  right: 1.4rem;
}

.study-slide-viewer__thumbs {
  display: flex;
  gap: 0.8rem;
  padding: 1rem;
  overflow-x: auto;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 300ms ease, transform 300ms ease;
  justify-content: center;
}

.study-slide-viewer__panel:hover .study-slide-viewer__thumbs {
  opacity: 1;
  transform: translateY(0);
}

.study-slide-viewer__thumb {
  position: relative;
  flex: 0 0 7rem;
  padding: 0;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.1);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.study-slide-viewer__thumb:hover {
  transform: translateY(-1px);
  border-color: rgba(125, 211, 252, 0.4);
}

.study-slide-viewer__thumb.is-active {
  border-color: rgba(34, 197, 94, 0.58);
  box-shadow: 0 18px 36px -24px rgba(34, 197, 94, 0.45);
}

.study-slide-viewer__thumb-image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.study-slide-viewer__thumb-index {
  position: absolute;
  left: 0.55rem;
  bottom: 0.55rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.85rem;
  min-height: 1.85rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.78);
  color: white;
  font-size: 0.76rem;
  font-weight: 800;
}

.study-slide-viewer__hint {
  display: none;
}

@media (max-width: 1200px) {
  .study-presentation-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .study-presentation-iframe {
    min-height: 560px;
  }

  .study-slide-viewer__topbar {
    align-items: flex-start;
  }

  .study-slide-viewer__topbar-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .study-slide-viewer__actions {
    width: 100%;
    justify-content: space-between;
  }

  .study-inline-deck__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .study-inline-deck__meta {
    justify-content: space-between;
  }

  .study-slide-viewer__canvas {
    padding: 0.75rem 0.75rem 4.75rem;
  }

  .study-slide-viewer__nav {
    top: auto;
    bottom: 1.3rem;
    transform: none;
  }

  .study-slide-viewer__nav--prev {
    left: calc(50% - 4.25rem);
  }

  .study-slide-viewer__nav--next {
    right: calc(50% - 4.25rem);
  }

  .study-slide-viewer__image,
  .study-slide-viewer__iframe {
    max-height: calc(100vh - 15rem);
  }

  .study-slide-viewer__iframe {
    height: calc(100vh - 15rem);
  }

  .study-inline-deck__nav {
    width: 2.6rem;
    height: 2.6rem;
  }

  .study-inline-deck__nav--prev {
    left: 0.5rem;
  }

  .study-inline-deck__nav--next {
    right: 0.5rem;
  }

  .study-inline-deck__thumbs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
