/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')
/* eslint-enable @typescript-eslint/no-require-imports */

const source = ts.transpileModule(
  readFileSync(join(__dirname, '../src/lib/aiFeatures.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }
).outputText

function load(vars = {}) {
  const exports = {}
  vm.runInNewContext(source, { exports, Response, process: { env: vars } })
  return exports
}

test('isAiEnabled is on only for AI_FEATURES_ENABLED=true', () => {
  const { isAiEnabled } = load()
  assert.equal(isAiEnabled({}), false)
  assert.equal(isAiEnabled({ AI_FEATURES_ENABLED: 'false' }), false)
  assert.equal(isAiEnabled({ AI_FEATURES_ENABLED: '1' }), false)
  assert.equal(isAiEnabled({ AI_FEATURES_ENABLED: 'true' }), true)
})

test('route guard returns 404 with a message when AI is off', async () => {
  const { aiDisabledResponse } = load({})
  const response = aiDisabledResponse()
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), {
    error: 'AI features are disabled on this server'
  })
})

test('route guard lets requests through when AI is on', () => {
  const { aiDisabledResponse } = load({ AI_FEATURES_ENABLED: 'true' })
  assert.equal(aiDisabledResponse(), null)
})
