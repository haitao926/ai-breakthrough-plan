# 赛事创建 Skills 规划

## 目标

把“新增一个赛事”从手工改 JSON，变成可复用的 Codex skill 流程：输入官方通知、报名链接、赛道说明或老师口述，输出可发布的赛事列表数据、详情数据、课程关联建议和字段校验结果。

## 建议拆成 3 个 skills

### 1. `competition-intake`

用于把原始赛事材料整理成结构化信息。

- 输入：官方通知、网页链接、PDF 文本、老师补充说明。
- 输出：赛事名称、slug、层级、学段、方向、状态、时间范围、主办地点、外部链接、附件列表。
- 规则：不确定的信息标记为 `待确认`，不编造日期、主办方或报名入口。

### 2. `competition-profile-builder`

用于生成平台可读的赛事内容文件。

- 写入 `content/portal/competitions.json` 的列表项。
- 写入 `content/portal/competition-details/{slug}.json` 的详情项。
- 自动生成 `fitSummary`、`whyJoin`、`prepAdvice`、`tracks`、`timeline`、`participation`、`resources`、`faq`。
- 保持 JSON 字段顺序稳定，避免无关格式 churn。

### 3. `competition-publish-check`

用于发布前校验。

- 校验 slug 唯一、必填字段完整、详情文件存在。
- 校验 `relatedCourseIds` 能在课程目录中找到。
- 校验附件和外部链接格式。
- 运行前端构建，确认赛事页没有语法和渲染错误。

## 推荐 Skill 目录结构

```text
competition-profile-builder/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── schema.md
│   └── writing-style.md
└── scripts/
    ├── create_competition.mjs
    └── validate_competitions.mjs
```

## 首版字段契约

列表文件 `content/portal/competitions.json`：

- `title`
- `slug`
- `tagline`
- `tier`
- `discipline`
- `schoolStage`
- `status`
- `dateRange`
- `fitSummary`
- `whyJoin`
- `prepAdvice`
- `externalLink`
- `attachments`
- `relatedCourseIds`
- `featuredFlags`
- `host`
- `location`

详情文件 `content/portal/competition-details/{slug}.json`：

- `slug`
- `overview`
- `tracks`
- `timeline`
- `participation`
- `resources`
- `faq`

## 执行流程

1. 读取赛事材料，抽取事实字段。
2. 生成 slug，并检查 `competitions.json` 中是否已存在。
3. 对照课程目录推荐 `relatedCourseIds`，但保留人工确认空间。
4. 生成列表项和详情文件。
5. 运行校验脚本，输出缺失字段、重复 slug、无效课程 ID、链接问题。
6. 运行前端构建，确认赛事作战台可渲染。

## 首版验收标准

- 新增赛事只需要一次输入材料，不需要手改多个文件。
- 生成内容能直接进入赛事列表页和详情页。
- 校验能发现重复 slug、空标题、缺少详情、无效课程 ID。
- Skill 不安装新依赖，优先使用 Node 标准库处理 JSON。
