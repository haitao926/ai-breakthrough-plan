# AI 破壁计划：安全与工程修复状态

本文是全量安全修复计划的执行记录。代码提交按 Lore 分组，发布前仍需在生产副本完成数据库恢复演练和密钥轮换。

## 已落地

- 认证基线：生产环境拒绝空、过短和公开默认 `AUTH_SECRET`；教师/评委邀请码恒时比较，未配置时关闭注册；CORS、`TRUST_PROXY` 和内存限流有明确默认值。
- 权限模型：项目读取、协作、监督、删除、恢复分离；Judge 仅能访问显式分配项目；课程/课时更新校验创建者或管理员；教师批改同时约束课程所有者、学生和师生绑定。
- 数据与文件：008/009 迁移、软删除/恢复、附件正规化双写、私有下载地址、`resolveUnder` containment 校验、魔数/MIME/SVG 拒绝和旧 `/uploads` 关闭。
- XSS 与前端：服务端递归清洗课时内容，前端所有 `v-html` 通过 `safeHtml()`；WangEditor 动态导入，图片走受保护附件；安全扫描覆盖 Vue/JS HTML sink。
- 工程门禁：API/前端回归测试、ESLint、Vue 类型检查、受控 `checkJs` 范围、生产构建、CI、SQLite 完整性检查、备份和内容 SHA-256 清单。
- 仓库治理：生成构建物不入 Git；`tmp/`、`output/`、`outputs/`、`storage/` 和临时工作区忽略；正式 `ai-creator-*` 内容不使用宽泛前缀删除。

## 验收证据

```text
apps/api: npm test                         59/59 passed
apps/web-vue: npm run verify               security-check + lint + typecheck + typecheck:js + tests + build
release-preflight: --skip-smoke             integrity_check=ok, foreign_key_check=0, backup + manifests
release-preflight: HTTP smoke               health, legacy uploads, invalid IDs, traversal, anonymous API
```

## 发布操作

1. 停止写入，执行 `node scripts/release-preflight.js --skip-smoke`。
2. 在生产副本演练迁移和 SQLite 备份恢复，核对 009 回填计数及坏数据日志。
3. 执行 `scripts/start.sh`，随后运行 `node scripts/release-preflight.js`。
4. Smoke 通过后轮换 `AUTH_SECRET` 并原子重启；旧令牌必须失效。
5. 回滚只使用包含强密钥和私有附件边界的安全提交，不恢复公开 `/uploads`。

## 未自动化的生产动作

- 真实生产副本的停止写入、备份恢复演练和密钥轮换必须由发布负责人执行；本地测试不能替代这些外部状态操作。
- `checkJs` 已先覆盖 5 个稳定模块；其余 legacy 模块的 441 条既有诊断需要分批迁移，扩大范围时必须保持 `typecheck:js` 非空门禁。
