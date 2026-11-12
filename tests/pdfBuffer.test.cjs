/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')
/* eslint-enable @typescript-eslint/no-require-imports */

const source = ts.transpileModule(
  readFileSync(join(__dirname, '../src/lib/pdfBuffer.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }
).outputText

function harness() {
  const exports = {}
  const revoked = []
  const tasks = []
  vm.runInNewContext(source, {
    exports,
    queueMicrotask: (task) => tasks.push(task),
    URL: { revokeObjectURL: (url) => revoked.push(url) }
  })
  return {
    ...exports,
    revoked,
    flush: () => {
      while (tasks.length) tasks.shift()()
    }
  }
}

test('preserves the selected page and clamps only when the new PDF is shorter', () => {
  const { clampPdfPage } = harness()
  assert.equal(clampPdfPage(1, 4), 1)
  assert.equal(clampPdfPage(3, 4), 3)
  assert.equal(clampPdfPage(3, 2), 2)
  assert.equal(clampPdfPage(3, 1), 1)
})

test('a displayed PDF survives atom replacement until the rendered candidate is promoted', () => {
  const h = harness()
  h.retainPdfUrl('blob:old') // Atom.
  h.retainPdfUrl('blob:old') // Displayed buffer.
  h.retainPdfUrl('blob:new') // Atom publishes candidate.
  h.releasePdfUrl('blob:old')
  h.retainPdfUrl('blob:new') // Candidate mounts.
  h.flush()
  assert.deepEqual(h.revoked, [])
  h.releasePdfUrl('blob:old') // Swap unmounts old buffer.
  h.releasePdfUrl('blob:new') // Layout effect cleanup/setup keeps new alive.
  h.retainPdfUrl('blob:new')
  h.flush()
  assert.deepEqual(h.revoked, ['blob:old'])
  h.releasePdfUrl('blob:new') // Viewer unmounts.
  assert.equal(h.hasPdfUrlViewers('blob:new'), false)
  h.releasePdfUrl('blob:new') // Atom clears URL on unmount.
  h.flush()
  assert.deepEqual(h.revoked, ['blob:old', 'blob:new'])
})

test('superseded and failed candidates retire while the last good PDF remains alive', () => {
  const h = harness()
  h.retainPdfUrl('blob:good') // Displayed buffer, atom already replaced it.
  h.retainPdfUrl('blob:slow')
  h.retainPdfUrl('blob:slow') // Atom plus candidate.
  h.retainPdfUrl('blob:bad')
  h.releasePdfUrl('blob:slow') // Newer atom URL.
  h.releasePdfUrl('blob:slow') // Superseded candidate unmounts.
  h.retainPdfUrl('blob:bad')
  h.flush()
  assert.deepEqual(h.revoked, ['blob:slow'])
  h.retainPdfUrl('blob:good') // Failed candidate restores the atom's good URL.
  h.releasePdfUrl('blob:bad')
  h.releasePdfUrl('blob:bad')
  h.flush()
  assert.deepEqual(h.revoked, ['blob:slow', 'blob:bad'])
  assert.equal(h.hasPdfUrlViewers('blob:good'), true)
})

test('the atom lease preserves a PDF across viewer unmount and remount until the generator leaves', () => {
  const h = harness()
  h.retainPdfUrl('blob:pdf') // Atom.
  h.retainPdfUrl('blob:pdf') // Displayed buffer.
  h.releasePdfUrl('blob:pdf') // Components panel unmounts the viewer.
  h.flush()
  assert.equal(h.hasPdfUrlViewers('blob:pdf'), false)
  assert.deepEqual(h.revoked, [])

  h.retainPdfUrl('blob:pdf') // Remounted viewer loads the atom URL as a candidate.
  h.flush()
  assert.equal(h.hasPdfUrlViewers('blob:pdf'), true)
  assert.deepEqual(h.revoked, [])
  h.releasePdfUrl('blob:pdf') // Candidate promotes to the displayed buffer.
  h.retainPdfUrl('blob:pdf')
  h.flush()
  assert.equal(h.hasPdfUrlViewers('blob:pdf'), true)
  assert.deepEqual(h.revoked, [])
  h.releasePdfUrl('blob:pdf') // Viewer unmounts when leaving the generator.
  h.flush()
  assert.deepEqual(h.revoked, [])
  h.releasePdfUrl('blob:pdf') // Generator clears the atom URL.
  h.flush()
  assert.deepEqual(h.revoked, ['blob:pdf'])
})

test('leaving the generator while the Components panel is open releases the atom-only lease', () => {
  const h = harness()
  h.retainPdfUrl('blob:pdf') // Atom.
  h.retainPdfUrl('blob:pdf') // Viewer.
  h.releasePdfUrl('blob:pdf') // Components panel opens.
  h.flush()
  assert.equal(h.hasPdfUrlViewers('blob:pdf'), false)
  assert.deepEqual(h.revoked, [])
  h.releasePdfUrl('blob:pdf') // Generator unmount clears the atom.
  h.flush()
  assert.deepEqual(h.revoked, ['blob:pdf'])
})

test('URLs replaced before React commits a candidate are also retired', () => {
  const h = harness()
  for (const url of ['blob:a', 'blob:b']) {
    h.retainPdfUrl(url)
    h.releasePdfUrl(url)
  }
  h.retainPdfUrl('blob:latest')
  h.flush()
  assert.deepEqual(h.revoked, ['blob:a', 'blob:b'])
})

test('StrictMode replay and rapid lease transfers do not revoke a live URL', () => {
  const h = harness()
  h.retainPdfUrl('blob:pdf')
  h.releasePdfUrl('blob:pdf')
  h.retainPdfUrl('blob:pdf')
  h.flush()
  assert.deepEqual(h.revoked, [])
  h.releasePdfUrl('blob:pdf')
  h.retainPdfUrl('blob:pdf')
  h.releasePdfUrl('blob:pdf')
  h.releasePdfUrl('blob:pdf')
  h.flush()
  assert.deepEqual(h.revoked, ['blob:pdf'])
})

test('empty and non-blob URLs are never revoked', () => {
  const h = harness()
  for (const url of ['', '/blank.pdf', 'https://example.com/resume.pdf']) {
    h.retainPdfUrl(url)
    h.releasePdfUrl(url)
  }
  h.flush()
  assert.deepEqual(h.revoked, [])
})
