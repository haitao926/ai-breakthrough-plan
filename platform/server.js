const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream');
const util = require('util');
const pump = util.promisify(pipeline);
const archiver = require('archiver');
const { exec } = require('child_process');

// 注册插件
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname),
  prefix: '/',
  decorateReply: false // 避免污染回复对象
});

// 额外注册 course-files 目录，以便前端可以直接访问 Markdown 文件
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../course-files'),
  prefix: '/course-files/',
  decorateReply: false
});

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
fastify.register(require('@fastify/cors'), {
  origin: ALLOWED_ORIGIN
    ? ALLOWED_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
    : false // 默认关闭跨域，只允许同源
});

fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB 上限，避免异常大文件
  }
});

// 课程资料目录配置
const COURSE_DIR = path.join(__dirname, '../course-files');
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const ALLOWED_PROJECTS = new Set([
  'project1',
  'project2',
  'project3',
  'project4',
  'project5',
  'project6',
  'common'
]);
const STATIC_FORBIDDEN_PREFIXES = [
  '/uploads',
  '/backup',
  '/archive',
  '/test_dir',
  '/node_modules'
];
const STATIC_FORBIDDEN_FILES = new Set([
  '/server.js',
  '/package.json',
  '/package-lock.json',
  '/README.md',
  '/ARCHITECTURE.md',
  '/Enable-LAN-Access.ps1',
  '/organize-docs.bat',
  '/run.bat'
]);
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  '.txt', '.md', '.zip', '.rar', '.7z',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp',
  '.mp4', '.mov', '.avi', '.mkv', '.mp3', '.wav'
]);
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

// 确保课程目录和上传目录存在
if (!fs.existsSync(COURSE_DIR)) {
  fs.mkdirSync(COURSE_DIR, { recursive: true });
  // 创建项目子目录
  for (let i = 1; i <= 6; i++) {
    fs.mkdirSync(path.join(COURSE_DIR, `project${i}`), { recursive: true });
  }
  fs.mkdirSync(path.join(COURSE_DIR, 'common'), { recursive: true });
}

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 保护静态文件访问，避免下载服务端代码或上传目录
fastify.addHook('onRequest', (request, reply, done) => {
  if (request.method === 'GET' || request.method === 'HEAD') {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname.startsWith('/api/')) return done(); // API 路由不拦截
    if (STATIC_FORBIDDEN_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      reply.code(404).send();
      return;
    }
    if (STATIC_FORBIDDEN_FILES.has(pathname)) {
      reply.code(404).send();
      return;
    }
  }
  done();
});

// API 简单鉴权（可选）：设置 AUTH_TOKEN 环境变量后启用
fastify.addHook('preHandler', (request, reply, done) => {
  if (!AUTH_TOKEN) return done();
  if (!request.url.startsWith('/api/')) return done();
  const token = request.headers['x-auth-token'];
  if (token !== AUTH_TOKEN) {
    reply.code(401).send({ error: '未授权' });
    return;
  }
  done();
});

// 获取文件列表API
fastify.get('/api/files/:project', async (request, reply) => {
  const { project } = request.params;
  const subpath = (request.query.path || '').replace(/^[\/\\]+/, ''); // 去除开头的斜杠
  if (!isValidProject(project)) {
    reply.code(400);
    return { files: [], error: '项目选择无效' };
  }
  
  // 安全检查：防止目录遍历
  if (subpath.includes('..')) {
    return { files: [], error: '非法路径' };
  }

  const projectDir = path.join(COURSE_DIR, project);
  const targetDir = path.resolve(projectDir, subpath || '.');

  // 再次确保目标路径在项目目录下
  if (!isPathInside(targetDir, projectDir)) {
    return { files: [], error: '访问被拒绝' };
  }

  if (!fs.existsSync(targetDir)) {
    return { files: [] };
  }

  const files = fs.readdirSync(targetDir).map(filename => {
    if (filename.startsWith('.')) return null; // 跳过隐藏文件
    const filepath = path.join(targetDir, filename);
    try {
      const stats = fs.statSync(filepath);
      return {
        name: filename,
        path: path.join(subpath, filename).replace(/\\/g, '/'), // 相对路径
        size: stats.size,
        type: stats.isDirectory() ? 'folder' : path.extname(filename).slice(1),
        isDirectory: stats.isDirectory(),
        modified: stats.mtime
      };
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  // 排序：文件夹在前，文件在后
  files.sort((a, b) => {
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name);
    }
    return a.isDirectory ? -1 : 1;
  });

  return { files, currentPath: subpath };
});

// 文件下载API (支持子目录)
fastify.get('/api/download/:project/*', (request, reply) => {
  const { project } = request.params;
  const filePathParam = request.params['*'];
  if (!isValidProject(project)) {
    reply.code(400).send({ error: '项目选择无效' });
    return;
  }
  
  // 防止目录遍历
  if (filePathParam.includes('..')) {
    reply.code(403).send({ error: '非法路径' });
    return;
  }

  const projectDir = path.join(COURSE_DIR, project);
  const filepath = path.resolve(projectDir, filePathParam);

  // 确保路径在项目目录下
  if (!isPathInside(filepath, projectDir)) {
    reply.code(403).send({ error: '访问被拒绝' });
    return;
  }

  if (!fs.existsSync(filepath) || fs.statSync(filepath).isDirectory()) {
    reply.code(404).send({ error: '文件不存在' });
    return;
  }

  const filename = path.basename(filepath);
  const fileStream = fs.createReadStream(filepath);
  reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  reply.type('application/octet-stream').send(fileStream);
});

// 文件夹打包下载API
fastify.get('/api/download-folder/:project/*', async (request, reply) => {
  const { project } = request.params;
  const folderPathParam = request.params['*'];
  if (!isValidProject(project)) {
    reply.code(400).send({ error: '项目选择无效' });
    return;
  }

  // 防止目录遍历
  if (folderPathParam.includes('..')) {
    reply.code(403).send({ error: '非法路径' });
    return;
  }

  const projectDir = path.join(COURSE_DIR, project);
  const folderPath = path.resolve(projectDir, folderPathParam);

  // 确保路径在项目目录下
  if (!isPathInside(folderPath, projectDir)) {
    reply.code(403).send({ error: '访问被拒绝' });
    return;
  }

  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    reply.code(404).send({ error: '文件夹不存在' });
    return;
  }

  const folderName = path.basename(folderPath);
  const zipName = `${folderName}.zip`;

  reply.header('Content-Type', 'application/zip');
  reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(zipName)}"`);

  const archive = archiver('zip', {
    zlib: { level: 9 } // 最高压缩级别
  });

  archive.on('error', (err) => {
    request.log.error(err);
    reply.code(500).send({ error: '打包失败' });
  });

  // 使用 glob 模式递归添加文件，确保文件夹结构正确
  archive.glob('**/*', { 
    cwd: folderPath,
    ignore: ['.DS_Store', 'Thumbs.db'], // 忽略系统文件
    dot: true // 包含隐藏文件
  }, { 
    prefix: folderName // 在压缩包中保留根目录名
  });

  archive.finalize();

  return reply.send(archive);
});

// 作业提交API
fastify.post('/api/upload', async (request, reply) => {
  const parts = request.parts();
  let studentName = '';
  let project = '';
  let tmpFilePath = '';
  let originalFilename = '';
  let mimeType = '';

  for await (const part of parts) {
    if (part.type === 'field') {
      if (part.fieldname === 'studentName') studentName = part.value;
      if (part.fieldname === 'project') project = part.value;
    } else if (part.type === 'file') {
      // 先把文件流存到上传根目录的临时文件，等拿到项目/学生信息后再重命名
      originalFilename = part.filename || 'unnamed';
      mimeType = part.mimetype || '';

      const safeOriginal = sanitizeName(originalFilename);
      const tempName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeOriginal}`;
      tmpFilePath = path.join(UPLOAD_DIR, tempName);

      await pump(part.file, fs.createWriteStream(tmpFilePath));
    }
  }

  // 基础校验
  if (!studentName || !project) {
    if (tmpFilePath) safeUnlink(tmpFilePath);
    reply.code(400);
    return { success: false, error: '学生姓名和项目必填' };
  }

  if (!isValidProject(project) || project === 'common') {
    if (tmpFilePath) safeUnlink(tmpFilePath);
    reply.code(400);
    return { success: false, error: '项目选择无效' };
  }

  if (!tmpFilePath) {
    reply.code(400);
    return { success: false, error: '未接收到作业文件' };
  }

  if (!isAllowedFile(originalFilename, mimeType)) {
    if (tmpFilePath) safeUnlink(tmpFilePath);
    reply.code(400);
    return { success: false, error: '不支持的文件类型' };
  }

  // 构建最终保存路径：uploads/{project}/{studentName}/timestamp_filename
  const safeStudent = sanitizeName(studentName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeFilename = sanitizeName(originalFilename) || 'upload';
  const finalFilename = `${timestamp}_${safeFilename}`;
  const finalDir = path.join(UPLOAD_DIR, project, safeStudent);
  const finalPath = path.join(finalDir, finalFilename);

  fs.mkdirSync(finalDir, { recursive: true });
  fs.renameSync(tmpFilePath, finalPath);

  const fileStats = fs.statSync(finalPath);
  recordSubmission({
    studentName: safeStudent,
    project,
    filename: finalFilename,
    size: fileStats.size,
    mimeType,
    savedAt: new Date().toISOString()
  });

  return { success: true, filename: finalFilename, path: `${project}/${safeStudent}/${finalFilename}` };
});

// 团队数据存储路径
const TEAMS_DIR = path.join(UPLOAD_DIR, 'teams');

// 获取团队数据 (轮询同步用)
fastify.get('/api/team/:teamId', async (request, reply) => {
  const { teamId } = request.params;
  const safeTeamId = sanitizeName(teamId);
  const targetFile = path.join(TEAMS_DIR, `${safeTeamId}.json`);

  // 简单安全检查
  if (!targetFile.startsWith(TEAMS_DIR)) {
    reply.code(403).send({ error: '非法路径' });
    return;
  }

  if (!fs.existsSync(targetFile)) {
    // 默认初始化数据结构
    return {
      meta: { name: safeTeamId, vision: '', updatedAt: Date.now() },
      design: { mermaid: 'graph TD;\n    A[用户] --> B[开始];' },
      tasks: []
    }; 
  }

  try {
    const data = fs.readFileSync(targetFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
});

// 保存团队数据
fastify.post('/api/team/:teamId', async (request, reply) => {
  const { teamId } = request.params;
  const data = request.body;
  const safeTeamId = sanitizeName(teamId);
  const targetDir = TEAMS_DIR;
  const targetFile = path.join(targetDir, `${safeTeamId}.json`);

  if (!data) return { error: '无数据' };

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    // 更新最后修改时间
    data.meta = data.meta || {};
    data.meta.updatedAt = Date.now();
    
    fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, timestamp: data.meta.updatedAt };
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({ error: '保存失败' });
    return;
  }
});

// 获取所有团队列表 (教师端用)
fastify.get('/api/all-teams', async (request, reply) => {
  if (!fs.existsSync(TEAMS_DIR)) return [];
  
  const files = fs.readdirSync(TEAMS_DIR);
  const teams = files
    .filter(file => file.endsWith('.json'))
    .map(file => {
      try {
        const content = fs.readFileSync(path.join(TEAMS_DIR, file), 'utf8');
        const data = JSON.parse(content);
        const tasks = data.tasks || [];
        const doneCount = tasks.filter(t => t.status === 'done').length;
        
        return {
          id: file.replace('.json', ''),
          name: data.meta?.name || '未命名小组',
          vision: data.meta?.vision || '',
          taskStats: {
            total: tasks.length,
            done: doneCount,
            progress: tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0
          },
          lastActive: data.meta?.updatedAt || 0
        };
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.lastActive - a.lastActive); // 按活跃时间倒序

  return teams;
});

// 获取所有项目统计信息
fastify.get('/api/stats', async () => {
  const stats = {
    project1: { name: '项目1-体感互动游戏', count: 0, size: 0 },
    project2: { name: '项目2-产品经理', count: 0, size: 0 },
    project3: { name: '项目3-全栈工程师', count: 0, size: 0 },
    project4: { name: '项目4-算法工程师', count: 0, size: 0 },
    project5: { name: '项目5-嵌入式工程师', count: 0, size: 0 },
    project6: { name: '项目6-综合实践', count: 0, size: 0 },
    common: { name: '公共资料', count: 0, size: 0 }
  };

  for (let key in stats) {
    const dir = path.join(COURSE_DIR, key);
    const { count, size } = collectStats(dir);
    stats[key].count = count;
    stats[key].size = size;
  }

  return stats;
});

// Git 一键同步 API (智能版)
fastify.post('/api/git/sync', async (request, reply) => {
  const rootDir = path.resolve(__dirname, '..');
  
  // 辅助函数：执行命令并返回 promise
  const runCmd = (cmd) => new Promise((resolve) => {
    exec(cmd, { cwd: rootDir, encoding: 'utf8' }, (err, stdout, stderr) => {
      resolve({ err, stdout, stderr });
    });
  });

  // 1. 尝试检测状态
  let { err } = await runCmd('git status');
  
  // 如果不是 git 仓库，先初始化
  if (err && err.message.includes('not a git repository')) {
    request.log.info('Initializing new git repository...');
    await runCmd('git init');
    await runCmd('git config user.name "AI Student"');
    await runCmd('git config user.email "student@ai-course.com"');
  }

  // 2. 添加并提交 (本地保存)
  // 使用 || true 忽略 "无变更" 的错误
  await runCmd('git add .');
  const commitResult = await runCmd('git commit -m "Dashboard: Auto-sync"');
  
  const hasChanges = !commitResult.stdout.includes('nothing to commit');
  
  // 3. 尝试推送到远程 (可选)
  const pushResult = await runCmd('git push');
  
  // 4. 构建返回结果
  if (pushResult.err) {
    // 推送失败（通常是因为没有 remote），但本地可能已经保存了
    if (pushResult.err.message.includes('No configured push destination')) {
       return { 
         success: true, 
         message: hasChanges ? '已保存到本地历史 (未配置远程服务器)' : '本地无文件变化',
         warning: 'no_remote'
       };
    }
    // 其他推送错误
    return { 
      success: false, 
      message: '本地保存成功，但云端同步失败', 
      error: pushResult.stderr 
    };
  }

  return { 
    success: true, 
    message: '☁️ 云端同步成功！',
    output: pushResult.stdout 
  };
});

function sanitizeName(name) {
  return String(name).trim().replace(/[^a-zA-Z0-9.\-_ \u4e00-\u9fa5]/g, '_');
}

function isValidProject(project) {
  return ALLOWED_PROJECTS.has(project);
}

function isPathInside(target, base) {
  const normalizedBase = path.resolve(base);
  const normalizedTarget = path.resolve(target);
  return normalizedTarget === normalizedBase || normalizedTarget.startsWith(normalizedBase + path.sep);
}

function isAllowedFile(filename, mimeType) {
  const ext = path.extname(filename || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  // 基础 MIME 检查，避免伪装脚本
  if (mimeType && mimeType.includes('javascript')) return false;
  if (mimeType && mimeType.includes('x-python')) return false;
  return true;
}

function safeUnlink(filepath) {
  try {
    fs.unlinkSync(filepath);
  } catch (err) {
    fastify.log.warn({ err, filepath }, '临时文件清理失败');
  }
}

function recordSubmission(entry) {
  const logPath = path.join(UPLOAD_DIR, 'submissions.jsonl');
  const line = JSON.stringify(entry);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.appendFileSync(logPath, line + '\n');
}

function collectStats(dir) {
  if (!fs.existsSync(dir)) return { count: 0, size: 0 };
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.reduce(
    (acc, entry) => {
      if (entry.name.startsWith('.')) return acc; // 忽略隐藏/系统文件
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const sub = collectStats(fullPath);
        acc.count += sub.count;
        acc.size += sub.size;
      } else {
        const stat = fs.statSync(fullPath);
        acc.count += 1;
        acc.size += stat.size;
      }
      return acc;
    },
    { count: 0, size: 0 }
  );
}

// 主页路由 - 展示统一版课程主页
fastify.get('/', (request, reply) => {
  const stream = fs.createReadStream(path.join(__dirname, 'index.html'));
  reply.type('text/html').send(stream);
});

// 启动服务器
const start = async () => {
  try {
    // 获取局域网IP
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    let localIP = 'localhost';

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          localIP = net.address;
          break;
        }
      }
    }

    await fastify.listen({ port: 8080, host: '0.0.0.0' });

    console.log(`
╔════════════════════════════════════════╗
║     AI课程资料平台已启动成功！           ║
╠════════════════════════════════════════╣
║ 本地访问: http://localhost:8080         ║
║ 驾驶舱  : http://localhost:8080/dashboard.html ║
║ 局域网访问: http://${localIP}:8080      ║
║                                        ║
║ 请将课程资料放入 course-files/ 目录      ║
║   ├── project1/ (项目1资料)             ║
║   ├── project2/ (项目2资料)             ║
║   ├── ... (其他项目)                    ║
║   └── common/ (公共资料)                ║
╚════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
