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
      if (name === 'ai') return { ...ai, Output: { object: () => ({}) }, NoObjectGeneratedError: { isInstance: (e) => e?.kind === 'schema' } }
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


test('cancelled chat response aborts the upstream generation', async () => {
  let upstream
  const api = route('chat', { streamText: (options) => {
    upstream = options.abortSignal
    return { fullStream: (async function* () {
      yield { type: 'text-delta', text: 'first' }
      await new Promise((resolve) => upstream.addEventListener('abort', resolve, { once: true }))
    })() }
  } })
  const response = await api.POST(request())
  const reader = response.body.getReader()
  assert.equal(new TextDecoder().decode((await reader.read()).value), 'first')
  await reader.cancel()
  assert.equal(upstream.aborted, true)
})

test('request disconnect reaches chat model before response headers', async () => {
  const controller = new AbortController()
  const api = route('chat', { streamText: (options) => ({ fullStream: (async function* () {
    await new Promise((resolve) => options.abortSignal.addEventListener('abort', resolve, { once: true }))
    throw new DOMException('Cancelled', 'AbortError')
  })() }) })
  const response = api.POST(new Request('http://localhost', { method: 'POST', signal: controller.signal }))
  await new Promise((r) => setImmediate(r))
  controller.abort()
  assert.equal((await response).status, 499)
})

test('edit cancellation reaches model and skips repair', async () => {
  const controller = new AbortController()
  let calls = 0
  const api = route('edit', { generateText: async (options) => {
    calls++
    assert.equal(options.abortSignal.aborted, false)
    controller.abort()
    assert.equal(options.abortSignal.aborted, true)
    throw { kind: 'schema', text: 'partial' }
  } })
  const response = await api.POST(new Request('http://localhost', { method: 'POST', signal: controller.signal }))
  assert.equal(response.status, 499)
  assert.equal(calls, 1)
})

test('edit repair receives the same cancellation signal', async () => {
  const controller = new AbortController()
  let calls = 0
  const api = route('edit', { generateText: async (options) => {
    calls++
    assert.equal(options.abortSignal.aborted, false)
    if (calls === 1) throw { kind: 'schema', text: 'partial' }
    controller.abort()
    assert.equal(options.abortSignal.aborted, true)
    throw new DOMException('Cancelled', 'AbortError')
  } })
  assert.equal((await api.POST(new Request('http://localhost', { method: 'POST', signal: controller.signal }))).status, 499)
  assert.equal(calls, 2)
})

test('a replacement request rejects late results and old cleanup cannot identify it as current', () => {
  const file = resolve(__dirname, '../src/lib/agentRequest.ts')
  const module = { exports: {} }
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  new Function('exports', 'module', code)(module.exports, module)
  const requests = new module.exports.AgentRequest()
  const old = requests.begin()
  const current = requests.begin()
  assert.equal(old.aborted, true)
  assert.equal(requests.isCurrent(old), false)
  assert.equal(requests.isCurrent(current), true)
  requests.cancel()
  assert.equal(current.aborted, true)
  assert.equal(requests.isCurrent(current), false)
})
