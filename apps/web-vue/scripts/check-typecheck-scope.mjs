import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const scope = [
  'src/api/client.js',
  'src/api/portal.js',
  'src/utils/courseMeta.js',
  'src/utils/safeHtml.js',
  'src/utils/userRole.js'
]

const missing = []
for (const relativePath of scope) {
  try {
    await access(path.join(projectRoot, relativePath))
  } catch {
    missing.push(relativePath)
  }
}

if (scope.length === 0 || missing.length > 0) {
  console.error(`Typecheck scope is invalid: fileCount=${scope.length}, missing=${missing.join(',') || 'none'}`)
  process.exit(1)
}

console.log(`Typecheck scope is non-empty: fileCount=${scope.length}`)
