# HAI Tech Lab Monorepo 迁移文档（基于当前目录）

> 目标：将当前多套历史目录统一迁移到标准 Monorepo 结构：`apps/`、`content/`、`services/`、`storage/`、`docs/`、`scripts/`。

## 1. 当前目录概览（根目录）

- `innovation-platform/`：新版全栈项目（含 `apps/api`、`apps/web`、`data/db.sqlite`、`storage/uploads`、`packages`、`scripts`）
- `platform/`：旧版静态平台（HTML/CSS/JS + `server.js`）
- `📁 1_Source_Code/🚀 platform_next/`：与 `innovation-platform/` 内容重复的新版副本
- `📁 1_Source_Code/🌐 platform_legacy/`：与 `platform/` 内容重复的旧版副本
- `📁 2_Course_Content/`：课程资料（`common/`、`project1~6/`、`platform/`）
- `📁 3_Services/`：Gitea 服务（`config/`、`custom/`、`data/`、`log/`、`gitea` 可执行文件）
- `📁 4_Student_Data/`：学生数据与提交（`project1~6/`、`submissions.jsonl`、`teams/`）
- `📜 scripts/`：脚本目录（与根目录脚本重复）
- 软链接：
  - `course-files -> 📁 2_Course_Content`
  - `gitea -> 📁 3_Services`
  - `uploads -> 📁 4_Student_Data`
  - `docs -> 📁 1_Source_Code/🚀 platform_next/docs`
  - `archive`/`backup -> 🗃️ z_Archive/`
- 运行日志：`gitea_server.log`、`server.log`

## 2. 目标结构（建议）

```
HAI Tech Lab/
├── apps/
│   ├── web/
│   ├── api/
│   └── legacy/            # 可选：旧版静态平台
├── content/
│   ├── courses/           # 课程结构/元数据（后续整理）
│   └── materials/         # 现有原始课件与资料
├── services/
│   └── gitea/
├── storage/
│   ├── db/
│   ├── uploads/
│   └── logs/              # 可选
├── docs/
│   ├── architecture/
│   └── planning/
├── scripts/
├── package.json           # 可选：Workspaces
├── README.md
└── archive/               # 可选：历史归档
```

> 说明：如果需要共享库，建议新增 `packages/` 或 `libs/`（与 `apps/` 并列）。

## 3. 目录映射清单

| 当前路径 | 目标路径 | 说明 |
| --- | --- | --- |
| `innovation-platform/apps/web` | `apps/web` | 新版前端主入口 |
| `innovation-platform/apps/api` | `apps/api` | 新版后端主入口 |
| `innovation-platform/packages` | `packages/` | 共享包（可选，建议保留） |
| `innovation-platform/data/db.sqlite` | `storage/db/db.sqlite` | 数据库文件 |
| `innovation-platform/storage/uploads` | `storage/uploads/` | 与学生上传合并 |
| `platform/` 或 `📁 1_Source_Code/🌐 platform_legacy/` | `apps/legacy` | 旧版平台（静态） |
| `📁 2_Course_Content/` | `content/materials/` | 先整体迁移，后续再拆分到 `courses/` |
| `AI 破壁计划 - 课程教学大纲 (完整版).pdf` | `content/materials/common/` | 建议归入课程资料 |
| `📁 3_Services/` | `services/gitea/` | 统一 Gitea 服务目录 |
| `📁 4_Student_Data/` | `storage/uploads/` | 与平台上传合并 |
| `docs`（软链）或 `📁 1_Source_Code/🚀 platform_next/docs` | `docs/` | 统一文档中心 |
| `📜 scripts/` + 根目录脚本 | `scripts/` | 合并去重 |
| `🗃️ z_Archive/` | `archive/` | 归档重命名（去 Emoji） |

### 重复目录处理（必须先决策）

- **新版重复**：`innovation-platform/` 与 `📁 1_Source_Code/🚀 platform_next/` 内容高度重复。
  - 建议：保留一个作为“唯一来源”，另一个移入 `archive/`。
- **旧版重复**：`platform/` 与 `📁 1_Source_Code/🌐 platform_legacy/` 内容高度重复。
  - 建议：保留一个作为 `apps/legacy/`，另一个归档。

## 4. 迁移步骤（分阶段）

### 阶段 A：准备与备份

1. 确认“唯一来源”目录（新版/旧版各选一个）。
2. 备份当前状态（可直接使用现有 `🗃️ z_Archive/`）。

### 阶段 B：创建目标结构

```
mkdir -p apps/{web,api,legacy} \
  content/{courses,materials} \
  services/gitea \
  storage/{db,uploads,logs} \
  docs/{architecture,planning} \
  scripts archive
```

### 阶段 C：迁移核心内容（先复制后移动）

- 将 `innovation-platform/apps/*` 复制到 `apps/`。
- 将 `platform/` 复制到 `apps/legacy/`（如保留旧版）。
- 将 `📁 2_Course_Content/` 复制到 `content/materials/`。
- 将 `innovation-platform/data/db.sqlite` 复制到 `storage/db/`。
- 将 `innovation-platform/storage/uploads` 与 `📁 4_Student_Data/` 合并复制到 `storage/uploads/`。
- 将 `📁 3_Services/` 复制到 `services/gitea/`。
- 将 `📁 1_Source_Code/🚀 platform_next/docs` 的内容复制到 `docs/`（如为文档来源）。
- 将根目录脚本与 `📜 scripts/` 合并到 `scripts/`（去重）。

> 建议不迁移 `node_modules/`，移动后在新位置重新安装依赖。

### 阶段 D：更新路径与配置

需要更新的关键文件（详见下一节）：
- 启动脚本、Gitea 配置、旧版平台中的路径引用。
- 将旧路径 `course-files`、`uploads`、`gitea` 更新为新路径。

### 阶段 E：验证与切换

- 验证新结构下能正常启动 `apps/api`、`apps/web`。
- 验证旧版平台 `apps/legacy` 能读取新路径的课程资料与上传文件。
- 验证 Gitea 启动并指向新的数据目录。

### 阶段 F：清理与收尾

- 删除旧的数字目录与软链接（或移入 `archive/`）。
- 统一 `.gitignore`，确保 `storage/`、`services/gitea/data/`、日志文件不被误提交。

## 5. 路径/配置需要更新的文件

- `start.sh`：`INNOVATION_DIR` 指向 `apps/api`；日志输出路径建议指向 `storage/logs/`。
- `start_git_server.sh`：`INSTALL_DIR` 从根目录 `gitea` 改为 `services/gitea`。
- `run.bat`：`cd platform` 改为 `cd apps/legacy`。
- `organize-docs.bat`：`course-files` 改为 `content/materials`。
- `platform/server.js`：
  - `../uploads` 改为 `../storage/uploads/...`
  - `../course-files` 改为 `../content/materials`
- `platform/README.md`：同步更新路径说明。
- `services/gitea/custom/conf/app.ini`：更新 `WORK_PATH`、`APP_DATA_PATH`、`PATH`、`ROOT` 等绝对路径。

> 旧版 HTML 页面里写死了 `course-files/` 与 `uploads/` 路径，如继续使用旧版页面，需要统一替换或保留兼容性软链。

## 6. 建议的兼容策略（可选）

本次迁移不使用软链，所有路径直接调整为新结构。

## 7. 校验清单

- 目录完整性：`apps/`、`content/`、`services/`、`storage/`、`docs/`、`scripts/` 是否齐全。
- 服务启动：
  - `apps/api` 能启动并访问 `storage/db/db.sqlite`。
  - `apps/web` 能正常访问 `apps/api`。
  - `apps/legacy` 可访问课程资料与上传文件。
  - `services/gitea` 可启动并读写 `services/gitea/data`。
- 路径清理：旧目录不再被引用，或已归档。

## 8. 已确认事项

1. 新版唯一来源：`innovation-platform/`。
2. 旧版唯一来源：`platform/`。
3. 不使用兼容性软链。
4. 上传与学生数据统一合并到 `storage/uploads/`。
