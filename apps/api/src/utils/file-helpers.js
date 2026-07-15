function createFileHelpers(options) {
  const {
    fs,
    path,
    os,
    pump,
    ensureDir,
    uploadDir,
    uploadMaxBytes,
    uploadMaxMb,
    allowedExtensions,
    allowedMimeTypes,
    extensionMimeMap
  } = options;

  function sanitizeName(name) {
    return String(name || '')
      .trim()
      .replace(/[^a-zA-Z0-9.\-_ \u4e00-\u9fa5]/g, '_')
      .slice(0, 120);
  }

  function resolveUnder(root, ...segments) {
    const rootPath = path.resolve(root);
    const candidate = path.resolve(rootPath, ...segments.map(segment => String(segment || '')));
    const relative = path.relative(rootPath, candidate);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
    return candidate;
  }

  function validateFileType(fileName, mimeType) {
    const ext = path.extname(fileName || '').toLowerCase();
    if (!ext || !allowedExtensions.has(ext)) {
      return '不支持的文件类型';
    }
    if (!mimeType) return '无法识别文件类型';
    if (!allowedMimeTypes.has(mimeType)) {
      return '不支持的文件类型';
    }
    const allowed = extensionMimeMap[ext];
    if (Array.isArray(allowed) && allowed.length && !allowed.includes(mimeType)) {
      return `文件类型与扩展名不匹配：${mimeType}`;
    }
    return null;
  }

  function toCsvValue(value) {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function toCsvLine(values) {
    return values.map(toCsvValue).join(',');
  }

  function streamZip(reply, filename, buildArchive) {
    reply
      .header('Content-Type', 'application/zip')
      .header('Content-Disposition', `attachment; filename="${filename}"`);
    const archive = options.archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => {
      throw err;
    });
    reply.send(archive);
    buildArchive(archive);
    archive.finalize();
  }

  function appendFileSafe(archive, absolutePath, archivePath, missing) {
    if (!fs.existsSync(absolutePath)) {
      missing.push(archivePath);
      return;
    }
    archive.file(absolutePath, { name: archivePath });
  }

  async function collectMultipart(request) {
    const fields = {};
    const tempFiles = [];

    for await (const part of request.parts()) {
      if (part.type === 'file') {
        if (!part.filename) continue;
        const fileError = validateFileType(part.filename, part.mimetype);
        if (fileError) {
          throw new Error(fileError);
        }
        const safeName = sanitizeName(part.filename) || 'upload';
        const tmpName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
        const tmpPath = path.join(os.tmpdir(), tmpName);
        await pump(part.file, fs.createWriteStream(tmpPath));
        if (part.file.truncated) {
          throw new Error(`文件大小超过限制 (${uploadMaxMb}MB)`);
        }
        const stats = fs.statSync(tmpPath);
        if (stats.size > uploadMaxBytes) {
          throw new Error(`文件大小超过限制 (${uploadMaxMb}MB)`);
        }
        tempFiles.push({ tmpPath, originalName: safeName });
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    return { fields, tempFiles };
  }

  function moveTempFiles(tempFiles, projectId, type) {
    const attachments = [];
    const safeType = sanitizeName(type);
    const targetDir = path.join(uploadDir, `project-${projectId}`, safeType);
    ensureDir(targetDir);

    tempFiles.forEach(file => {
      const safeName = sanitizeName(file.originalName) || 'upload';
      const finalName = `${Date.now()}_${safeName}`;
      const finalPath = path.join(targetDir, finalName);
      fs.renameSync(file.tmpPath, finalPath);
      const stats = fs.statSync(finalPath);
      attachments.push({
        name: safeName,
        path: path.relative(uploadDir, finalPath).replace(/\\/g, '/'),
        size: stats.size
      });
    });

    return attachments;
  }

  function cleanupTempFiles(tempFiles) {
    tempFiles.forEach(file => {
      try {
        fs.unlinkSync(file.tmpPath);
      } catch (err) {
        if (err.code !== 'ENOENT') return;
      }
    });
  }

  return {
    appendFileSafe,
    cleanupTempFiles,
    collectMultipart,
    moveTempFiles,
    sanitizeName,
    resolveUnder,
    streamZip,
    toCsvLine,
    validateFileType
  };
}

module.exports = {
  createFileHelpers
};
