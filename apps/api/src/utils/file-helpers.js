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
    try {
      const normalizedSegments = segments.map(segment => String(segment || '').replace(/\\/g, '/'));
      const unsafeSegment = normalizedSegments
        .flatMap(segment => segment.split('/'))
        .some(part => !part || part === '.' || part === '..' || part.includes('\0'));
      if (unsafeSegment) return null;
      const rootPath = path.resolve(root);
      const candidate = path.resolve(rootPath, ...normalizedSegments);
      const relative = path.relative(rootPath, candidate);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
      return candidate;
    } catch (_error) {
      return null;
    }
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

  function validateFileSignature(filePath, fileName, mimeType) {
    const ext = path.extname(fileName || '').toLowerCase();
    let head;
    try {
      const fd = fs.openSync(filePath, 'r');
      head = Buffer.alloc(4096);
      const bytesRead = fs.readSync(fd, head, 0, head.length, 0);
      fs.closeSync(fd);
      head = head.subarray(0, bytesRead);
    } catch (_err) {
      return '无法读取上传文件';
    }

    const startsWith = (bytes) => head.subarray(0, bytes.length).equals(Buffer.from(bytes));
    const isSvg = /^\uFEFF?\s*(?:<\?xml[^>]*>\s*)?<svg(?:\s|>)/i.test(head.toString('utf8'));
    if (isSvg || ext === '.svg' || String(mimeType || '').toLowerCase() === 'image/svg+xml') {
      return '不支持 SVG 文件';
    }

    const signatureChecks = {
      '.png': () => startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      '.jpg': () => startsWith([0xff, 0xd8, 0xff]),
      '.jpeg': () => startsWith([0xff, 0xd8, 0xff]),
      '.gif': () => head.subarray(0, 6).toString('ascii') === 'GIF87a' || head.subarray(0, 6).toString('ascii') === 'GIF89a',
      '.webp': () => startsWith([0x52, 0x49, 0x46, 0x46]) && head.subarray(8, 12).toString('ascii') === 'WEBP',
      '.pdf': () => head.subarray(0, 5).toString('ascii') === '%PDF-',
      '.zip': () => startsWith([0x50, 0x4b, 0x03, 0x04]) || startsWith([0x50, 0x4b, 0x05, 0x06]),
      '.rar': () => head.subarray(0, 7).toString('ascii') === 'Rar!\x1a\x07',
      '.7z': () => startsWith([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]),
      '.doc': () => startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      '.xls': () => startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      '.ppt': () => startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
    };
    const check = signatureChecks[ext];
    if (check && !check()) return '文件内容与扩展名不匹配';
    if (['.docx', '.xlsx', '.pptx'].includes(ext) && !signatureChecks['.zip']()) {
      return '文件内容与扩展名不匹配';
    }
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)
      && !String(mimeType || '').toLowerCase().startsWith('image/')) {
      return '文件类型与扩展名不匹配';
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

    try {
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          if (!part.filename) continue;
          const fileError = validateFileType(part.filename, part.mimetype);
          if (fileError) throw new Error(fileError);
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
          const tempFile = { tmpPath, originalName: safeName, mimeType: part.mimetype };
          tempFiles.push(tempFile);
          const signatureError = validateFileSignature(tmpPath, safeName, part.mimetype);
          if (signatureError) throw new Error(signatureError);
        } else {
          fields[part.fieldname] = part.value;
        }
      }
    } catch (err) {
      cleanupTempFiles(tempFiles);
      throw err;
    }

    return { fields, tempFiles };
  }

  function moveTempFiles(tempFiles, projectId, type) {
    const attachments = [];
    const safeType = sanitizeName(type) || 'submission';
    const targetDir = resolveUnder(uploadDir, `project-${sanitizeName(projectId)}`, safeType);
    if (!targetDir) throw new Error('上传路径无效');
    ensureDir(targetDir);

    tempFiles.forEach(file => {
      const safeName = sanitizeName(file.originalName) || 'upload';
      const finalName = `${Date.now()}_${safeName}`;
      const finalPath = resolveUnder(targetDir, finalName);
      if (!finalPath) throw new Error('上传文件名无效');
      fs.renameSync(file.tmpPath, finalPath);
      const stats = fs.statSync(finalPath);
      attachments.push({
        name: safeName,
        path: path.relative(uploadDir, finalPath).replace(/\\/g, '/'),
        size: stats.size,
        mimeType: file.mimeType || null
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
    validateFileSignature,
    validateFileType
  };
}

module.exports = {
  createFileHelpers
};
