# 学生科创项目平台 - 项目文件架构与技术架构

## 1. 项目文件架构（全生命周期版）
允许重构为独立模块，避免与课程展示耦合：

```
HAI Tech Lab/
├── apps/
│   ├── web/                 # 前端（学生端/老师端）
│   └── api/                 # 后端 API
├── packages/
│   └── shared/              # 共享类型与状态枚举
├── storage/
│   ├── db/                  # SQLite（本地/小规模）
│   └── uploads/             # 项目附件（开题/里程碑/结题）
├── scripts/                 # 启动与运维脚本
├── docs/                    # 产品与技术文档
└── README.md
```

### 目录说明
- `apps/web`：页面按“学生/老师”区分。
- `apps/api`：统一 API，管理项目全生命周期。
- `storage/`：结构化数据 + 附件分离存储。

## 2. 技术架构（逻辑）
```
浏览器（学生/老师）
        ↓
前端 Web（立项/里程碑/结题/展示）
        ↓
Fastify API（项目/里程碑/文件/统计）
   ├── 数据库（项目、里程碑、状态、反馈）
   └── 文件存储（开题/里程碑/结题附件）
```

## 3. 技术选型（适度增强）
- 前端：React + Vite + Tailwind（或沿用现有静态页逐步迁移）。
- 后端：Node.js + Fastify。
- 数据库：SQLite（本地/小规模）→ PostgreSQL（扩展）。
- 存储：本地文件系统（后续可接对象存储）。

## 4. 关键数据流
- 立项：提交开题 → 审核 → 项目进入进行中
- 过程：里程碑提交 → 老师反馈 → 状态更新
- 中期：中期提交 → 中期评审 → 状态更新
- 结题：结题提交 → 归档 → 展示

## 4.1 阶段类型与状态
- 提交类型：proposal / milestone_1 / milestone_2 / midterm / milestone_3 / final / showcase
- 项目状态：submitted → reviewing → approved/rejected → in_progress → midterm_review → final_review → archived
- 提交状态：submitted → reviewed / needs_changes
- 自动状态切换：proposal → reviewing，midterm → midterm_review，final → final_review

## 5. 部署形态
- 单机/局域网：适合班级使用。
- 校级部署：API + DB 独立部署。

## 6. 与现有平台的衔接建议
- 资源库统一存放在 `content/materials/`。
- 展示墙可复用现有样式体系。

## 7. 对齐改进计划的扩展
- 数据升级：SQLite 起步，后续迁移到 PostgreSQL/MySQL。
- 系统整合：预留与 Gitea 的 OAuth2/Token 接口。
- 前端体验：先落地可用流程，再逐步升级为 SPA。
