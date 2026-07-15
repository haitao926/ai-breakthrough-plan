const sanitizeHtml = require('sanitize-html');

const SANITIZE_OPTIONS = {
  allowedTags: [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'blockquote', 'pre', 'code', 'strong', 'em', 'b', 'i', 'u', 'br', 'hr',
    'a', 'div', 'span', 'img'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    '*': ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    a: ['http', 'https', 'mailto'],
    img: ['http', 'https']
  },
  disallowedTagsMode: 'discard',
  allowProtocolRelative: false,
  enforceHtmlBoundary: true,
  transformTags: {
    a: (_tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {})
      }
    })
  }
};

function sanitizeHtmlContent(value) {
  return sanitizeHtml(String(value || ''), SANITIZE_OPTIONS);
}

function sanitizeLessonContent(value) {
  if (typeof value === 'string') return sanitizeHtmlContent(value);
  if (Array.isArray(value)) return value.map(sanitizeLessonContent);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeLessonContent(item)]));
  }
  return value;
}

module.exports = {
  sanitizeHtmlContent,
  sanitizeLessonContent
};
