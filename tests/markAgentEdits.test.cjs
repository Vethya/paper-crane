const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const ts = require('typescript')

const { outputText } = ts.transpileModule(
  readFileSync(resolve(__dirname, '../src/lib/markAgentEdits.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }
)
const mod = { exports: {} }
new Function('module', 'exports', outputText)(mod, mod.exports)
const { reviewStatus } = mod.exports

test('a result with an approved edit is applied', () => {
  assert.equal(
    reviewStatus([{ status: 'rejected' }, { status: 'approved' }]),
    'applied'
  )
})

test('a result with no edits, or none approved, is dismissed', () => {
  assert.equal(reviewStatus([]), 'dismissed')
  assert.equal(reviewStatus([{ status: 'rejected' }]), 'dismissed')
})
