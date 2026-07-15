import DOMPurify from 'dompurify'

const purifier = typeof DOMPurify.sanitize === 'function'
  ? DOMPurify
  : typeof globalThis.window !== 'undefined'
    ? DOMPurify(globalThis.window)
    : null

// Course content is authored by teachers and may contain formatting, but it
// must never be treated as trusted application markup. Keep this policy in one
// place so every v-html consumer receives the same protection.
const ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'span',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul'
]

const ALLOWED_ATTR = [
  'alt',
  'class',
  'colspan',
  'height',
  'href',
  'loading',
  'rel',
  'rowspan',
  'scope',
  'src',
  'start',
  'target',
  'title'
]

const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:\-]|$))/i

purifier?.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

function escapeText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function safeHtml(value) {
  if (value == null || value === '') return ''

  if (!purifier) return escapeText(value)

  return purifier.sanitize(String(value), {
    ALLOWED_ATTR,
    ALLOWED_TAGS,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['form', 'iframe', 'input', 'object', 'script', 'style', 'svg', 'template'],
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
    ALLOWED_URI_REGEXP
  })
}
