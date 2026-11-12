const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')
function load(file, overrides = {}) {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/lib', file),
    'utf8'
  )
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  })
  const result = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(
    (id) => overrides[id] ?? require(id),
    result,
    result.exports
  )
  return result.exports
}
const queries = load('queries.ts')
const { loadResume, saveResume, trackResumeWork } = load('resumeCache.ts', {
  './queries': queries
})
const { createQueryClient, queryKeys } = queries
const record = (name, time = 1) => ({
  _id: 'r',
  title: 'Resume',
  tags: [],
  updatedAt: `2026-11-06T00:00:0${time}.000Z`,
  content: { basics: { name } }
})
const response = (data) => ({ ok: true, json: async () => data })
async function scenario(run) {
  const client = createQueryClient()
  const original = global.fetch
  try {
    await run(client)
  } finally {
    client.clear()
    global.fetch = original
  }
}

test('fresh detail is reused; recovery explicitly checks the server', () =>
  scenario(async (client) => {
    client.setQueryData(queryKeys.resume('alice', 'r'), record('Cached'))
    let calls = 0
    global.fetch = async () => {
      calls++
      return response(record('Server'))
    }
    assert.equal(
      (await loadResume(client, 'alice', 'r')).content.basics.name,
      'Cached'
    )
    assert.equal(calls, 0)
    assert.equal(
      (await loadResume(client, 'alice', 'r', true)).content.basics.name,
      'Server'
    )
    assert.equal(calls, 1)
  }))

test('reopening waits for an unmount save and reconciles its server copy', () =>
  scenario(async (client) => {
    let finish
    const patch = new Promise((resolve) => {
      finish = resolve
    })
    let reads = 0
    global.fetch = async (_url, options = {}) => {
      if (options.method === 'PATCH') return patch
      reads++
      return response(record('Saved', 2))
    }
    client.setQueryData(queryKeys.resume('alice', 'r'), record('Old'))
    const saving = saveResume(
      client,
      'alice',
      'r',
      JSON.stringify({ content: record('Saved').content })
    )
    const opening = loadResume(client, 'alice', 'r')
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(reads, 0)
    finish(response({ ...record('Saved', 2), content: undefined }))
    assert.equal(await saving, true)
    assert.equal((await opening).content.basics.name, 'Saved')
    assert.equal(reads, 1)
  }))

test('a late older acknowledgement cannot replace newer cached content', () =>
  scenario(async (client) => {
    const resolvers = []
    global.fetch = () => new Promise((resolve) => resolvers.push(resolve))
    client.setQueryData(queryKeys.resume('alice', 'r'), record('Initial'))
    const older = saveResume(
      client,
      'alice',
      'r',
      JSON.stringify({ content: record('Older').content })
    )
    const newer = saveResume(
      client,
      'alice',
      'r',
      JSON.stringify({ content: record('Newer').content })
    )
    await new Promise((resolve) => setImmediate(resolve))
    resolvers[1](response({ ...record('Newer', 3), content: undefined }))
    await newer
    resolvers[0](response({ ...record('Older', 2), content: undefined }))
    await older
    assert.equal(
      client.getQueryData(queryKeys.resume('alice', 'r')).content.basics.name,
      'Newer'
    )
    assert.equal(
      client.getQueryState(queryKeys.resume('alice', 'r')).isInvalidated,
      true
    )
  }))

test('stale acknowledgements do not confirm content or change the cache', () =>
  scenario(async (client) => {
    const key = queryKeys.resume('alice', 'r')
    client.setQueryData(key, record('Newer', 3))
    global.fetch = async () => response({ stale: true })
    assert.equal(
      await saveResume(
        client,
        'alice',
        'r',
        '{"content":{"basics":{"name":"Old"}}}'
      ),
      false
    )
    assert.equal(client.getQueryData(key).content.basics.name, 'Newer')
  }))

test('writer revision orders content even when server timestamps are equal', () =>
  scenario(async (client) => {
    const key = queryKeys.resume('alice', 'r')
    client.setQueryData(key, {
      ...record('Newer'),
      contentWriter: { id: 'page', revision: 2 }
    })
    global.fetch = async () =>
      response({
        ...record('Older'),
        content: undefined,
        contentWriter: { id: 'page', revision: 1 }
      })
    await saveResume(
      client,
      'alice',
      'r',
      JSON.stringify({ content: record('Older').content })
    )
    assert.equal(client.getQueryData(key).content.basics.name, 'Newer')
  }))

test('metadata-only saves never manufacture a detail record without content', () =>
  scenario(async (client) => {
    global.fetch = async () =>
      response({ ...record('Ignored'), content: undefined })
    await saveResume(client, 'alice', 'r', '{"title":"Renamed"}')
    assert.equal(client.getQueryData(queryKeys.resume('alice', 'r')), undefined)
  }))

test('failed writes remain failures and keep the previous cached content', () =>
  scenario(async (client) => {
    const key = queryKeys.resume('alice', 'r')
    client.setQueryData(key, record('Original'))
    global.fetch = async () => ({ ok: false, status: 500 })
    await assert.rejects(
      saveResume(client, 'alice', 'r', '{"content":{}}'),
      /500/
    )
    assert.equal(client.getQueryData(key).content.basics.name, 'Original')
  }))

test('saving cancels a running detail GET before it can commit old data', () =>
  scenario(async (client) => {
    let signal
    global.fetch = async (_url, options = {}) => {
      if (options.method === 'PATCH')
        return response({ ...record('New', 2), content: undefined })
      signal = options.signal
      return new Promise((_resolve, reject) =>
        signal.addEventListener('abort', () => reject(new Error('cancelled')))
      )
    }
    const loading = loadResume(client, 'alice', 'r').catch(() => {})
    await saveResume(
      client,
      'alice',
      'r',
      JSON.stringify({ content: record('New').content })
    )
    await loading
    assert.equal(signal.aborted, true)
    assert.equal(
      client.getQueryData(queryKeys.resume('alice', 'r')).content.basics.name,
      'New'
    )
  }))

test('reopening waits for the full saver flush, including a queued newer edit', () =>
  scenario(async (client) => {
    const { createAutoSaver } = load('autoSaver.ts')
    const resolvers = []
    let reads = 0
    global.fetch = (_url, options = {}) => {
      if (options.method === 'PATCH')
        return new Promise((resolve) => resolvers.push(resolve))
      reads++
      return Promise.resolve(response(record('Latest', 3)))
    }
    const saver = createAutoSaver({
      baseline: JSON.stringify(record('Initial').content),
      delay: 60_000,
      statusResetDelay: 0,
      onStatus() {},
      save: async (snapshot) => {
        await saveResume(
          client,
          'alice',
          'r',
          JSON.stringify({ content: JSON.parse(snapshot) })
        )
      }
    })
    saver.update(JSON.stringify(record('First').content))
    const first = saver.flush()
    saver.update(JSON.stringify(record('Latest').content))
    const fullFlush = trackResumeWork(client, 'r', saver.flush())
    const opening = loadResume(client, 'alice', 'r')
    await new Promise((resolve) => setImmediate(resolve))
    resolvers[0](response({ ...record('First', 2), content: undefined }))
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(resolvers.length, 2)
    assert.equal(reads, 0)
    resolvers[1](response({ ...record('Latest', 3), content: undefined }))
    await Promise.all([first, fullFlush])
    assert.equal((await opening).content.basics.name, 'Latest')
  }))
