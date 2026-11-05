const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const source = fs.readFileSync(
  path.resolve(__dirname, '../src/lib/autoSaver.ts'),
  'utf8'
)
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  }
})
const autoSaverModule = { exports: {} }
new Function('module', 'exports', outputText)(
  autoSaverModule,
  autoSaverModule.exports
)
const { createAutoSaver } = autoSaverModule.exports

// Lets awaited promises settle between timer ticks.
const settle = () => new Promise((resolve) => setImmediate(resolve))

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup(t, save) {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const statuses = []
  const saved = []
  const saver = createAutoSaver({
    save:
      save ??
      ((snapshot) => {
        saved.push(snapshot)
        return Promise.resolve()
      }),
    onStatus: (status) => statuses.push(status)
  })
  saver.update('loaded')
  return { saver, statuses, saved }
}

test('the loaded snapshot is the baseline and is not saved', async (t) => {
  const { saver, saved } = setup(t)
  t.mock.timers.tick(5000)
  await settle()
  assert.deepEqual(saved, [])
  assert.equal(saver.hasUnsavedChanges(), false)
})

test('saves the latest edit once after the debounce', async (t) => {
  const { saver, saved, statuses } = setup(t)
  saver.update('a')
  t.mock.timers.tick(1500)
  saver.update('ab')
  t.mock.timers.tick(1999)
  assert.deepEqual(saved, [])
  assert.equal(statuses.at(-1), 'pending')
  t.mock.timers.tick(1)
  await settle()
  assert.deepEqual(saved, ['ab'])
  assert.equal(statuses.at(-1), 'saved')
})

test('flush saves an edit made just before leaving', async (t) => {
  const { saver, saved } = setup(t)
  saver.update('edited')
  t.mock.timers.tick(500)
  await saver.flush()
  assert.deepEqual(saved, ['edited'])
  t.mock.timers.tick(5000)
  await settle()
  assert.deepEqual(saved, ['edited'])
})

test('an edit during a save waits for it, so saves never overlap', async (t) => {
  const calls = []
  const { saver } = setup(t, (snapshot) => {
    const call = deferred()
    calls.push({ snapshot, ...call })
    return call.promise
  })
  saver.update('first')
  t.mock.timers.tick(2000)
  saver.update('second')
  t.mock.timers.tick(2000)
  await settle()
  assert.deepEqual(
    calls.map((call) => call.snapshot),
    ['first']
  )
  calls[0].resolve()
  await settle()
  assert.deepEqual(
    calls.map((call) => call.snapshot),
    ['first', 'second']
  )
})

test('flush during a save sends the newer edit after it', async (t) => {
  const calls = []
  const { saver } = setup(t, (snapshot) => {
    const call = deferred()
    calls.push({ snapshot, ...call })
    return call.promise
  })
  saver.update('first')
  t.mock.timers.tick(2000)
  saver.update('second')
  const flushed = saver.flush()
  calls[0].resolve()
  await settle()
  calls[1].resolve()
  await flushed
  assert.deepEqual(
    calls.map((call) => call.snapshot),
    ['first', 'second']
  )
  assert.equal(saver.hasUnsavedChanges(), false)
})

test('reverting during a save still saves the reverted value', async (t) => {
  const calls = []
  const { saver } = setup(t, (snapshot) => {
    const call = deferred()
    calls.push({ snapshot, ...call })
    return call.promise
  })
  saver.update('changed')
  t.mock.timers.tick(2000)
  saver.update('loaded')
  calls[0].resolve()
  await settle()
  t.mock.timers.tick(2000)
  await settle()
  assert.deepEqual(
    calls.map((call) => call.snapshot),
    ['changed', 'loaded']
  )
})

test('reverting before the debounce cancels the save', async (t) => {
  const { saver, saved, statuses } = setup(t)
  saver.update('changed')
  saver.update('loaded')
  t.mock.timers.tick(5000)
  await settle()
  assert.deepEqual(saved, [])
  assert.equal(statuses.at(-1), 'idle')
})

test('a failed save is retried and then reports an error', async (t) => {
  let attempts = 0
  const { saver, statuses } = setup(t, () => {
    attempts++
    return Promise.reject(new Error('offline'))
  })
  saver.update('edited')
  for (const wait of [2000, 2000, 5000, 15000, 60000]) {
    t.mock.timers.tick(wait)
    await settle()
  }
  assert.equal(attempts, 4)
  assert.equal(statuses.at(-1), 'error')
  assert.equal(saver.hasUnsavedChanges(), true)
})

test('a later flush retries a snapshot that failed to save', async (t) => {
  let fail = true
  const saved = []
  const { saver } = setup(t, (snapshot) => {
    if (fail) return Promise.reject(new Error('offline'))
    saved.push(snapshot)
    return Promise.resolve()
  })
  saver.update('edited')
  t.mock.timers.tick(2000)
  await settle()
  fail = false
  await saver.flush()
  assert.deepEqual(saved, ['edited'])
})

test('sendPending sends the newest edit without waiting on a running save', async (t) => {
  const calls = []
  const { saver } = setup(t, (snapshot) => {
    const call = deferred()
    calls.push({ snapshot, ...call })
    return call.promise
  })
  saver.update('first')
  t.mock.timers.tick(2000)
  saver.update('second')
  saver.sendPending()
  assert.deepEqual(
    calls.map((call) => call.snapshot),
    ['first', 'second']
  )
})

test('sendPending saves right away when nothing is running', async (t) => {
  const { saver, saved } = setup(t)
  saver.update('edited')
  saver.sendPending()
  await settle()
  assert.deepEqual(saved, ['edited'])
})

test('cancel drops a debounced edit', async (t) => {
  const { saver, saved } = setup(t)
  saver.update('agent edit')
  saver.cancel()
  t.mock.timers.tick(5000)
  await saver.flush()
  assert.deepEqual(saved, [])
})
