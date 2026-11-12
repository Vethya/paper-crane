const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')
const source = fs.readFileSync(
  path.resolve(__dirname, '../src/lib/queries.ts'),
  'utf8'
)
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  }
})
const loaded = { exports: {} }
new Function('require', 'module', 'exports', outputText)(
  require,
  loaded,
  loaded.exports
)
const { createQueryClient, resumesQuery, queryKeys, ApiError } = loaded.exports

test('fresh cache and concurrent requests reuse one API request', async () => {
  const original = global.fetch
  let calls = 0
  global.fetch = async () => {
    calls++
    return { ok: true, json: async () => [{ _id: 'a' }] }
  }
  const client = createQueryClient()
  try {
    const query = resumesQuery('alice')
    await Promise.all([client.fetchQuery(query), client.fetchQuery(query)])
    await client.fetchQuery(query)
    assert.equal(calls, 1)
    await client.invalidateQueries({ queryKey: query.queryKey })
    await client.fetchQuery(query)
    assert.equal(calls, 2)
  } finally {
    client.clear()
    global.fetch = original
  }
})

test('accounts have independent cache entries and auth errors are not retried', async () => {
  const client = createQueryClient()
  try {
    client.setQueryData(queryKeys.resumes('alice'), ['private'])
    assert.equal(client.getQueryData(queryKeys.resumes('bob')), undefined)
    assert.equal(resumesQuery(null).enabled, false)
    const retry = client.getDefaultOptions().queries.retry
    assert.equal(retry(0, new ApiError(401)), false)
    assert.equal(retry(0, new ApiError(404)), false)
    assert.equal(retry(0, new ApiError(500)), true)
    assert.equal(retry(1, new Error('offline')), false)
  } finally {
    client.clear()
  }
})

test('retiring an account aborts requests and clears its cache', async () => {
  const original = global.fetch
  let signal
  global.fetch = (_url, options) => {
    signal = options.signal
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')))
    })
  }
  const client = createQueryClient()
  try {
    const pending = client.fetchQuery(resumesQuery('alice')).catch(() => {})
    await client.cancelQueries()
    client.clear()
    await pending
    assert.equal(signal.aborted, true)
    assert.equal(client.getQueryCache().getAll().length, 0)
  } finally {
    client.clear()
    global.fetch = original
  }
})
