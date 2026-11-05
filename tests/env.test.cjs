/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')
/* eslint-enable @typescript-eslint/no-require-imports */

const transpile = (path) =>
  ts.transpileModule(readFileSync(join(__dirname, path), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText

const envSource = transpile('../src/env.ts')
const aiFeaturesSource = transpile('../src/lib/aiFeatures.ts')

const base = {
  MONGODB_URI: 'mongodb://localhost/test',
  BETTER_AUTH_SECRET: 'secret',
  BETTER_AUTH_URL: 'http://localhost:3026',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret'
}

// Loads src/env.ts against `vars`; returns its exports or throws its error.
function load(vars) {
  const errors = []
  const context = {
    process: { env: vars },
    Response,
    console: { error: (value) => errors.push(value) }
  }
  const aiFeatures = {}
  vm.runInNewContext(aiFeaturesSource, { ...context, exports: aiFeatures })
  const exports = {}
  vm.runInNewContext(envSource, {
    ...context,
    exports,
    require: (id) => (id === './lib/aiFeatures' ? aiFeatures : require(id))
  })
  return { ...exports, errors }
}

test('starts without a Gemini key when AI is unset', () => {
  const { env } = load(base)
  assert.equal(env.GOOGLE_GENERATIVE_AI_API_KEY, undefined)
})

test('starts without a Gemini key when AI is off or not exactly "true"', () => {
  for (const value of ['false', 'yes', 'TRUE', '1']) {
    assert.doesNotThrow(() => load({ ...base, AI_FEATURES_ENABLED: value }))
  }
})

test('fails when AI is on and the Gemini key is missing, empty, or blank', () => {
  for (const key of [undefined, '', '   ']) {
    assert.throws(
      () =>
        load({
          ...base,
          AI_FEATURES_ENABLED: 'true',
          GOOGLE_GENERATIVE_AI_API_KEY: key
        }),
      /GOOGLE_GENERATIVE_AI_API_KEY/
    )
  }
})

test('starts with AI on when the Gemini key is set', () => {
  const { env } = load({
    ...base,
    AI_FEATURES_ENABLED: 'true',
    GOOGLE_GENERATIVE_AI_API_KEY: ' key '
  })
  assert.equal(env.GOOGLE_GENERATIVE_AI_API_KEY, 'key')
})

test('reports the missing key together with other invalid variables', () => {
  const { MONGODB_URI: _omit, ...rest } = base
  assert.throws(
    () => load({ ...rest, AI_FEATURES_ENABLED: 'true' }),
    (err) =>
      /MONGODB_URI/.test(err.message) &&
      /GOOGLE_GENERATIVE_AI_API_KEY/.test(err.message)
  )
})
