import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOTS = ['src/app', 'src/components']
const TARGET_EXT = new Set(['.tsx', '.ts'])
const IGNORE_FILES = new Set(['src/i18n/resources.ts'])

const textNodeRegex = />\s*([A-Za-z][^<{]{2,})\s*</g
const placeholderRegex = /placeholder\s*=\s*["']([^"']*[A-Za-z][^"']*)["']/g

function walk(dir, files = []) {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full, files)
      continue
    }
    if (!TARGET_EXT.has(extname(full))) continue
    files.push(full.replace(/\\/g, '/'))
  }
  return files
}

const findings = []

for (const root of ROOTS) {
  const files = walk(root)
  for (const file of files) {
    if (IGNORE_FILES.has(file)) continue
    const content = readFileSync(file, 'utf8')

    const matchers = [
      { kind: 'text-node', regex: textNodeRegex },
      { kind: 'placeholder', regex: placeholderRegex },
    ]

    for (const { kind, regex } of matchers) {
      regex.lastIndex = 0
      let match
      while ((match = regex.exec(content)) !== null) {
        const value = (match[1] || '').trim()
        if (!value) continue
        if (value.startsWith('{') || value.includes('http')) continue
        findings.push({ file, kind, value })
      }
    }
  }
}

if (findings.length) {
  console.log('i18n literal audit failed. Found potential hardcoded UI text:')
  for (const f of findings.slice(0, 200)) {
    console.log(`- [${f.kind}] ${f.file}: ${f.value}`)
  }
  if (findings.length > 200) {
    console.log(`... and ${findings.length - 200} more`)
  }
  process.exit(1)
}

console.log('i18n literal audit passed.')
