# 平台重构与优化计划文档

**日期**: 2026-01-26
**状态**: 规划中
**目标**: 解决当前平台入口分散、工具与工作台脱节、导航冗余等问题，构建统一、流畅的用户体验。

## 1. 当前存在的主要问题 (Current Issues)

### 1.1 核心页面入口隐蔽 (Visibility Issues)
*   **`project_guide.html` (项目类型指南)**:
    *   **现状**: 虽然在首页和侧边栏增加了链接，但作为一个“决策型”页面，它应该出现在用户“产生想法”到“创建项目”的**关键路径**上，而不是作为一个静态参考资料。
    *   **痛点**: 学生在创建项目时容易忽略此指南，导致选题方向不清。

### 1.2 `proposal.html` 与工作台脱节 (Misalignment)
*   **现状**: `proposal.html` 是一个独立的表单页面，拥有详尽的字段（背景、目标、WBS）。然而，`workspace.html` 中的“新建项目”是一个简单的模态框（仅标题、简介）。
*   **痛点**:
    *   **数据断层**: 学生在 `proposal.html` 填写的详细内容无法自动同步到 `workspace.html` 的项目数据中。
    *   **流程割裂**: `proposal.html` 看起来像是一个“一次性提交”的作业，而不是项目管理的起点。

### 1.3 导航与入口混乱 (Navigation & Layout)
*   **现状**:
    *   存在多个并列入口（课程、工作台、知识库、展示墙），用户容易迷失。
    *   **沉浸感不足**: 在进入具体工具（如“开题报告”或“架构绘图”）时，顶部通用的导航栏占用空间且容易导致误触跳出，干扰深度工作。
*   **用户期望**: 希望在进入特定任务（如撰写报告、编码）后，隐藏顶部主导航，采用“沉浸式布局”。

---

## 2. 改进计划 (Improvement Plan)

### 2.1 架构重构：统一入口与布局 (Architecture & Layout)

**目标**: 区分“公共门户”与“应用工作台”。

*   **公共门户 (Portal Layout)**:
    *   **页面**: `index.html` (首页), `knowledge.html` (知识库), `showcase.html` (展示墙), `projects.html` (项目库)。
    *   **特征**: 保留顶部 **Global Navbar**，用于浏览和发现。
*   **应用工作台 (App Layout)**:
    *   **页面**: `workspace.html` 及其内置工具。
    *   **特征**: **移除/隐藏顶部 Global Navbar**。采用 **侧边栏 (Sidebar)** 作为唯一一级导航。
    *   **工具页**: 所有工具页面（如 `charter.html`, `proposal.html`）应作为 `workspace.html` 的 `<iframe>` 子视图或全屏模态框加载，保持上下文一致。

### 2.2 功能整合：Proposal 融入 Workspace (Proposal Integration)

**目标**: 将 `proposal.html` 从“独立表单”转变为工作台中的“核心任务”。

*   **废弃独立的 `proposal.html` 入口**: 不再让学生直接访问此页面提交。
*   **作为“立项”任务嵌入**:
    1.  学生在 `workspace.html` 创建项目（仅需最简信息）。
    2.  进入项目后，**“里程碑 1”** 的第一个强制任务即为 **“撰写开题报告”**。
    3.  点击该任务，在工作台右侧区域加载 `proposal.html` 的重构版（对接后端 API，自动保存到该项目）。

### 2.3 引导优化：Project Guide 的关键植入 (Contextual Guidance)

**目标**: 在用户最需要的时候（决策时）出现。

*   **植入点 1 (新建项目时)**: 在 `workspace.html` 的“新建项目”弹窗中，强制或强烈建议用户先选择“赛道”。点击赛道图标直接弹出 `project_guide.html` 的精简版模态框。
*   **植入点 2 (课程第一课)**: 在 `study.html` 的 Lesson 0 中（已实施），继续强化其作为“前置作业”的地位。

---

## 3. 执行步骤 (Action Items)

### 阶段一：导航与布局清理
1.  [ ] **Layout分离**: 确认 `workspace.html` 已完全移除顶部 Global Nav，仅保留侧边栏。
2.  [ ] **工具内嵌**: 修改 `charter.html`, `kanban.html` 等工具页，使其支持 `?embed=true` 模式（隐藏工具自身的顶部返回栏，适应 iframe 嵌入）。

### 阶段二：Proposal 深度集成
1.  [ ] **API 对接**: 改造 `proposal.html` 的提交逻辑，使其不再是 `alert`，而是调用 `POST /projects/:id/proposal` (需后端支持或存入 generic data)。
2.  [ ] **任务化**: 在 `workspace.html` 的 WBS 模版中，将“完成开题报告”设为默认的第一条任务，点击直接打开集成版 Proposal。

### 阶段三：知识库互通
1.  [ ] **Project Guide 模态化**: 将 `project_guide.html` 的内容封装为一个可复用的组件/模态框，以便在 Workspace 中随时调用，而无需跳转新标签页。

---

**备注**: 此文档将作为后续代码修改的蓝本。
