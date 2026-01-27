# AI Course Platform Core

这是课程平台的工具核心层。它包含：
- **Web Server** (`server.js`): 基于 Fastify 的后端服务。
- **Frontend** (`*.html`, `css/`, `js/`): 课程主页和驾驶舱。

## 目录结构
- 本目录包含通用的平台代码。
- 具体的课程内容请存放在上级目录的 `../../content/materials` 中。
- 运行时产生的数据（作业提交）存放在上级目录的 `../../storage/uploads` 中。

## 开发指南
如需修改页面样式或逻辑，请直接修改本目录下的文件。
修改完成后，无需重启服务（静态文件），但如果修改了 `server.js` 则需要重启。
