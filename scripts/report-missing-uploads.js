const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT_DIR, 'storage', 'uploads');
const JSONL_PATH = process.env.JSONL_PATH || path.join(UPLOAD_DIR, 'submissions.jsonl');
const LOG_DIR = path.join(ROOT_DIR, 'storage', 'logs');

function sanitizeSegment(value) {
  return String(value || '').replace(/[\\/]/g, '').trim();
}

function safeIsoDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function readJsonLines(filePath) {
  return fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
}

function buildOutputPath() {
  const today = new Date();
  const stamp = today.toISOString().slice(0, 10);
  return process.env.OUTPUT_PATH || path.join(LOG_DIR, `missing-uploads-${stamp}.csv`);
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

function main() {
  if (!fs.existsSync(JSONL_PATH)) {
    console.error(`未找到 submissions.jsonl：${JSONL_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  const lines = readJsonLines(JSONL_PATH);
  const rows = [];

  lines.forEach(line => {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch (err) {
      return;
    }

    const legacyProject = String(entry.project || '').trim();
    const filename = String(entry.filename || '').trim();
    const studentName = sanitizeSegment(entry.studentName);
    if (!legacyProject || !filename) return;

    const candidateDirs = [path.join(UPLOAD_DIR, legacyProject)];
    if (studentName) {
      candidateDirs.push(path.join(UPLOAD_DIR, legacyProject, studentName));
    }
    const candidates = candidateDirs.map(dir => path.join(dir, filename));
    const found = candidates.some(candidate => fs.existsSync(candidate));
    if (found) return;

    rows.push([
      legacyProject,
      entry.studentName || '',
      filename,
      entry.mimeType || '',
      entry.size || '',
      safeIsoDate(entry.savedAt || entry.createdAt),
      candidates.map(candidate => path.relative(UPLOAD_DIR, candidate).split(path.sep).join('/')).join(' | ')
    ]);
  });

  const outputPath = buildOutputPath();
  const header = [
    'project',
    'studentName',
    'filename',
    'mimeType',
    'size',
    'savedAt',
    'candidatePaths'
  ];
  const content = [toCsvLine(header), ...rows.map(toCsvLine)].join('\n');
  fs.writeFileSync(outputPath, content);

  console.log(`缺失文件清单已生成：${outputPath}`);
  console.log(`缺失条目：${rows.length}`);
}

main();
