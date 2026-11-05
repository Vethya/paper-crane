const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const source = fs.readFileSync(
  path.resolve(__dirname, '../src/lib/contentWriter.ts'),
  'utf8'
)
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  }
})
const writerModule = { exports: {} }
new Function('module', 'exports', outputText)(
  writerModule,
  writerModule.exports
)
const { parseWriter, newerWriteFilter } = writerModule.exports

test('parseWriter accepts a page id and a positive integer revision', () => {
  assert.deepEqual(parseWriter({ id: 'abc', revision: 3 }), {
    id: 'abc',
    revision: 3
  })
})

test('parseWriter rejects malformed writers', () => {
  for (const value of [
    undefined,
    null,
    'abc',
    { id: '', revision: 1 },
    { id: 'x'.repeat(65), revision: 1 },
    { id: 'abc', revision: 0 },
    { id: 'abc', revision: 1.5 },
    { id: 'abc', revision: '2' },
    { id: 7, revision: 2 }
  ])
    assert.equal(parseWriter(value), null)
})

test('newerWriteFilter allows other pages or a newer revision only', () => {
  assert.deepEqual(newerWriteFilter({ id: 'abc', revision: 4 }), {
    $or: [
      { 'contentWriter.id': { $ne: 'abc' } },
      { 'contentWriter.revision': { $lt: 4 } }
    ]
  })
})
