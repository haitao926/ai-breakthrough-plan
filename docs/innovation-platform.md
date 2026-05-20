# 学生科创项目平台（全生命周期版）

## 目标
覆盖学生科创项目从“立项-过程-结题-展示”的全流程管理，当前先实现学生/老师两类角色。

## 阶段模板
- 开题（闸门1）
- 里程碑1：功能一（调研与可行性）
- 里程碑2：功能二（方案设计与原型）
- 中期评审（闸门2）
- 里程碑3：项目集成（MVP 验证）
- 结题评审（闸门3）
- 展示/归档（可选）

## 目录结构
```
SASU AI Lab/
├── apps/
│   ├── web/                 # 前端页面（学生/老师）
│   └── api/                 # 后端 API
├── storage/
│   ├── db/                  # SQLite 数据库文件
│   └── uploads/             # 附件存储
└── docs/                    # 产品与技术文档
```

## 快速开始
1. 安装依赖
```
cd apps/api
npm install
```

2. 启动服务
```
npm start
```

3. 访问页面
- 学生端：`http://localhost:8090/student.html`
- 老师端：`http://localhost:8090/teacher.html`
- 成果展示：`http://localhost:8090/showcase.html`

## 环境变量
- `PORT`：服务端口（默认 8090）
- `DB_PATH`：SQLite 路径（默认 `storage/db/db.sqlite`）
- `UPLOAD_MAX_FILE_SIZE_MB`：上传限制（默认 200）

## 说明
当前版本为“最小可用全生命周期闭环”，支持 CSV 导出与展示墙基础版，后续将按改进计划升级到 SPA 与 Gitea 集成。
