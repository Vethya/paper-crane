/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { existsSync, readdirSync, readFileSync, statSync } = require('node:fs')
const { createRequire } = require('node:module')
const { dirname, join, relative, resolve } = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')
/* eslint-enable @typescript-eslint/no-require-imports */

const libDir = join(__dirname, '../src/lib')
const apiDir = join(__dirname, '../src/app/api')
// Better Auth reads its own requests.
const SKIPPED = ['auth']

function load(filename) {
  const module = { exports: {} }
  const javascript = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    }
  }).outputText
  const nativeRequire = createRequire(filename)
  const localRequire = (specifier) => {
    const file = `${resolve(dirname(filename), specifier)}.ts`
    return specifier.startsWith('.') && existsSync(file)
      ? load(file)
      : nativeRequire(specifier)
  }
  new Function('exports', 'require', 'module', javascript)(
    module.exports,
    localRequire,
    module
  )
  return module.exports
}

const { invalidId, parseBody } = load(join(libDir, 'apiValidation.ts'))
const schemas = load(join(libDir, 'apiSchemas.ts'))

function jsonRequest(body) {
  return new Request('http://localhost/api', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body)
  })
}

async function parse(schema, body) {
  const result = await parseBody(jsonRequest(body), schema)
  if (result.error) {
    return {
      status: result.error.status,
      message: (await result.error.json()).error
    }
  }
  return result
}

test('invalidId accepts ObjectIds and rejects anything else', async () => {
  assert.equal(invalidId('64b7f0c2a1b2c3d4e5f60718'), null)
  const response = invalidId('not-an-id')
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Invalid ID format' })
})

test('parseBody rejects malformed JSON with 400', async () => {
  const result = await parse(schemas.CreateTagSchema, '{bad json')
  assert.deepEqual(result, { status: 400, message: 'Invalid JSON body' })
})

test('parseBody rejects a non-object body', async () => {
  const result = await parse(schemas.ComponentBodySchema, 'null')
  assert.equal(result.status, 400)
})

test('parseBody names the failing field', async () => {
  const result = await parse(schemas.CreateTagSchema, { name: '  ' })
  assert.deepEqual(result, { status: 400, message: 'name: must not be empty' })
})

test('tag create trims the name and defaults the color', async () => {
  const { data } = await parse(schemas.CreateTagSchema, { name: ' Work ' })
  assert.deepEqual(data, { name: 'Work', color: 'gray' })
})

test('tag schemas reject unknown colors and non-string names', async () => {
  for (const body of [{ name: 'x', color: 'neon' }, { name: 42 }]) {
    const result = await parse(schemas.CreateTagSchema, body)
    assert.equal(result.status, 400, JSON.stringify(body))
  }
  const update = await parse(schemas.UpdateTagSchema, { color: 'neon' })
  assert.equal(update.status, 400)
})

test('resume create requires a string title', async () => {
  for (const body of [{}, { title: 7 }, { title: ' ' }]) {
    const result = await parse(schemas.CreateResumeSchema, body)
    assert.equal(result.status, 400, JSON.stringify(body))
  }
})

test('resume content accepts form data and imported JSON Resume files', async () => {
  const content = {
    basics: { name: 'Ada', location: { address: 'London', city: 'London' } },
    work: [{ company: 'Acme', highlights: ['Shipped'], summary: 'dropped' }],
    education: [{ institution: 'Uni', score: 3.9, endDate: null }],
    skills: [{ name: 'TS', keywords: ['types'] }],
    headings: { work: 'Experience' },
    sections: ['profile', 'work'],
    selectedTemplate: 2,
    meta: { version: 1 }
  }
  const { data } = await parse(schemas.CreateResumeSchema, {
    title: 'CV',
    content
  })
  assert.equal(data.content.basics.location.city, undefined)
  assert.equal(data.content.work[0].summary, undefined)
  assert.equal(data.content.meta, undefined)
  assert.equal(data.content.education[0].score, 3.9)
})

test('resume schemas reject wrongly shaped fields', async () => {
  const bodies = [
    { title: 'CV', content: { work: 'not a list' } },
    { title: 'CV', content: { sections: ['hobbies'] } },
    { title: 'CV', content: { basics: { location: 'London' } } }
  ]
  for (const body of bodies) {
    const result = await parse(schemas.CreateResumeSchema, body)
    assert.equal(result.status, 400, JSON.stringify(body))
  }
  for (const body of [{ tags: 'work' }, { tags: [1] }, { title: '' }]) {
    const result = await parse(schemas.UpdateResumeSchema, body)
    assert.equal(result.status, 400, JSON.stringify(body))
  }
})

test('resume update keeps the content writer for stale-save checks', async () => {
  const writer = { id: 'page-1', revision: 3 }
  const { data } = await parse(schemas.UpdateResumeSchema, {
    content: { sections: ['work'] },
    writer
  })
  assert.deepEqual(data.writer, writer)
})

const RESUME_ID = '64b7f0c2a1b2c3d4e5f60718'
const message = { id: 'm1', role: 'user', content: 'Hi' }

test('agent session save checks IDs, mode, and messages', async () => {
  const valid = {
    resumeId: RESUME_ID,
    sessionId: null,
    mode: 'Chat',
    messages: [{ ...message, error: true }]
  }
  // Error replies stay marked, so a reopened chat still offers Retry.
  const { data } = await parse(schemas.SaveAgentSessionSchema, valid)
  assert.deepEqual(data.messages, [{ ...message, error: true }])

  const bad = [
    { ...valid, resumeId: 'abc' },
    { ...valid, sessionId: 'abc' },
    { ...valid, mode: 'Other' },
    { ...valid, messages: 'hi' },
    { ...valid, messages: [{ ...message, role: 'system' }] },
    { ...valid, messages: [{ ...message, content: '' }] }
  ]
  for (const body of bad) {
    const result = await parse(schemas.SaveAgentSessionSchema, body)
    assert.equal(result.status, 400, JSON.stringify(body))
  }
  const badId = await parse(schemas.SaveAgentSessionSchema, bad[0])
  assert.equal(badId.message, 'resumeId: Invalid ID format')
})

test('agent chat and edit require a message list', async () => {
  const messages = [{ role: 'user', content: 'Hi' }]
  const chat = await parse(schemas.AgentChatSchema, { messages, mode: 'Chat', resumeData: {} })
  assert.deepEqual(chat.data, { messages, mode: 'Chat', resumeData: {} })
  const edit = await parse(schemas.AgentEditSchema, {
    messages,
    resumeData: { basics: { name: 'Ada' } }
  })
  assert.deepEqual(edit.data.resumeData, { basics: { name: 'Ada' } })

  for (const [schema, body] of [
    [schemas.AgentChatSchema, { mode: 'Chat' }],
    [schemas.AgentChatSchema, { messages, mode: 'Other' }],
    [schemas.AgentEditSchema, { messages, resumeData: 'x' }]
  ]) {
    const result = await parse(schema, body)
    assert.equal(result.status, 400, JSON.stringify(body))
  }
})

test('source ZIP body needs a template number', async () => {
  const body = { sections: ['work'], headings: {}, selectedTemplate: 3 }
  const { data } = await parse(schemas.SourceZipSchema, body)
  assert.equal(data.selectedTemplate, 3)
  const missing = await parse(schemas.SourceZipSchema, { sections: [] })
  assert.equal(missing.status, 400)
})

function routeFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      return dir === apiDir && SKIPPED.includes(name) ? [] : routeFiles(path)
    }
    return name === 'route.ts' ? [path] : []
  })
}

const routes = routeFiles(apiDir)

test('finds the data routes', () => {
  assert.ok(routes.length >= 6, `found ${routes.length} routes`)
})

for (const path of routes) {
  const name = relative(apiDir, path)
  const source = readFileSync(path, 'utf8')

  test(`${name}: reads bodies through parseBody`, () => {
    assert.doesNotMatch(source, /request\.json\(\)/)
  })

  if (name.includes('[id]')) {
    test(`${name}: every handler checks the ID`, () => {
      const handlers = source.match(/export async function \w+/g) ?? []
      const checks = source.match(/invalidId\(id\)/g) ?? []
      assert.ok(handlers.length > 0, 'no handlers found')
      assert.equal(checks.length, handlers.length)
    })
  }
}

const limits = load(join(libDir, 'agentLimits.ts'))
const { AGENT_LIMITS, characterCount, prepareAgentMessages, agentWarnings } = limits
const user = (content) => ({ role: 'user', content })
const assistant = (content) => ({ role: 'assistant', content })
const resumeAt = (size) => ({ text: 'a'.repeat(size - 11) })

test('AI limits count emoji as code points and preserve multilingual text', async () => {
  assert.equal(characterCount('a😀ក'), 3)
  const content = '😀'.repeat(32_000)
  const valid = { resumeData: {}, messages: [user(content)], mode: 'Chat' }
  assert.ok((await parse(schemas.AgentChatSchema, valid)).data)
  assert.equal((await parse(schemas.AgentChatSchema, {
    ...valid, messages: [user(content + 'ក')]
  })).status, 400)
})

test('both AI routes accept exact boundaries and reject oversized content', async () => {
  for (const schema of [schemas.AgentChatSchema, schemas.AgentEditSchema]) {
    const valid = { resumeData: resumeAt(64_000), messages: [user('a'.repeat(32_000)), assistant('b'.repeat(32_000))], mode: 'Chat' }
    assert.ok((await parse(schema, valid)).data)
    for (const invalid of [
      { ...valid, resumeData: resumeAt(64_001) },
      { ...valid, messages: [user('x'.repeat(32_001))] },
      { ...valid, messages: [...valid.messages, user('x')] },
      { ...valid, messages: [] }
    ]) assert.equal((await parse(schema, invalid)).status, 400)
  }
})

test('transport cap counts streamed bytes without trusting Content-Length', async () => {
  const body = JSON.stringify({ value: '😀' })
  const bytes = new TextEncoder().encode(body)
  const schema = require('zod').z.object({ value: require('zod').z.string() })
  const request = () => new Request('http://localhost', {
    method: 'POST', duplex: 'half', headers: { 'Content-Length': '1' },
    body: new ReadableStream({ start(c) {
      for (const byte of bytes) c.enqueue(new Uint8Array([byte]))
      c.close()
    } })
  })
  assert.equal((await parseBody(request(), schema, bytes.length)).data.value, '😀')
  assert.equal((await parseBody(request(), schema, bytes.length - 1)).error.status, 413)
})

test('history trimming keeps complete recent exchanges and never changes originals', () => {
  const history = [user('old'), assistant('reply'), user('b'.repeat(32_000)), assistant('c'.repeat(32_000)), user('latest')]
  const copy = structuredClone(history)
  const result = prepareAgentMessages(resumeAt(64_000), history)
  assert.deepEqual(result.messages, [user('latest')])
  assert.equal(result.trimmed, true)
  assert.deepEqual(history, copy)
  assert.deepEqual(prepareAgentMessages({}, [assistant('orphan'), user('now'), { ...assistant('error'), error: true }]).messages, [user('now')])
})

test('warnings stay hidden below 80%, allow exact limits, and block overflow', () => {
  assert.deepEqual(agentWarnings({}, [], 'normal'), { warnings: [], blocked: false })
  assert.equal(agentWarnings({}, [], 'x'.repeat(25_599)).warnings.length, 0)
  assert.match(agentWarnings({}, [], 'x'.repeat(25_600)).warnings[0], /25,600 \/ 32,000 characters/)
  assert.equal(agentWarnings({}, [], '😀'.repeat(32_000)).blocked, false)
  assert.equal(agentWarnings({}, [], '😀'.repeat(32_001)).blocked, true)
  assert.equal(agentWarnings(resumeAt(64_000), [], '').blocked, false)
  assert.equal(agentWarnings(resumeAt(64_001), [], '').blocked, true)
  assert.match(agentWarnings(resumeAt(64_000), [user('x'.repeat(32_000)), assistant('y'.repeat(10_000))], '').warnings.at(-1), /getting long/)
})

test('long history trimming visits characters at most linearly', () => {
  const history = Array.from({ length: 200 }, (_, i) =>
    i % 2 ? assistant('b'.repeat(4000)) : user('a'.repeat(4000)))
  const iterate = String.prototype[Symbol.iterator]
  let visited = 0
  String.prototype[Symbol.iterator] = function* () {
    for (const ch of iterate.call(this)) { visited++; yield ch }
  }
  let result
  try { result = prepareAgentMessages({}, history) }
  finally { String.prototype[Symbol.iterator] = iterate }
  assert.ok(visited < 1_600_000, `rescanned ${visited} characters`)
  assert.equal(result.context, 800_002)
  assert.equal(result.trimmed, true)
  assert.deepEqual(result.messages, history.slice(-30))
})

test('resume warnings explain context and where to shorten content', () => {
  assert.equal(agentWarnings(resumeAt(52_022), [], '').warnings[0],
    "Your current resume is included in this chat for context. It's close to the size limit: 52,022 / 64,000 characters. 11,978 characters remaining.")
  assert.match(agentWarnings(resumeAt(64_022), [], '').warnings[0], /Return to the resume editor and shorten some descriptions/)
  assert.match(agentWarnings({}, [], 'x'.repeat(32_001)).warnings[0], /Shorten your question or pasted job description/)
})
