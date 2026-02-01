# HAI Tech Lab - 学生科创一站式平台

本仓库已统一为 Monorepo 结构，覆盖课程内容、平台应用、服务与存储。

## 目录结构

```
HAI Tech Lab/
├── apps/                     # 应用层
│   ├── web/                  # 新版前端
│   ├── api/                  # 新版后端
│   └── legacy/               # 旧版静态平台
├── content/                  # 课程内容
│   ├── courses/              # 课程结构/元数据
│   └── materials/            # 原始课件资源
├── services/                 # 服务配置与数据
│   └── gitea/                # Gitea
├── storage/                  # 运行时数据
│   ├── db/                   # SQLite
│   ├── uploads/              # 上传与提交
│   └── logs/                 # 日志
├── docs/                     # 文档中心
└── scripts/                  # 启动与运维脚本
```

## 快速开始

### 新版平台（API + Web）

```bash
cd apps/api
npm install
npm start
```

访问地址：`http://localhost:8090`

### 账号与权限

- 登录入口：访问 `http://localhost:8090/login`（或首页「登录 / 注册」）
- API 前缀：`/api/v1`
- 建议设置环境变量：
  - `AUTH_SECRET`：JWT 签名密钥
  - `TEACHER_INVITE_CODE`：老师邀请码（首次创建老师账号可不设置，之后会校验邀请码）

### 旧版平台（静态，已归档）

旧版静态站点已归档到：`docs/archive/legacy-2026-01-31`，当前默认仅使用 Vue 前端。

### Gitea

```bash
scripts/start_git_server.sh
```

## 资料与数据

- 课程资料：`content/materials/`
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
