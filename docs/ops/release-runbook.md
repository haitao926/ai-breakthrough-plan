# 生产发布 Runbook

本项目保持单机 Node + SQLite 部署。发布前必须停止写入，完成备份、迁移检查和验证；不要恢复公开 `/uploads` 或旧密钥。

## 发布前

1. 在进程管理器中准备生产环境变量。`AUTH_SECRET` 必须至少 32 字节；教师和评委注册邀请码按需配置，未配置即关闭对应注册。
2. 确认工作区干净，或明确记录与发布无关的用户内容改动：

   ```bash
   git status --short
   git diff --check
   ```

3. 停止 API 写入，备份数据库和运行内容：

   ```bash
   node scripts/release-preflight.js --skip-smoke
   ```

   脚本会执行 `PRAGMA integrity_check`、`foreign_key_check`，使用 SQLite backup API 生成数据库副本，并为 uploads、courses、materials、portal 写入带 SHA-256 的清单。
4. 在生产副本上先演练迁移，检查 `storage/backups/preflight/database-*.json` 中的迁移记录、旧 JSON 附件回填计数和坏数据计数。

## 部署与重启

```bash
./scripts/start.sh
```

启动脚本使用锁文件安装依赖、失败即停止，前端构建在临时目录完成后原子切换；已有数据库会自动执行 SQLite 前置检查。首次启动没有数据库时由 API 创建。

## 发布后 Smoke Test

API 启动后执行：

```bash
node scripts/release-preflight.js
```

固定检查健康接口，并再次生成备份和内容清单。随后人工验证：登录、新旧令牌失效、课程阅读、作业提交/批改、附件权限、Showcase、项目软删除/恢复和限流 `429 + Retry-After`。

## 密钥轮换

确认新版本运行正常后再写入新的 `AUTH_SECRET` 并原子重启。旧令牌必须全部失效，用户重新登录。不要把旧密钥写回回滚版本。

## 回滚

只回滚到已经包含强密钥校验、私有附件下载和 008/009 表结构的安全提交。保留新增表和新密钥；使用发布前生成的 SQLite 备份恢复数据，不恢复公开 `/uploads` 静态服务。

## 故障处理

- `integrity_check` 或 `foreign_key_check` 失败：停止发布，保留现场副本，先恢复最近一次有效备份。
- 附件回填存在坏 JSON、非法路径或数量不一致：不要删除旧 JSON；修复数据后重新执行幂等迁移。
- Smoke Test 失败：保持服务只读或停止服务，检查日志和备份清单后再决定回滚。
