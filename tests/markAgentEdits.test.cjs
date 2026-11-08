const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const ts = require('typescript')

const { outputText } = ts.transpileModule(
  readFileSync(resolve(__dirname, '../src/lib/markAgentEdits.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }
)
const mod = { exports: {} }
new Function('module', 'exports', outputText)(mod, mod.exports)
const { reviewStatus, markAgentEdits } = mod.exports

const target = { resumeId: 'r1', sessionId: 's1', replyId: 'reply-1' }

function sender(responses) {
  const calls = []
  const send = async (url, init) => {
    calls.push({ url, init })
    const next = responses.shift()
    if (next instanceof Error) throw next
    return { ok: next, status: next ? 200 : 500 }
  }
  return { send, calls }
}

test('a result with an approved edit is applied', () => {
  assert.equal(
    reviewStatus([{ status: 'rejected' }, { status: 'approved' }]),
    'applied'
  )
})

test('a result with no edits, or none approved, is dismissed', () => {
  assert.equal(reviewStatus([]), 'dismissed')
  assert.equal(reviewStatus([{ status: 'rejected' }]), 'dismissed')
})

test('marking sends the reply and its status once when the server accepts', async () => {
  const { send, calls } = sender([true])
  assert.equal(await markAgentEdits(target, 'applied', send), true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/api/agent/sessions/s1')
  assert.equal(calls[0].init.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    replyId: 'reply-1',
    pendingEdits: 'applied'
  })
})

test('marking retries once after a rejected response or a network error', async (t) => {
  t.mock.method(console, 'error', () => {})
  const rejected = sender([false, true])
  assert.equal(await markAgentEdits(target, 'dismissed', rejected.send), true)
  assert.equal(rejected.calls.length, 2)

  const offline = sender([new Error('offline'), true])
  assert.equal(await markAgentEdits(target, 'dismissed', offline.send), true)
  assert.equal(offline.calls.length, 2)
})

test('marking gives up after two failed attempts', async (t) => {
  t.mock.method(console, 'error', () => {})
  const { send, calls } = sender([false, false, true])
  assert.equal(await markAgentEdits(target, 'applied', send), false)
  assert.equal(calls.length, 2)
})
