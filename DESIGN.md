# DESIGN.md

> 创新知识库不重做成新页面，而是升级为“看一个视频、完成一次挑战、登上学习榜单、继续走向课程/项目”的探索型学习入口。

## 1. Visual Theme & Atmosphere

**Style**: Existing Knowledge Base Extension
**Keywords**: 探索欲、挑战感、排行榜、学习热情、可完成、可炫耀、学科闯关、成长轨迹
**Tone**: 延续当前浅色卡片体系，并新增独立知识详情页，在知识库内部增加“任务、积分、榜单、探索”的游戏化动机 — NOT 大面积重做、空洞装饰、只为刷分的游戏化
**Feel**: 像学生进入一个知识探索地图，先完成一个短挑战获得积分，再看到自己和同伴正在探索哪些新领域。

**Interaction Tier**: L2 流畅交互
**Dependencies**: CSS only。首版不引入 GSAP、播放器 SDK 或新的 UI 依赖。

### Scope Guard

本次只优化“创新知识库”内容与独立知识详情页的学习体验：

- 保留现有 `Knowledge.vue` 的首页结构：顶部导航、公共页头、分类搜索、学科卡片网格。
- 不重新设计整站导航、不替换公共组件、不改首页风格。
- 新增内容分两层：知识库首页负责发现、搜索、榜单和热度；独立详情页负责视频、挑战、积分和延展探索。
- 单个知识卡片点击后进入 `/knowledge/:disciplineId`，不再用弹窗承载完整学习流程。
- 视频、答题、积分和榜单先做可验证 MVP；排行榜如需跨设备/跨账号，必须接入后端。

## 2. Color Palette & Roles

沿用现有页面主色和学科分类色，不新增独立视觉体系。

```css
:root {
  /* Backgrounds */
  --kb-bg: #f8fafc;
  --kb-surface: rgba(255, 255, 255, 0.72);
  --kb-surface-solid: #ffffff;
  --kb-surface-alt: #f8fafc;
  --kb-surface-hover: #f1f5f9;

  /* Borders */
  --kb-border: #e2e8f0;
  --kb-border-soft: #f1f5f9;
  --kb-border-active: #c7d2fe;

  /* Text */
  --kb-text: #0f172a;
  --kb-text-secondary: #475569;
  --kb-text-tertiary: #94a3b8;

  /* Accent */
  --kb-accent: #4f46e5;
  --kb-accent-hover: #4338ca;
  --kb-accent-soft: #eef2ff;

  /* RGB variants for rgba() */
  --kb-bg-rgb: 248, 250, 252;
  --kb-accent-rgb: 79, 70, 229;

  /* Semantic */
  --kb-success: #16a34a;
  --kb-success-soft: #dcfce7;
  --kb-error: #dc2626;
  --kb-error-soft: #fee2e2;
  --kb-warning: #d97706;
  --kb-warning-soft: #fef3c7;
  --kb-rank-gold: #f59e0b;
  --kb-rank-silver: #94a3b8;
  --kb-rank-bronze: #b45309;
}
```

**Color Rules:**

- 学科色继续来自当前 `palette`：science 蓝、engineering 靛蓝、social 青、人文橙。
- 积分完成态使用绿色，但只用于结果反馈、完成徽章和进度，不覆盖学科主色。
- 排行榜前三名使用金、银、铜，但面积要小，只用于名次徽章和奖杯图标。
- 视频模块使用深色播放器区域，但外层仍保持白色卡片，避免破坏现有平台气质。

## 3. Typography Rules

当前项目大量使用 Tailwind 与既有字体栈，本次不引入外部字体。

**Font Stack:**

```css
/* No new @import. Use existing project typography. */
.knowledge-page {
  font-family: inherit;
}
```

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Detail page title | inherit | 28-36px | 800 | 1.15 | -0.02em |
| Learning unit title | inherit | 18px | 800 | 1.35 | -0.01em |
| Section label | inherit | 12px | 800 | 1.2 | 0.08em |
| Body | inherit | 14px | 400 | 1.7 | — |
| Quiz option | inherit | 14px | 600 | 1.5 | — |
| Points badge | inherit | 12px | 800 | 1.2 | 0.04em |
| Leaderboard rank | inherit | 13px | 900 | 1.2 | 0.02em |

**Typography Rules:**

- 不改变公共页头和卡片标题层级。
- 学习单元标题要明显低于知识详情页主标题，避免抢占页面主线。
- 答题反馈必须短句化：正确、再想想、已获得积分，不写长段解释。
- 排行榜文案强调“探索进度”和“学习贡献”，不要只写“谁分高”。
- **NEVER use**: 新增 Google Fonts、过度装饰字、全站字体替换。

**Text Decoration:**

- 不使用渐变标题或投影标题。
- 完成态用徽章、进度和微文案表达，不用大字报式庆祝。

## 4. Component Stylings

### Learning Unit Panel

```css
.kb-learning-unit {
  margin-top: 24px;
  border: 1px solid var(--kb-border);
  border-radius: 20px;
  background: var(--kb-surface-solid);
  overflow: hidden;
}

.kb-learning-unit__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--kb-border-soft);
}

.kb-learning-unit__status {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 7px 10px;
  background: var(--kb-accent-soft);
  color: var(--kb-accent);
  font-size: 12px;
  font-weight: 800;
}

.kb-learning-unit__status.is-complete {
  background: var(--kb-success-soft);
  color: var(--kb-success);
}
```

### Video Embed

```css
.kb-video {
  background: #020617;
  aspect-ratio: 16 / 9;
  width: 100%;
}

.kb-video iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.kb-video-fallback {
  display: grid;
  place-items: center;
  min-height: 220px;
  color: #e2e8f0;
  text-align: center;
  padding: 24px;
}

.kb-video-fallback a {
  color: #c7d2fe;
  font-weight: 800;
  text-decoration: underline;
}
```

### Quiz Cards

```css
.kb-quiz {
  padding: 18px;
}

.kb-quiz-question {
  border: 1px solid var(--kb-border-soft);
  border-radius: 16px;
  background: var(--kb-surface-alt);
  padding: 14px;
}

.kb-quiz-option {
  width: 100%;
  border: 1px solid var(--kb-border);
  border-radius: 12px;
  background: var(--kb-surface-solid);
  padding: 10px 12px;
  text-align: left;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.kb-quiz-option:hover {
  border-color: var(--kb-border-active);
  background: var(--kb-accent-soft);
}

.kb-quiz-option:active {
  transform: translateY(1px);
}

.kb-quiz-option.is-correct {
  border-color: var(--kb-success);
  background: var(--kb-success-soft);
}

.kb-quiz-option.is-wrong {
  border-color: var(--kb-error);
  background: var(--kb-error-soft);
}
```

### Points Feedback

```css
.kb-points {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--kb-accent-soft), #ffffff);
  border: 1px solid var(--kb-border-active);
  padding: 14px 16px;
}

.kb-points strong {
  color: var(--kb-text);
  font-size: 18px;
  font-weight: 900;
}

.kb-points button {
  border: 0;
  border-radius: 999px;
  background: var(--kb-accent);
  color: #ffffff;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 800;
}

.kb-points button:disabled {
  cursor: not-allowed;
  background: #cbd5e1;
}
```

### Leaderboard Panel

```css
.kb-leaderboard {
  margin-bottom: 24px;
  border: 1px solid var(--kb-border);
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(var(--kb-accent-rgb), 0.12), transparent 34%),
    var(--kb-surface-solid);
  padding: 18px;
}

.kb-leaderboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.kb-leaderboard__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.kb-rank-card {
  border: 1px solid var(--kb-border-soft);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  padding: 14px;
}

.kb-rank-card.is-top {
  border-color: var(--kb-rank-gold);
  background: linear-gradient(135deg, #fffbeb, #ffffff);
}

.kb-rank-card__rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  border-radius: 999px;
  background: var(--kb-accent-soft);
  color: var(--kb-accent);
  font-size: 13px;
  font-weight: 900;
}

.kb-rank-card__score {
  color: var(--kb-text);
  font-size: 20px;
  font-weight: 900;
}
```

### Exploration Links

```css
.kb-next-links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 0 18px 18px;
}

.kb-next-link {
  border: 1px solid var(--kb-border-soft);
  border-radius: 16px;
  background: var(--kb-surface-alt);
  padding: 14px;
  color: var(--kb-text);
  text-decoration: none;
}

.kb-next-link:hover {
  border-color: var(--kb-border-active);
  background: var(--kb-surface-solid);
}
```

### Detail Page Shell

```css
.knowledge-detail-page {
  min-height: 100vh;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.025) 1px, transparent 1px),
    linear-gradient(180deg, rgba(15, 23, 42, 0.025) 1px, transparent 1px),
    radial-gradient(circle at top left, rgba(var(--kb-accent-rgb), 0.1), transparent 32%),
    var(--kb-bg);
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

.kb-detail-hero {
  border: 1px solid rgba(255, 255, 255, 0.66);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(10px);
  padding: 26px;
}

.kb-detail-sidebar {
  position: sticky;
  top: 96px;
  align-self: start;
  display: grid;
  gap: 14px;
}
```

## 5. Layout Principles

**Container:**

- `/knowledge` 首页容器继续使用当前 `max-w-[1320px]`。
- `/knowledge/:disciplineId` 详情页容器使用 `max-w-[1180px]`，桌面端主内容 + 侧边栏。
- 详情页主栏承载视频、挑战题、研究问题、课程和项目探索；侧边栏承载我的积分、学科榜单、下一步入口。

**Spacing Scale:**

- 首页卡片间距保持现状。
- 详情页模块间距使用 `24px-32px`，避免视频、答题和探索区黏在一起。
- 学习单元放在详情页 hero 之后、研究问题之前：学生先看短视频，再用问题深入。
- 答题每题间距 `12px`，选项间距 `8px`，移动端避免密集点击。

**Grid:**

```css
.kb-next-links {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 720px) {
  .kb-next-links {
    grid-template-columns: 1fr;
  }
}
```

### Information Architecture

知识库信息架构建议顺序：

1. `/knowledge` 首页顶部或卡片区上方：`本周探索榜`，展示全站/班级学习热度。
2. `/knowledge` 学科卡片：显示该方向的可获得积分、已完成人数、当前热度和“进入探索”。
3. `/knowledge/:disciplineId` 详情页 hero：学科名称、定义、学习进度、可获得积分。
4. 详情页主任务：`推荐学习单元`，包含 Crash Course/Bilibili 视频、学习目标、预计用时。
5. 详情页挑战：`看完挑战`，3 个短问题，单选或判断优先，不做长表单。
6. 详情页反馈：`获得积分`，达到通过条件后获得积分，并提示榜单名次变化。
7. 详情页探索：研究问题、关键概念、关联课程、项目起步任务。
8. 详情页底部：原有 `为什么值得做`、真实案例和 mini projects，作为深度探索内容。

### Route Structure

- `/knowledge`: 知识库发现页，保留现有 `Knowledge.vue`。
- `/knowledge/:disciplineId`: 新增知识详情页，例如 `/knowledge/ai`、`/knowledge/cs`。
- 首页卡片点击使用 router push 进入详情页，不再设置 `focus` query 打开弹窗。
- 老的 `?focus=ai` 可以在过渡期 redirect 到 `/knowledge/ai`，避免旧链接失效。

## 5.1 Motivation System

目标不是把知识库做成游戏，而是用游戏化结构降低学生进入陌生学科的阻力。

### Motivation Loop

1. 发现：学生看到“本周热门探索”“同学正在学什么”“我能拿多少积分”。
2. 进入：打开一个学科，看到 10 分钟以内的视频挑战。
3. 完成：看视频后回答 3 个问题，获得知识积分。
4. 反馈：显示积分、连续探索天数、班级/全站排名变化。
5. 延展：推荐课程、项目题目、研究问题，让积分变成下一步行动。

### Leaderboard Types

- `本周探索榜`：按一周内获得的知识积分排序，鼓励近期参与。
- `学科探索榜`：每个学科显示该方向积分最高或完成最多的学生。
- `新星榜`：按最近 7 天新增完成数排序，避免老用户长期霸榜。
- `团队榜`：如果后续接项目组，可按小组累计积分展示。

### Student-Facing Copy

- 排行榜标题：`本周知识探索榜`
- 副文案：`看视频、答挑战、解锁新的课程和项目入口。`
- 完成反馈：`+10 知识积分，当前排名上升 2 位`
- 防挫败空态：`还没有人完成这个方向，你可以成为第一个探索者。`

### Anti-Gaming Rules

- 只打开视频不加分，至少完成答题挑战。
- 同一个 learning unit 只首次完成加全额积分，重复答题只更新正确率。
- 错题允许重试，但重试后积分可降低或只给完成分。
- 排行榜展示周期榜优先，不只展示历史总榜。
- 后端版必须服务端校验答案和积分，不接受前端传入分数。

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | no shadow, border only | quiz option, next link |
| Subtle | `0 8px 30px rgba(0, 0, 0, 0.02)` | existing knowledge card |
| Elevated | `0 20px 40px rgba(99, 102, 241, 0.08)` | card hover |
| Detail panel | subtle border + white surface | video challenge and exploration modules |

新增详情页模块不应比首页卡片更花。视频区域靠深色播放器产生层次，不额外堆阴影。

## 7. Animation & Interaction

**Motion Philosophy**: 动效只服务于“我完成了、我进步了、我想继续探索”三个瞬间。
**Tier**: L2

### Dependencies

```html
<!-- No new dependency. -->
```

### Entrance Animation

```css
@keyframes kb-panel-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kb-learning-unit {
  animation: kb-panel-in 220ms ease-out both;
}
```

### Hover & Focus States

```css
.kb-quiz-option:focus-visible,
.kb-next-link:focus-visible,
.kb-points button:focus-visible {
  outline: 3px solid rgba(var(--kb-accent-rgb), 0.28);
  outline-offset: 2px;
}
```

### Completion Feedback

```css
@keyframes kb-points-pop {
  0% {
    transform: scale(0.98);
  }
  60% {
    transform: scale(1.015);
  }
  100% {
    transform: scale(1);
  }
}

.kb-points.is-awarded {
  animation: kb-points-pop 260ms ease-out both;
}
```

### Rank Change Feedback

```css
@keyframes kb-rank-rise {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.kb-rank-change {
  animation: kb-rank-rise 260ms ease-out both;
  color: var(--kb-success);
  font-size: 12px;
  font-weight: 900;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .kb-learning-unit,
  .kb-points.is-awarded,
  .kb-rank-change {
    animation: none;
  }

  .kb-quiz-option,
  .kb-next-link {
    transition: none;
  }
}
```

## 8. Do's and Don'ts

### Do

- 保留现有知识库卡片网格，点击卡片进入独立知识详情页。
- 优先接入已有 Bilibili 资源字段：`provider`、`tag`、`title`、`url`、`note`。
- 每个学科首版只放 1 个主视频学习单元，避免内容过载。
- 每个视频配 3 个问题：事实理解、概念迁移、项目联想。
- 积分首版建议本地保存，等账户成长体系明确后再后端持久化。
- 每个学习单元必须给“下一步”：研究问题、课程、项目三类至少一类。
- Bilibili iframe 失败时必须显示外链 fallback。
- Crash Course 映射要可维护，放在单独 JSON 或 JS 配置里，不直接写死在模板。
- 排行榜优先做“本周榜”和“新星榜”，让新学生也有机会被看见。
- 榜单上显示学习行为摘要，例如“完成 3 个 AI 挑战”，不要只显示裸分。
- 详情页要保留返回知识库入口，避免学生进入后迷路。

### Don't

- 不要再次重做整个 `Knowledge.vue` 的页面视觉；首页只做发现和榜单增强。
- 不要改公共 `SiteNav`、`PublicPageHeader`、`CategorySearchBar` 来服务这个局部需求。
- 不要把 42 个 Crash Course 系列全部塞进每张卡片，首版只做学科相关精选。
- 不要用 autoplay，学生必须主动播放视频。
- 不要因为视频学习单元而删除原有研究问题、关键概念和项目想法。
- 不要把积分做成不可验证的纯按钮点击；至少要完成答题条件。
- 不要首版就引入排行榜、兑换商城、复杂徽章系统。
- 不要让排行榜只奖励刷题速度，应同时奖励连续探索和跨学科探索。
- 不要假设所有 Bilibili 视频都能 iframe 嵌入，必须有普通链接。
- 不要修改数据库结构，除非先确认要做账号级积分。
- 不要新增依赖。

## 9. Responsive Behavior

**Breakpoints:**

| Name | Width | Key Changes |
|------|-------|-------------|
| Desktop | > 980px | 首页榜单横向三列；详情页主栏展示视频挑战，右侧展示我的进度、学科榜和下一步 |
| Tablet | 721-980px | 榜单两列或横向滑动；详情页主栏和侧边栏上下堆叠 |
| Mobile | < 720px | 首页榜单压缩为前三名 + 我的排名；详情页视频、答题、积分、探索全宽单列 |

**Touch Targets:** minimum 44px
**Collapsing Strategy:** 详情页视频、答题、积分、探索按纵向依次堆叠；不在移动端使用横向滚动。

```css
@media (max-width: 720px) {
  .kb-learning-unit__header,
  .kb-points {
    flex-direction: column;
    align-items: stretch;
  }

  .kb-leaderboard__list {
    grid-template-columns: 1fr;
  }

  .kb-quiz-option,
  .kb-points button {
    min-height: 44px;
  }

  .kb-detail-shell {
    grid-template-columns: 1fr;
    padding: 18px 14px 42px;
  }

  .kb-detail-sidebar {
    position: static;
  }
}
```

## 10. Content Model

新增一份知识库学习单元配置，建议路径：

`content/courses/disciplines/learning-units.json`

推荐结构：

```json
[
  {
    "disciplineId": "ai",
    "title": "人工智能到底在学什么？",
    "source": {
      "provider": "Bilibili",
      "tag": "Crash Course Artificial Intelligence",
      "title": "Crash Course Artificial Intelligence",
      "url": "https://www.bilibili.com/video/BV1cp4y1X764/",
      "embedUrl": "https://player.bilibili.com/player.html?bvid=BV1cp4y1X764&page=1&high_quality=1&autoplay=0",
      "note": "先看 #1《What Is Artificial Intelligence》，建立 AI 研究问题框架。"
    },
    "durationMinutes": 10,
    "points": 10,
    "bonus": {
      "firstCompletion": 5,
      "weeklyStreak": 3,
      "crossDiscipline": 5
    },
    "passingScore": 3,
    "questions": [
      {
        "id": "ai-q1",
        "type": "single-choice",
        "prompt": "视频中，人工智能更接近哪一种能力？",
        "options": [
          "让机器在特定任务中表现出智能行为",
          "让机器拥有和人一样的意识",
          "让所有程序自动变正确"
        ],
        "answerIndex": 0,
        "explanation": "首个学习目标是区分 AI 的任务能力和人类意识。"
      }
    ],
    "next": {
      "researchQuestionIds": ["ai-rq-1"],
      "courseIds": ["project4"],
      "projectPrompts": ["选择一个校园场景，写出它是否适合用 AI 解决，以及为什么。"]
    }
  }
]
```

### Progress Storage MVP

首版用 `localStorage` 记录：

```json
{
  "kbLearningProgress:v1": {
    "ai": {
      "completed": true,
      "score": 3,
      "points": 10,
      "completedAt": "2026-06-10T12:00:00.000Z"
    },
    "_profile": {
      "totalPoints": 80,
      "weeklyPoints": 30,
      "completedUnits": 8,
      "streakDays": 3
    }
  }
}
```

本地 MVP 可以展示“我的进度”和模拟个人积分，但真正的全局/班级排行榜必须接入后端：

- `GET /api/v1/knowledge/progress`
- `POST /api/v1/knowledge/progress/:disciplineId`
- `GET /api/v1/knowledge/leaderboard?scope=weekly|all|rising&disciplineId=ai`
- 服务端校验题目答案，不信任前端传入积分。

## 11. Crash Course Mapping Plan

Crash Course 字幕组 API：`https://api.crashcourse.club/serie`，当前返回 42 个系列。首版不要追求“每个学科全部覆盖”，而是先做高相关映射。

| Existing discipline | Primary Crash Course series | Local course/project path |
|---------------------|-----------------------------|---------------------------|
| `ai` 人工智能 | 人工智能 / Artificial Intelligence | `project4` AI 机器学习与神经网络 |
| `cs` 计算机科学 | 计算机科学 / Computer Science | `project3` 全栈式 Web 开发 |
| `tech` 科技与工程 | 工程学 / Engineering | `project5`, `robotics-club`, `maker-camp` |
| `robotics` 机器人 | 工程学 + 计算机科学 | `robotics-club`, `ros2-training-robot` |
| `physics` 物理 | 物理 / Physics | 工程项目前置知识 |
| `math` 数学 | 统计学 / Statistics | `project4` 数据与模型前置 |
| `bio` 生物学 | 生物学 / Biology、动物学 / Zoology | 生命科学研究方向 |
| `medicine` 医学与健康 | 解剖 & 生理、疫情科学 | 健康数据、公共卫生项目 |
| `env` 环境科学 | 生态学 / Ecology、地理学 / Geography | 校园环境监测项目 |
| `psych` 心理与认知 | 心理学 / Psychology | 产品设计、教育研究 |
| `econ` 经济与商业 | 经济学、商学技能 | `project6` 创业实战 |
| `media` 传媒 | 传播学、电影制作、数字信息导航 | 产品表达、信息素养 |
| `history` 历史 | 世界历史、科学史、大历史 | 人文研究方向 |
| `law` 法学 | 知识产权、政府 | 项目合规、知识产权 |
| `art` 艺术 | 电影、电影鉴赏、剧院与表演 | 展示表达与叙事 |
| `culture` 文化 | 神话学、文学、语言学 | 人文项目选题 |
| `social` 社会科学 | 社会学、政府、经济学 | 社会调研与公共议题 |
| `edu` 教育 | 学习技巧、心理学 | 学习方法与教育实验 |
| `design` 设计 | 传播学、电影制作、学习技巧 | `project2` 产品设计 |
| `materials` 材料 | 化学、有机化学、工程学 | 创客与工程材料项目 |

### Video Embedding Rule

从普通 Bilibili URL 提取 BV 号：

- 输入：`https://www.bilibili.com/video/BV1cp4y1X764/`
- 嵌入：`https://player.bilibili.com/player.html?bvid=BV1cp4y1X764&page=1&high_quality=1&autoplay=0`

风险：

- 某些合集具体分 P、cid 或版权限制可能导致 iframe 不能稳定播放。
- 所以 UI 必须同时保留“在 Bilibili 打开”链接。

## 12. Implementation Plan After Approval

### Step 1: Data

- 新建 `content/courses/disciplines/learning-units.json`。
- 首批只做 6-8 个高价值学科：`ai`、`cs`、`tech`、`robotics`、`physics`、`psych`、`econ`、`env`。
- API 层增加读取并合并 learning units 的能力，或者前端单独请求 `/knowledge/learning-units`。

### Step 2: UI

- 在 `apps/web-vue/src/router/index.js` 新增 `/knowledge/:disciplineId` 路由。
- 新建 `apps/web-vue/src/pages/KnowledgeDetail.vue`，负责单个知识详情学习页。
- 在 `Knowledge.vue` 卡片网格上方加入一个克制的 `本周知识探索榜` 模块。
- 修改 `Knowledge.vue` 卡片点击逻辑：进入详情页，不再打开弹窗作为主流程。
- 在 `KnowledgeDetail.vue` 中插入视频学习单元、挑战题、积分反馈和探索路径。
- 视频优先 iframe，失败/缺少 embedUrl 时显示外链卡片。
- 答题状态存于详情页组件内，完成后写入 `localStorage` 或后端进度。

### Step 3: Points and Leaderboard

- MVP：本地积分，只影响当前浏览器。
- 卡片显示轻量标记：`已完成 +10` 或 `视频任务`。
- 如要真实排行榜：新增后端进度与榜单 API，按用户或班级统计。
- 榜单首版展示三类：本周榜、新星榜、我的排名。
- 后续：确认账号成长体系后再接更完整的等级、徽章或兑换，不在首版扩大范围。

### Step 4: Exploration

- `courseIds` 链接到 `/courses` 或具体课程页现有路由。
- `projectPrompts` 作为项目起步任务展示，不自动创建项目。
- 研究问题继续使用现有 `research_questions`，不重复维护。

### Step 5: Verification

- 构造至少 1 个带 learning unit 的学科和 1 个无 learning unit 的学科。
- 验证 Bilibili iframe 与 fallback。
- 验证 `/knowledge` 首页卡片能进入 `/knowledge/:disciplineId`。
- 验证详情页缺失学科时有可理解的空态或返回入口。
- 验证答题完成、返回首页再进入详情页、刷新后完成状态仍存在。
- 验证排行榜空态、我的排名、完成挑战后的积分变化。
- 运行前端 build；如果改 API，运行 API 测试。
