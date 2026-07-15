import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src')
const violations = []
let scannedFiles = 0

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(entryPath)
      continue
    }
    if (!entry.name.endsWith('.vue') && !entry.name.endsWith('.js')) continue

    const source = await readFile(entryPath, 'utf8')
    scannedFiles += 1
    const rawHtmlPattern = /v-html\s*=\s*(["'])(?!safeHtml\s*\()/g
    for (const match of source.matchAll(rawHtmlPattern)) {
      const line = source.slice(0, match.index).split('\n').length
      violations.push(`${path.relative(process.cwd(), entryPath)}:${line}`)
    }
    const imperativeHtmlPattern = /\b(?:innerHTML|outerHTML|srcdoc)\s*[:=]|\.insertAdjacentHTML\s*\(/g
    for (const match of source.matchAll(imperativeHtmlPattern)) {
      const line = source.slice(0, match.index).split('\n').length
      violations.push(`${path.relative(process.cwd(), entryPath)}:${line} (imperative HTML sink)`)
    }
  }
}
await walk(sourceRoot)
if (scannedFiles === 0) {
  console.error('No source files were scanned; refusing a false-green result.')
  process.exitCode = 1
} else if (violations.length > 0) {
  console.error(`Unsafe v-html bindings found:\n${violations.join('\n')}`)
  process.exitCode = 1
} else {
  console.log('All v-html bindings use safeHtml().')
}
