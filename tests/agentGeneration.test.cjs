const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve, dirname } = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')

function route(kind, ai) {
  function load(filename) {
    const module = { exports: {} }
    const native = createRequire(filename)
    const requireMock = (name) => {
      if (name === 'ai') return { Output: { object: () => ({}) }, NoObjectGeneratedError: { isInstance: (e) => e?.kind === 'schema' }, ...ai }
      if (name === '@ai-sdk/google') return { google: () => ({}) }
      if (name.endsWith('/auth')) return { auth: { api: { getSession: async () => ({ user: { id: 'test-user' } }) } } }
      if (name.endsWith('/env')) return {}
      if (name.endsWith('/aiFeatures')) return { aiDisabledResponse: () => null }
      if (name.endsWith('/apiValidation')) return { parseBody: async () => ({ data: { mode: 'Chat', messages: [{ role: 'user', content: 'hello' }], resumeData: {} } }) }
      if (name.endsWith('/apiSchemas')) return {}
      if (name.startsWith('@/')) return load(resolve(__dirname, '../src', name.slice(2) + '.ts'))
      if (name.startsWith('.')) return load(resolve(dirname(filename), name + '.ts'))
      return native(name)
    }
    const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText
    new Function('exports', 'require', 'module', code)(module.exports, requireMock, module)
    return module.exports
  }
  return load(resolve(__dirname, `../src/app/api/agent/${kind}/route.ts`))
}
const request = () => new Request('http://localhost', { method: 'POST' })

test('chat bounds output and explains a truncated reply', async () => {
  let options
  const api = route('chat', { streamText: (o) => {
    options = o
    return { fullStream: (async function* () {
      yield { type: 'text-delta', text: 'Some advice' }
      yield { type: 'finish', finishReason: 'length' }
    })() }
  } })
  const response = await api.POST(request())
  assert.equal(options.maxOutputTokens, 2048)
  assert.match(await response.text(), /Some advice.*Reply reached its length limit/s)
})

test('edit rejects truncated valid JSON without applying it or repairing it', async () => {
  let calls = 0
  const api = route('edit', { generateText: async (options) => {
    calls++
    assert.equal(options.maxOutputTokens, 8192)
    return { output: { summary: 'partial', edits: [] }, finishReason: 'length' }
  } })
  const response = await api.POST(request())
  assert.equal(response.status, 422)
  assert.match((await response.json()).error, /No changes applied/)
  assert.equal(calls, 1)
})

test('edit never repairs a response truncated before JSON validation', async () => {
  let calls = 0
  const api = route('edit', { generateText: async () => {
    calls++
    throw { kind: 'schema', finishReason: 'length' }
  } })
  assert.equal((await api.POST(request())).status, 422)
  assert.equal(calls, 1)
})

test('edit caps repair output and rejects a truncated repair', async () => {
  let calls = 0
  const api = route('edit', { generateText: async (options) => {
    assert.equal(options.maxOutputTokens, 8192)
    if (++calls === 1) throw { kind: 'schema', finishReason: 'stop', text: '{}', cause: 'invalid' }
    throw { kind: 'schema', finishReason: 'length' }
  } })
  assert.equal((await api.POST(request())).status, 422)
  assert.equal(calls, 2)
})

for (const repair of [false, true]) {
  test(`real SDK token cap returns 422 before accessing ${repair ? 'repair' : 'primary'} output`, async () => {
    const sdk = require('ai')
    const { MockLanguageModelV3 } = require('ai/test')
    let calls = 0
    const api = route('edit', { ...sdk, generateText: (options) => {
      calls++
      const text = repair && calls === 1 ? '{invalid json' : ''
      return sdk.generateText({ ...options, model: new MockLanguageModelV3({ doGenerate: {
        content: text ? [{ type: 'text', text }] : [],
        finishReason: { unified: text ? 'stop' : 'length', raw: text ? 'STOP' : 'MAX_TOKENS' },
        usage: { inputTokens: { total: 10 }, outputTokens: { total: 8192 } }, warnings: []
      } }) })
    } })
    const response = await api.POST(request())
    assert.equal(response.status, 422)
    assert.match((await response.json()).error, /No changes applied/)
    assert.equal(calls, repair ? 2 : 1)
  })
}
