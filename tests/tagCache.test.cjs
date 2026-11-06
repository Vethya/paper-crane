const assert = require('node:assert/strict')
const fs = require('node:fs'),
  path = require('node:path'),
  test = require('node:test'),
  ts = require('typescript')
const { QueryObserver } = require('@tanstack/react-query')
function load(file, modules = {}) {
  const { outputText } = ts.transpileModule(
    fs.readFileSync(path.resolve(__dirname, '../src/lib', file), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022
      }
    }
  )
  const m = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(
    (id) => modules[id] ?? require(id),
    m,
    m.exports
  )
  return m.exports
}
const queries = load('queries.ts'),
  { refreshTags } = load('tagCache.ts', { './queries': queries })
const { createQueryClient, queryKeys } = queries

test('tag creation invalidates tags without invalidating existing resumes', async () => {
  const client = createQueryClient()
  try {
    client.setQueryData(queryKeys.tags('alice'), [])
    client.setQueryData(queryKeys.resumes('alice'), [{ _id: 'r' }])
    client.setQueryData(queryKeys.resume('alice', 'r'), {
      content: { basics: { name: 'Editing' } }
    })
    await refreshTags(client, 'alice', false)
    assert.equal(
      client.getQueryState(queryKeys.tags('alice')).isInvalidated,
      true
    )
    assert.equal(
      client.getQueryState(queryKeys.resumes('alice')).isInvalidated,
      false
    )
    assert.equal(
      client.getQueryState(queryKeys.resume('alice', 'r')).isInvalidated,
      false
    )
  } finally {
    client.clear()
  }
})

test('tag rename/delete refresh active lists and invalidate detail snapshots without resetting them', async () => {
  const client = createQueryClient()
  const stops = []
  let calls = 0
  try {
    for (const key of [queryKeys.tags('alice'), queryKeys.resumes('alice')]) {
      client.setQueryData(key, ['Old tag'])
      stops.push(
        new QueryObserver(client, {
          queryKey: key,
          queryFn: async () => {
            calls++
            return ['Renamed tag']
          }
        }).subscribe(() => {})
      )
    }
    const detail = queryKeys.resume('alice', 'r'),
      other = queryKeys.resumes('bob')
    const snapshot = {
      content: { basics: { name: 'Editing' } },
      tags: ['Old tag']
    }
    client.setQueryData(detail, snapshot)
    client.setQueryData(other, ['Bob private data'])
    await refreshTags(client, 'alice', true)
    assert.equal(calls, 2)
    assert.deepEqual(client.getQueryData(queryKeys.tags('alice')), [
      'Renamed tag'
    ])
    assert.deepEqual(client.getQueryData(queryKeys.resumes('alice')), [
      'Renamed tag'
    ])
    assert.equal(client.getQueryState(detail).isInvalidated, true)
    assert.deepEqual(client.getQueryData(detail), snapshot)
    assert.equal(client.getQueryState(other).isInvalidated, false)
  } finally {
    stops.forEach((stop) => stop())
    client.clear()
  }
})
