const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const archiver = require('archiver');

const { createFileHelpers } = require('./file-helpers');

test('file helpers sanitize names, validate types, and build csv lines', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'api-file-helpers-'));
  const uploadDir = path.join(tmpRoot, 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  const helpers = createFileHelpers({
    fs,
    path,
    os,
    pump: pipeline,
    archiver,
    ensureDir: (dirPath) => fs.mkdirSync(dirPath, { recursive: true }),
    uploadDir,
    uploadMaxBytes: 1024 * 1024,
    uploadMaxMb: 1,
    allowedExtensions: new Set(['.csv', '.txt']),
    allowedMimeTypes: new Set(['text/csv', 'text/plain', 'application/octet-stream']),
    extensionMimeMap: {
      '.csv': ['text/csv'],
      '.txt': ['text/plain']
    }
  });

  assert.equal(helpers.sanitizeName(' a/b:c?.csv '), 'a_b_c_.csv');
  assert.equal(helpers.validateFileType('scores.csv', 'text/csv'), null);
  assert.match(helpers.validateFileType('scores.csv', 'text/plain'), /不匹配/);
  assert.equal(helpers.toCsvLine(['a', '1,2', '"q"']), 'a,"1,2","""q"""');
  assert.ok(helpers.resolveUnder(uploadDir, 'project-1', 'notes.txt'));
  assert.equal(helpers.resolveUnder(uploadDir, 'project-1', '..', 'outside.txt'), null);
  assert.equal(helpers.resolveUnder(uploadDir, 'project-1/../outside.txt'), null);

  const sourcePath = path.join(tmpRoot, 'source.txt');
  fs.writeFileSync(sourcePath, 'demo', 'utf8');
  const archiveEntries = [];
  const fakeArchive = {
    file(absolutePath, meta) {
      archiveEntries.push({ absolutePath, name: meta.name });
    }
  };
  const missing = [];
  helpers.appendFileSafe(fakeArchive, sourcePath, 'folder/source.txt', missing);
  helpers.appendFileSafe(fakeArchive, path.join(tmpRoot, 'missing.txt'), 'folder/missing.txt', missing);
  assert.equal(archiveEntries.length, 1);
  assert.deepEqual(missing, ['folder/missing.txt']);

  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

test('file helpers reject SVG masquerading as a raster image and accept real PNG signatures', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'api-file-signature-'));
  const svgPath = path.join(tmpRoot, 'fake.png');
  const pngPath = path.join(tmpRoot, 'real.png');
  fs.writeFileSync(svgPath, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  fs.writeFileSync(pngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const helpers = createFileHelpers({
    fs,
    path,
    os,
    pump: async () => {},
    ensureDir: (dir) => fs.mkdirSync(dir, { recursive: true }),
    uploadDir: path.join(tmpRoot, 'uploads'),
    uploadMaxBytes: 1024,
    uploadMaxMb: 1,
    allowedExtensions: new Set(['.png']),
    allowedMimeTypes: new Set(['image/png']),
    extensionMimeMap: { '.png': ['image/png'] }
  });
  assert.equal(helpers.validateFileSignature(svgPath, 'fake.png', 'image/png'), '不支持 SVG 文件');
  assert.equal(helpers.validateFileSignature(pngPath, 'real.png', 'image/png'), null);
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});
