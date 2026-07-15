# SASU AI Lab - 学生科创一站式平台

本仓库是一个多应用同仓项目，覆盖课程内容、平台应用、服务配置与运行数据。

## 目录结构

```
SASU AI Lab/
├── apps/                     # 应用层
│   ├── web-vue/              # Vue 3 + Vite 前端
│   ├── api/                  # Fastify + SQLite 后端
│   └── assessment-data-manager/ # 独立数据管理工具
├── content/                  # 课程内容
│   ├── courses/              # 课程结构/元数据
│   ├── materials/            # 课件/项目资料
│   └── portal/               # 门户竞赛/Banner/故事内容
├── services/                 # 服务配置与数据
│   └── gitea/                # Gitea
├── storage/                  # 运行时数据
│   ├── db/                   # SQLite
│   ├── uploads/              # 上传与提交
│   ├── assessments/          # 评价导出
│   └── logs/                 # 日志
├── docs/                     # 文档中心
└── scripts/                  # 启动与运维脚本
```

## 快速开始

### 新版平台（API + Web）

```bash
cd apps/api
npm ci
npm start
```

后端默认地址：`http://localhost:8090`

前端开发模式：

```bash
cd apps/web-vue
npm install
npm run dev
```

前端开发地址：`http://localhost:5173`

### 账号与权限

- 登录入口：访问 `http://localhost:8090/login`（或首页「登录 / 注册」）
- API 前缀：`/api/v1`
- 生产环境必须设置 `AUTH_SECRET`（至少 32 字节）；启动时会拒绝空值、过短值和公开默认值。
- `TEACHER_INVITE_CODE`、`JUDGE_INVITE_CODE` 未配置时，对应角色注册保持关闭。
- `CORS_ALLOWED_ORIGINS` 仅接受精确来源，`TRUST_PROXY` 默认关闭；完整模板见 `.env.example`。
- 生产部署和密钥轮换流程见 [`docs/ops/release-runbook.md`](docs/ops/release-runbook.md)。

### 旧版平台（静态，已归档）

旧版静态站点已归档到：`docs/archive/legacy-2026-01-31`，当前默认使用 `apps/web-vue`。

### Gitea

```bash
scripts/start_git_server.sh
```

## 资料与数据

- 课程资料：`content/materials/`
- 门户内容：`content/portal/`
- 学生提交与上传：`storage/uploads/`
- 数据库：`storage/db/db.sqlite`

## 历史数据迁移

将 `storage/uploads/submissions.jsonl` 导入 SQLite：

```bash
node scripts/migrate-jsonl-to-sqlite.js
```

## 文档

- 架构设计：`docs/architecture/`
- 规划与流程：`docs/planning/`

## 测试与构建

后端测试：

```bash
cd apps/api
npm test
```

前端测试：

```bash
cd apps/web-vue
npm test
```

前端构建：

```bash
cd apps/web-vue
npm run build
```

前端统一验证（安全扫描、lint、类型检查、测试和构建）：

```bash
cd apps/web-vue
npm ci
npm run verify
```

发布前 SQLite 完整性、备份、内容哈希清单和健康检查：

```bash
node scripts/release-preflight.js --skip-smoke  # 停止写入时执行
node scripts/release-preflight.js               # 服务启动后执行
```
