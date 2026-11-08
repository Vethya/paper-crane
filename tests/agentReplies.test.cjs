const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve, dirname } = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')

const body = {
  mode: 'Chat',
  messages: [{ role: 'user', content: 'hello' }],
  resumeData: {},
  sessionId: '64b7f0c2a1b2c3d4e5f60718',
  replyId: 'reply-1'
}

function route(kind, ai, { data = body, owned = true } = {}) {
  const saved = []
  const background = []
  function load(filename) {
    const module = { exports: {} }
    const native = createRequire(filename)
    const requireMock = (name) => {
      if (name === 'ai') return { ...ai, Output: { object: () => ({}) }, NoObjectGeneratedError: { isInstance: (e) => e?.kind === 'schema' } }
      if (name === 'next/server') return { ...native(name), after: (work) => background.push(work) }
      if (name === '@ai-sdk/google') return { google: () => ({}) }
      if (name.endsWith('/auth')) return { auth: { api: { getSession: async () => ({ user: { id: 'test-user' } }) } } }
      if (name.endsWith('/env')) return {}
      if (name.endsWith('/aiFeatures')) return { aiDisabledResponse: () => null }
      if (name.endsWith('/apiValidation')) return { parseBody: async () => ({ data }) }
      if (name.endsWith('/apiSchemas')) return {}
      if (name.endsWith('/agentReplies')) return {
        startReply: async () => owned,
        finishReply: async (target, content, error = false, extra) => saved.push({ ...target, content, error, ...extra })
      }
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
  const api = load(resolve(__dirname, `../src/app/api/agent/${kind}/route.ts`))
  return { api, saved, background }
}
const request = () => new Request('http://localhost', { method: 'POST' })

test('chat keeps generating after the browser disconnects and saves the full reply', async () => {
  let release
  const gate = new Promise((r) => (release = r))
  let signal
  const { api, saved, background } = route('chat', { streamText: (options) => {
    signal = options.abortSignal
    return { fullStream: (async function* () {
      yield { type: 'text-delta', text: 'first' }
      await gate
      yield { type: 'text-delta', text: ' and last' }
    })() }
  } })
  const response = await api.POST(request())
  const reader = response.body.getReader()
  assert.equal(new TextDecoder().decode((await reader.read()).value), 'first')
  await reader.cancel()
  release()
  await Promise.all(background)
  assert.equal(signal, undefined)
  assert.deepEqual(saved, [{ userId: 'test-user', sessionId: body.sessionId, replyId: 'reply-1', content: 'first and last', error: false }])
})

test('chat saves the reply before the browser sees the stream end', async () => {
  const { api, saved } = route('chat', { streamText: () => ({ fullStream: (async function* () {
    yield { type: 'text-delta', text: 'done' }
  })() }) })
  const text = await (await api.POST(request())).text()
  assert.equal(text, 'done')
  assert.equal(saved.length, 1)
})

test('chat saves an error reply when generation fails before any text', async () => {
  const { api, saved } = route('chat', { streamText: () => ({ fullStream: (async function* () {
    yield { type: 'error', error: new Error('model down') }
  })() }) })
  assert.equal((await api.POST(request())).status, 502)
  assert.equal(saved.length, 1)
  assert.equal(saved[0].error, true)
})

test('chat without a session streams but saves nothing', async () => {
  const { api, saved, background } = route('chat', { streamText: () => ({ fullStream: (async function* () {
    yield { type: 'text-delta', text: 'hi' }
  })() }) }, { data: { ...body, sessionId: undefined, replyId: undefined } })
  assert.equal(await (await api.POST(request())).text(), 'hi')
  await Promise.all(background)
  assert.equal(saved.length, 0)
})

test('chat rejects a session the user does not own', async () => {
  const { api } = route('chat', { streamText: () => assert.fail('should not generate') }, { owned: false })
  assert.equal((await api.POST(request())).status, 404)
})

test('edit generation and repair ignore browser disconnects', async () => {
  const controller = new AbortController()
  let calls = 0
  const { api } = route('edit', { generateText: async (options) => {
    calls++
    assert.equal(options.abortSignal, undefined)
    controller.abort()
    if (calls === 1) throw { kind: 'schema', text: 'partial' }
    return { finishReason: 'stop', output: { summary: 'ok', edits: [] } }
  } })
  const response = await api.POST(new Request('http://localhost', { method: 'POST', signal: controller.signal }))
  assert.equal(response.status, 200)
  assert.equal(calls, 2)
})

test('detaching marks old results as stale without stopping anything', () => {
  const file = resolve(__dirname, '../src/lib/agentRequest.ts')
  const module = { exports: {} }
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  new Function('exports', 'module', code)(module.exports, module)
  const requests = new module.exports.AgentRequest()
  const old = requests.begin()
  const current = requests.begin()
  assert.equal(requests.isCurrent(old), false)
  assert.equal(requests.isCurrent(current), true)
  requests.detach()
  assert.equal(requests.isCurrent(current), false)
})

const resume = { basics: { name: 'Jordan' }, work: [{ company: 'Acme' }] }
const editBody = { ...body, resumeData: resume }

test('edit saves the result for later review, with the values it replaces', async () => {
  const output = {
    summary: 'Tailored 2 fields.',
    edits: [
      { type: 'set', fieldPath: 'basics.name', newValue: 'Jordan D.', reason: 'r' },
      { type: 'remove', arrayPath: 'work', index: 0, reason: 'r' }
    ]
  }
  const { api, saved, background } = route('edit', {
    generateText: async () => ({ finishReason: 'stop', output })
  }, { data: editBody })
  const response = await api.POST(request())
  await Promise.all(background)
  assert.deepEqual(await response.json(), output)
  assert.equal(saved.length, 1)
  assert.match(saved[0].content, /^Done! Tailored 2 fields\./)
  assert.equal(saved[0].pendingEdits.status, 'ready')
  assert.equal(saved[0].pendingEdits.replyId, editBody.replyId)
  assert.equal(saved[0].pendingEdits.edits[0].originalValue, 'Jordan')
  assert.deepEqual(saved[0].pendingEdits.edits[1].entry, { company: 'Acme' })
})

test('edit saves an error reply when tailoring fails', async () => {
  const { api, saved, background } = route('edit', {
    generateText: async () => { throw new Error('model down') }
  }, { data: editBody })
  assert.equal((await api.POST(request())).status, 500)
  await Promise.all(background)
  assert.equal(saved[0].error, true)
  assert.equal(saved[0].pendingEdits, undefined)
})

test('conflicts are edits whose field or entry changed after tailoring started', () => {
  const file = resolve(__dirname, '../src/lib/agentTailoring.ts')
  const module = { exports: {} }
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  new Function('exports', 'module', code)(module.exports, module)
  const { toStoredEdits, findConflicts } = module.exports
  const edits = toStoredEdits(resume, [
    { type: 'set', fieldPath: 'basics.name', newValue: 'New', reason: 'r' },
    { type: 'remove', arrayPath: 'work', index: 0, reason: 'r' },
    { type: 'appendSkill', name: 'Cloud', keywords: [], reason: 'r' }
  ])
  assert.deepEqual(findConflicts(resume, edits), [])
  const changed = { basics: { name: 'Edited' }, work: [{ company: 'Other' }] }
  assert.deepEqual(findConflicts(changed, edits).map((e) => e.type), ['set', 'remove'])
})
