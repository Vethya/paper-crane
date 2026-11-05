const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const source = fs.readFileSync(
  path.resolve(__dirname, '../src/lib/draftRecovery.ts'),
  'utf8'
)
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  }
})
const draftModule = { exports: {} }
new Function('module', 'exports', outputText)(draftModule, draftModule.exports)
const { stableStringify, readDraft, writeDraft, clearDraft, findRecovery } =
  draftModule.exports

function memoryStorage() {
  const items = new Map()
  return {
    getItem: (k) => (items.has(k) ? items.get(k) : null),
    setItem: (k, v) => items.set(k, String(v)),
    removeItem: (k) => items.delete(k),
    items
  }
}

const throwingStorage = {
  getItem() {
    throw new Error('blocked')
  },
  setItem() {
    throw new Error('blocked')
  },
  removeItem() {
    throw new Error('blocked')
  }
}

test('stableStringify ignores key order and undefined values', () => {
  assert.equal(
    stableStringify({ b: 1, a: { d: undefined, c: [2, { y: 1, x: 0 }] } }),
    stableStringify({ a: { c: [2, { x: 0, y: 1 }] }, b: 1 })
  )
})

test('a written draft reads back for the same resume only', () => {
  const storage = memoryStorage()
  writeDraft(storage, 'a', '{"x":1}', 1000)
  assert.deepEqual(readDraft(storage, 'a'), {
    content: '{"x":1}',
    savedAt: 1000
  })
  assert.equal(readDraft(storage, 'b'), null)
})

test('a malformed draft reads as no draft', () => {
  const storage = memoryStorage()
  storage.setItem('autosave:a', 'not json')
  assert.equal(readDraft(storage, 'a'), null)
  storage.setItem('autosave:a', '{"content":1}')
  assert.equal(readDraft(storage, 'a'), null)
})

test('blocked storage never throws', () => {
  assert.equal(readDraft(throwingStorage, 'a'), null)
  assert.doesNotThrow(() => writeDraft(throwingStorage, 'a', '{}'))
  assert.doesNotThrow(() => clearDraft(throwingStorage, 'a'))
})

test('clearDraft with content keeps a newer draft', () => {
  const storage = memoryStorage()
  writeDraft(storage, 'a', '{"v":2}')
  clearDraft(storage, 'a', '{"v":1}')
  assert.notEqual(readDraft(storage, 'a'), null)
  clearDraft(storage, 'a', '{"v":2}')
  assert.equal(readDraft(storage, 'a'), null)
})

test('no recovery without a draft or when it matches the server', () => {
  assert.equal(findRecovery(null, { a: 1 }), null)
  const draft = { content: '{"b":2,"a":1}', savedAt: 1000 }
  assert.equal(findRecovery(draft, { a: 1, b: 2 }), null)
})

test('a different draft is offered, with the server time compared', () => {
  const draft = {
    content: '{"a":2}',
    savedAt: Date.parse('2026-11-05T10:00:00Z')
  }
  assert.deepEqual(findRecovery(draft, { a: 1 }, '2026-11-05T09:00:00Z'), {
    content: '{"a":2}',
    savedAt: draft.savedAt,
    serverIsNewer: false
  })
  assert.equal(
    findRecovery(draft, { a: 1 }, '2026-11-05T11:00:00Z').serverIsNewer,
    true
  )
  assert.equal(findRecovery(draft, { a: 1 }).serverIsNewer, false)
})
