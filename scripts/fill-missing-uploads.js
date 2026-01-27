const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT_DIR, 'storage', 'uploads');
const REPORT_PATH = process.env.MISSING_REPORT
  || path.join(ROOT_DIR, 'storage', 'logs', 'missing-uploads-2026-01-20.csv');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function parseLine(line) {
  const parts = line.split(',');
  if (parts.length < 7) return null;
  const [project, studentName, filename, mimeType, size, savedAt, ...rest] = parts;
  const candidatePaths = rest.join(',').trim();
  return {
    project: project?.trim(),
    studentName: studentName?.trim(),
    filename: filename?.trim(),
    mimeType: mimeType?.trim(),
    size: size?.trim(),
    savedAt: savedAt?.trim(),
    candidatePaths
  };
}

function pickCandidate(candidatePaths) {
  if (!candidatePaths) return null;
  const candidates = candidatePaths.split(' | ').map(value => value.trim()).filter(Boolean);
  return candidates[0] || null;
}

function buildPlaceholderContent(entry) {
  return [
    'MISSING FILE PLACEHOLDER',
    `project: ${entry.project || ''}`,
    `student: ${entry.studentName || ''}`,
    `filename: ${entry.filename || ''}`,
    `mimeType: ${entry.mimeType || ''}`,
    `savedAt: ${entry.savedAt || ''}`
  ].join('\n');
}

function main() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error(`未找到缺失文件报告：${REPORT_PATH}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(REPORT_PATH, 'utf8').split('\n').filter(Boolean);
  const header = lines.shift();
  if (!header) {
    console.error('缺失文件报告为空');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  lines.forEach(line => {
    const entry = parseLine(line);
    if (!entry) {
      skipped += 1;
      return;
    }
    const candidate = pickCandidate(entry.candidatePaths);
    if (!candidate) {
      skipped += 1;
      return;
    }
    const targetPath = path.join(UPLOAD_DIR, candidate);
    if (fs.existsSync(targetPath)) {
      skipped += 1;
      return;
    }
    ensureDir(path.dirname(targetPath));
    fs.writeFileSync(targetPath, buildPlaceholderContent(entry), 'utf8');
    created += 1;
  });

  console.log(`占位文件创建完成：新增 ${created} 个，跳过 ${skipped} 个。`);
}

main();
