const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream');
const util = require('util');
const pump = util.promisify(pipeline);
const archiver = require('archiver');
const { exec } = require('child_process');

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatBytes(bytes) {
  const b = Number(bytes);
  if (!Number.isFinite(b) || b <= 0) return '0B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = b;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  const rounded = size >= 10 || unitIndex === 0 ? Math.round(size) : Math.round(size * 10) / 10;
  return `${rounded}${units[unitIndex]}`;
}

// 注册 uploads 目录，用于展示墙图片 (需在根目录注册前，以确保优先匹配)
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../../storage/uploads'),
  prefix: '/uploads/',
  decorateReply: false
});

// 注册插件 (根目录)
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname),
  prefix: '/',
  decorateReply: false // 避免污染回复对象
});

// 额外注册 course-files 目录，以便前端可以直接访问 Markdown 文件
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../../content/materials'),
  prefix: '/course-files/',
  decorateReply: false
});

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
fastify.register(require('@fastify/cors'), {
  origin: ALLOWED_ORIGIN
    ? ALLOWED_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
    : false // 默认关闭跨域，只允许同源
});

const DEFAULT_UPLOAD_MAX_MB = 200;
const UPLOAD_MAX_FILE_SIZE_BYTES =
  parsePositiveInt(process.env.UPLOAD_MAX_FILE_SIZE_BYTES) ??
  (parsePositiveInt(process.env.UPLOAD_MAX_FILE_SIZE_MB) ?? DEFAULT_UPLOAD_MAX_MB) * 1024 * 1024;
const UPLOAD_MAX_FILE_SIZE_LABEL = formatBytes(UPLOAD_MAX_FILE_SIZE_BYTES);

fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: UPLOAD_MAX_FILE_SIZE_BYTES // 上限，避免异常大文件
  }
});

// 课程资料目录配置
const COURSE_DIR = path.join(__dirname, '../../content/materials');
const UPLOAD_DIR = path.join(__dirname, '../../storage/uploads');
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
      // 特殊规则：允许访问 uploads 目录下的图片文件，用于展示墙
      if (pathname.startsWith('/uploads/')) {
        const ext = path.extname(pathname).toLowerCase();
        const allowedImgExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);
        if (allowedImgExts.has(ext)) return done();
      }
      
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

// 获取提交记录API (改进版：递归扫描 + 日志合并)
fastify.get('/api/submissions', async (request, reply) => {
  const logPath = path.join(UPLOAD_DIR, 'submissions.jsonl');
  const fileMap = new Map(); // filename -> metadata from log

  // 1. 读取 submissions.jsonl 建立查找表
  if (fs.existsSync(logPath)) {
    try {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      lines.forEach(line => {
        try {
          const entry = JSON.parse(line);
          // 使用文件名作为Key (包含时间戳，基本唯一)
          if (entry.filename) {
            fileMap.set(entry.filename, entry);
          }
        } catch (e) {}
      });
    } catch (err) {
      request.log.error(err);
    }
  }

  // 2. 递归扫描 uploads 目录
  const allSubmissions = [];
  // 定义允许展示的文件类型：图片 + 文档
  const allowedExts = new Set([
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', 
      '.doc', '.docx', '.pdf', 
      '.ppt', '.pptx', 
      '.xls', '.xlsx', 
      '.txt', '.md',
      '.zip', '.rar'
  ]);
  
  // 递归遍历函数
  const walk = (dir, rootDir) => {
    let list = [];
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.startsWith('.')) continue; // 跳过隐藏文件
        const filePath = path.join(dir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            list = list.concat(walk(filePath, rootDir));
          } else {
            const ext = path.extname(file).toLowerCase();
            if (allowedExts.has(ext)) {
               list.push({
                 filePath,
                 relativePath: path.relative(rootDir, filePath),
                 filename: file,
                 stats
               });
            }
          }
        } catch(e) {}
      }
    } catch (e) {}
    return list;
  };

  const files = walk(UPLOAD_DIR, UPLOAD_DIR);

  // 3. 合并数据
  files.forEach(f => {
    const relativeParts = f.relativePath.split(path.sep);
    
    // 默认元数据
    let project = 'common';
    let studentName = '未知用户';
    
    // 尝试从路径推断元数据
    // 结构可能是: 
    // 1. project/student/filename
    // 2. project/filename
    // 3. filename (root)
    
    if (relativeParts.length >= 2) {
       const firstFolder = relativeParts[0];
       // 如果第一级是已知项目文件夹
       if (ALLOWED_PROJECTS.has(firstFolder)) {
         project = firstFolder;
         if (relativeParts.length >= 3) {
             // project/student/file
             studentName = relativeParts[1];
         } else {
             // project/file (直接在项目文件夹下)
             studentName = '未命名'; 
         }
       } else {
         // 第一级不是项目文件夹 (可能是旧数据结构 或 杂乱文件夹)
         // 保持默认或尝试推测
         if (relativeParts.length >= 2) studentName = firstFolder;
       }
    }

    // 如果日志中有此文件的记录，优先使用日志元数据 (修正项目归属或学生名)
    const logData = fileMap.get(f.filename);
    if (logData) {
        project = logData.project || project;
        studentName = logData.studentName || studentName;
    }
    
    // 如果是从路径推断出的"未命名"，尝试从文件名提取 (格式: timestamp_Name_file.ext)
    if (studentName === '未命名' || studentName === '未知用户') {
        const parts = f.filename.split('_');
        if (parts.length >= 3) {
             // 简单的启发式：假设第二个部分可能是名字
             // 2025-12-12..._muyu_background.html -> muyu
             // 注意：这不一定准，但比"未命名"好
             if (parts[1].length < 20) {
                // studentName = parts[1]; // 暂时不启用自动提取，以免误判
             }
        }
    }

    // 构造 URL (处理路径中的特殊字符)
    // 必须用 path.sep 分割再 map encodeURIComponent，最后用 / 连接
    const urlPath = f.relativePath.split(path.sep).map(p => encodeURIComponent(p)).join('/');
    
    // 简单的类型推断
    const ext = path.extname(f.filename).toLowerCase();
    let type = 'file';
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) type = 'image';
    else if (['.doc', '.docx'].includes(ext)) type = 'word';
    else if (['.pdf'].includes(ext)) type = 'pdf';
    else if (['.ppt', '.pptx'].includes(ext)) type = 'ppt';
    
    allSubmissions.push({
      studentName: sanitizeName(studentName), // 再次清洗确保安全
      project: project,
      filename: f.filename,
      mimeType: type === 'image' ? ('image/' + ext.slice(1)) : 'application/octet-stream',
      fileType: type, // 显式标记类型，方便前端
      savedAt: logData ? logData.savedAt : f.stats.mtime.toISOString(),
      url: `/uploads/${urlPath}`,
      fileSize: f.stats.size
    });
  });

  // 按时间倒序
  return allSubmissions.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
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

// 简单的内存速率限制器
const rateLimiter = new Map();
const UPLOAD_LIMIT_WINDOW = 60 * 1000; // 1分钟
const UPLOAD_LIMIT_COUNT = 5; // 每分钟最多5次上传
const GLOBAL_CONCURRENT_UPLOADS_LIMIT = 20; // 全局最大并发上传数
let currentUploads = 0;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimiter.get(ip);
  
  if (!record) {
    rateLimiter.set(ip, { count: 1, expiry: now + UPLOAD_LIMIT_WINDOW });
    return true;
  }
  
  if (now > record.expiry) {
    rateLimiter.set(ip, { count: 1, expiry: now + UPLOAD_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= UPLOAD_LIMIT_COUNT) {
    return false;
  }
  
  record.count++;
  return true;
}

// 定期清理过期记录，防止内存泄漏
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimiter.entries()) {
    if (now > record.expiry) {
      rateLimiter.delete(ip);
    }
  }
}, UPLOAD_LIMIT_WINDOW);

// 作业提交API
fastify.post('/api/upload', async (request, reply) => {
  // 1. 并发防护
  if (currentUploads >= GLOBAL_CONCURRENT_UPLOADS_LIMIT) {
    reply.code(503).send({ success: false, error: '服务器繁忙，请稍后重试' });
    return;
  }

  // 2. 速率限制防护
  const ip = request.ip || request.socket.remoteAddress;
  if (!checkRateLimit(ip)) {
    reply.code(429).send({ success: false, error: '上传过于频繁，请1分钟后再试' });
    return;
  }

  currentUploads++;
  let tmpFilePath = '';

  try {
    const parts = request.parts();
    let studentName = '';
    let project = '';
    let originalFilename = '';
    let mimeType = '';
    let filePart = null;

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'studentName') studentName = part.value;
        if (part.fieldname === 'project') project = part.value;
      } else if (part.type === 'file') {
        // 限制只允许上传一个文件，如果已有文件则忽略或报错，这里简单处理为取第一个
        if (filePart) {
          part.file.resume(); // 丢弃多余文件，避免请求卡住
          continue;
        }
        filePart = part;
        
        // 先把文件流存到上传根目录的临时文件
        originalFilename = part.filename || 'unnamed';
        mimeType = part.mimetype || '';

        const safeOriginal = sanitizeName(originalFilename);
        // 限制文件名长度，防止文件系统错误
        if (safeOriginal.length > 100) {
            throw new Error('文件名过长');
        }

        const tempName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeOriginal}`;
        tmpFilePath = path.join(UPLOAD_DIR, tempName);

        await pump(part.file, fs.createWriteStream(tmpFilePath));
        
        // 检查文件是否被截断（超过 multipart 限制）
        if (part.file.truncated) {
          throw new Error(`文件大小超过限制 (${UPLOAD_MAX_FILE_SIZE_LABEL})`);
        }
      }
    }

    // 基础校验
    if (!studentName || !project) {
      throw new Error('学生姓名和项目必填');
    }
    
    // 输入清洗与长度限制
    if (studentName.length > 50) {
        throw new Error('姓名过长');
    }

    if (!isValidProject(project) || project === 'common') {
      throw new Error('项目选择无效');
    }

    if (!tmpFilePath || !fs.existsSync(tmpFilePath)) {
      throw new Error('未接收到有效文件');
    }

    if (!isAllowedFile(originalFilename, mimeType)) {
      throw new Error('不支持的文件类型');
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
      ip: ip, // 记录来源IP便于审计
      savedAt: new Date().toISOString()
    });

    return { success: true, filename: finalFilename, path: `${project}/${safeStudent}/${finalFilename}` };

  } catch (err) {
    if (tmpFilePath) safeUnlink(tmpFilePath);
    request.log.warn({ err, ip }, '上传失败');
    // 如果是已知错误直接返回消息，否则返回通用错误
    const message = String(err?.message || '');
    const isTooLarge =
      err?.code === 'FST_REQ_FILE_TOO_LARGE' ||
      message.includes('文件大小超过限制') ||
      /file too large/i.test(message);
    const statusCode = isTooLarge ? 413 : 400;
    reply.code(statusCode);
    return { success: false, error: message || '上传处理失败' };
  } finally {
    currentUploads--;
  }
});

// 上传配置（前端用于提前校验）
fastify.get('/api/upload/config', async () => {
  return {
    maxFileSizeBytes: UPLOAD_MAX_FILE_SIZE_BYTES,
    maxFileSizeLabel: UPLOAD_MAX_FILE_SIZE_LABEL
  };
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
║ 请将课程资料放入 content/materials/ 目录 ║
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
