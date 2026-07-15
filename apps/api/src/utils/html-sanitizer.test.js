const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeHtmlContent, sanitizeLessonContent } = require('./html-sanitizer');

test('server HTML policy removes executable markup and unsafe protocols', () => {
  const payload = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg><script>alert(1)</script></svg>',
    '<iframe src="https://evil.example"></iframe>',
    '<style>body{display:none}</style>',
    '<a href="javascript:alert(1)">bad link</a>',
    '<a href="data:text/html;base64,PHNjcmlwdD4=">bad data</a>'
  ].join('');
  const clean = sanitizeHtmlContent(payload);

  assert.doesNotMatch(clean, /script|onerror|iframe|style|javascript:|data:/i);
});
test('server HTML policy keeps the documented rich-text subset', () => {
  const clean = sanitizeHtmlContent(
    '<h2>标题</h2><p>段落 <strong>重点</strong></p><ul><li>列表</li></ul>'
      + '<blockquote>引用</blockquote><pre><code>const answer = 42</code></pre>'
      + '<a href="https://example.com" target="_blank">安全链接</a>'
  );
  assert.match(clean, /<h2>标题<\/h2>/);
  assert.match(clean, /<ul><li>列表<\/li><\/ul>/);
  assert.match(clean, /<pre><code>const answer = 42<\/code><\/pre>/);
  assert.match(clean, /rel="noopener noreferrer"/);
});

test('lesson sanitizer recursively covers task, option and guide fields', () => {
  const lesson = sanitizeLessonContent({
    content: '<p>正文</p><script>alert(1)</script>',
    tasks: [{ prompt: '<img src=x onerror=alert(1)>任务' }],
    options: ['<iframe src="https://evil.example"></iframe>选项'],
    guide: { html: '<a href="javascript:alert(1)">导学</a>' }
  });
  assert.match(lesson.content, /正文/);
  assert.doesNotMatch(JSON.stringify(lesson), /script|onerror|iframe|javascript:/i);
});
