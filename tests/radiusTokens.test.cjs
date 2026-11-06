const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const srcDir = path.resolve(__dirname, '../src')

// Generic radius utilities that bypass the app-* tokens in tailwind.config.js.
// A class ends at whitespace, a quote or a backtick, so `rounded-app-button`
// and `rounded-full` do not match.
const genericRadius = /(?:^|[\s"'`:])(rounded(?:-(?:sm|md|lg|xl|2xl|3xl))?)(?=[\s"'`]|$)/gm

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(fullPath)
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [fullPath] : []
  })
}

test('components use the app radius tokens instead of generic rounded classes', () => {
  const offenders = sourceFiles(srcDir).flatMap((file) => {
    const lines = fs.readFileSync(file, 'utf8').split('\n')
    return lines.flatMap((line, index) =>
      [...line.matchAll(genericRadius)].map(
        (match) => `${path.relative(srcDir, file)}:${index + 1} ${match[1]}`
      )
    )
  })

  assert.deepEqual(offenders, [])
})
