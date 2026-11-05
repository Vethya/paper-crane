/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')
/* eslint-enable @typescript-eslint/no-require-imports */

const source = ts.transpileModule(
  readFileSync(join(__dirname, '../src/env.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }
).outputText

const base = {
  MONGODB_URI: 'mongodb://localhost/test',
  BETTER_AUTH_SECRET: 'secret',
  BETTER_AUTH_URL: 'http://localhost:3026',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret'
}

// Loads src/env.ts against `vars`; returns its exports or throws its error.
function load(vars) {
  const exports = {}
  vm.runInNewContext(source, {
    exports,
    require,
    process: { env: vars },
    console: { error() {} }
  })
  return exports
}

test('starts without a Gemini key when AI is unset', () => {
  const { env } = load(base)
  assert.equal(env.aiFeaturesEnabled, false)
  assert.equal(env.GOOGLE_GENERATIVE_AI_API_KEY, undefined)
})

test('treats AI_FEATURES_ENABLED=false as off without a key', () => {
  const { env } = load({ ...base, AI_FEATURES_ENABLED: 'false' })
  assert.equal(env.aiFeaturesEnabled, false)
})

test('treats values other than "true" as off', () => {
  const { env } = load({ ...base, AI_FEATURES_ENABLED: 'yes' })
  assert.equal(env.aiFeaturesEnabled, false)
})

test('fails when AI is on and the Gemini key is missing', () => {
  assert.throws(
    () => load({ ...base, AI_FEATURES_ENABLED: 'true' }),
    /GOOGLE_GENERATIVE_AI_API_KEY/
  )
  assert.throws(
    () =>
      load({
        ...base,
        AI_FEATURES_ENABLED: 'true',
        GOOGLE_GENERATIVE_AI_API_KEY: ''
      }),
    /GOOGLE_GENERATIVE_AI_API_KEY/
  )
})

test('starts with AI on when the Gemini key is set', () => {
  const { env } = load({
    ...base,
    AI_FEATURES_ENABLED: 'true',
    GOOGLE_GENERATIVE_AI_API_KEY: 'key'
  })
  assert.equal(env.aiFeaturesEnabled, true)
})

test('still requires the non-AI variables', () => {
  const { MONGODB_URI: _omit, ...rest } = base
  assert.throws(() => load(rest), /MONGODB_URI/)
})
