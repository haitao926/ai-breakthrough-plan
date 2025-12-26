# AI万花筒项目架构文档

## 📁 项目结构

```
AI万花筒/
├── 📄 index.html                 # 主入口页面（统一界面）
├── 📄 server.js                 # Node.js后端服务器
├── 📄 package.json              # 项目依赖配置
├── 📄 start.bat                 # Windows启动脚本
├── 📄 README.md                 # 项目说明文档
│
├── 📁 css/                      # 样式文件
│   ├── tailwind.min.css         # Tailwind CSS框架
│   └── fontawesome.min.css      # FontAwesome图标
│
├── 📁 js/                       # JavaScript库
│   ├── marked.min.js            # Markdown解析器
│   └── purify.min.js            # HTML清理器
│
├── 📁 fonts/                    # 本地字体文件
│   ├── inter.css                # Inter字体
│   └── noto-sans-sc.css         # 思源黑体
│
├── 📁 webfonts/                 # Web字体
│   └── fa-*                     # FontAwesome字体文件
│
├── 📁 course-files/             # 课程资料存储（按项目分类）
│   ├── common/                  # 公共文档
│   │   ├── 课程总体设计.md
│   │   ├── 能力素养培养体系.md
│   │   ├── 工具清单和资源.md
│   │   └── 教学实施指南.md
│   ├── project1/                # 项目1：体感游戏
│   ├── project2/                # 项目2：产品经理
│   ├── project3/                # 项目3：全栈开发
│   ├── project4/                # 项目4：算法工程
│   ├── project5/                # 项目5：嵌入式
│   └── project6/                # 项目6：综合实践
│
├── 📁 archive/                  # 归档文件
│   ├── html/                    # 旧版HTML文件
│   └── └── README.md           # 归档说明
│
└── 📁 backup/                   # 备份文件
    └── docs/                    # 文档备份
```

## 🏗️ 技术架构

### 前端技术栈
- **HTML5** - 语义化标签
- **Tailwind CSS** - 原子化CSS框架（v2.x）
- **FontAwesome** - 图标库
- **Vanilla JavaScript** - 原生JS交互
- **marked.js** - Markdown解析
- **DOMPurify** - HTML安全清理

### 后端技术栈
- **Node.js** - 运行环境
- **Fastify** - 轻量级Web框架（v4.24.3）
- **@fastify/static** - 静态文件服务
- **@fastify/cors** - 跨域支持
- **@fastify/multipart** - 文件上传支持（未完全实现）

### 开发工具
- **nodemon** - 开发热重载
- **批处理脚本** - Windows快速启动

## 🔌 API接口设计

```
GET  /                          # 主页
GET  /api/stats                 # 获取文件统计信息
GET  /api/files/:project        # 获取项目文件列表
GET  /api/download/:project/:file  # 下载文件
```

## 📱 功能模块

### 1. 展示模块
- 课程概览（6个项目介绍）
- 项目详情（任务分解、技术栈）
- 能力培养体系

### 2. 资源管理模块
- 文件分类存储
- 统计信息展示
- 在线查看Markdown
- 文件下载

### 3. 用户体验模块
- 响应式设计
- 深色模式切换
- 搜索功能
- 平滑动画

## 🎯 架构优点

### ✅ 清晰的目录结构
- 文档按项目分类存储
- 前后端分离
- 资源文件集中管理

### ✅ 模块化设计
- 单页面应用（SPA）架构
- 标签页切换不同功能
- 组件化的UI设计

### ✅ 良好的可扩展性
- 易于添加新项目
- API设计简洁
- 代码结构清晰

### ✅ 用户体验优化
- 统一的视觉风格
- 流畅的交互动画
- 移动端适配

## 🚧 待改进的地方

### 1. 后端安全
- 缺少用户认证
- 文件下载无权限控制
- 需要输入验证

### 2. 功能完善
- 文件上传功能未实现
- 搜索功能需要后端支持
- 缺少文件预览

### 3. 性能优化
- 大文件下载无进度显示
- 没有缓存机制
- CSS/JS未压缩

### 4. 部署运维
- 缺少日志系统
- 无监控告警
- 未配置HTTPS

## 📊 评估结论

当前项目架构属于**中小型Web应用**，具有以下特点：

### 正规程度：⭐⭐⭐⭐ (4/5)

**优点：**
- 目录结构清晰
- 前后端分离
- 使用现代化技术栈
- 代码组织良好

**改进空间：**
- 需要完善安全机制
- 可以引入TypeScript
- 建议添加测试
- 考虑使用构建工具

**总体评价：**
这是一个结构清晰、易于维护的中小型教育平台项目。虽然没有大型企业级应用的复杂架构，但已经具备了良好的基础结构和扩展性。对于当前的项目规模来说，这个架构是合适且规范的。