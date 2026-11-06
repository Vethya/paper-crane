/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { webcrypto, createHash } = require('node:crypto')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')
/* eslint-enable @typescript-eslint/no-require-imports */

const source = ts.transpileModule(
  readFileSync(join(__dirname, '../src/lib/renderScheduler.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }
).outputText
const opts = { cmd: 'pdflatex' }
const request = (texDoc, owner = 'resume') => ({ texDoc, opts, owner })
const stale = { status: 'stale' }
const skipped = { status: 'skipped', built: false }
const built = { status: 'skipped', built: true }
const plain = (value) => JSON.parse(JSON.stringify(value))

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
async function flush() {
  await new Promise(setImmediate)
}
// Real Web Crypto digests finish off the event loop, so wait by time, not by tick count.
async function waitFor(predicate, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs
  while (!predicate()) {
    if (Date.now() > deadline) assert.fail('Expected scheduler progress')
    await flush()
  }
}
function harness(hash = (value) => value) {
  const exports = {},
    calls = [],
    revoked = [],
    digests = []
  vm.runInNewContext(source, {
    exports,
    TextEncoder,
    Uint8Array,
    crypto: {
      subtle: {
        digest(algorithm, data) {
          digests.push({ algorithm, data: new TextDecoder().decode(data) })
          return webcrypto.subtle.digest(algorithm, data)
        }
      }
    },
    URL: { revokeObjectURL: (url) => revoked.push(url) }
  })
  const scheduler = exports.createRenderScheduler({
    compile(texDoc, options) {
      const result = deferred()
      calls.push({ texDoc, options, ...result })
      return result.promise
    },
    ...(hash === null ? {} : { hash })
  })
  return { ...scheduler, calls, revoked, digests }
}

test('latest wins with one compile and only the newest pending request', async () => {
  const h = harness()
  const a = h.request(request('a'))
  await waitFor(() => h.calls.length === 1)
  const b = h.request(request('b'))
  await flush()
  const c = h.request(request('c'))
  assert.deepEqual(plain(await b), stale)
  assert.equal(h.calls.length, 1)
  h.calls[0].resolve('blob:a')
  assert.deepEqual(plain(await a), stale)
  assert.deepEqual(h.revoked, ['blob:a'])
  await waitFor(() => h.calls.length === 2)
  assert.equal(h.calls[1].texDoc, 'c')
  h.calls[1].resolve('blob:c')
  assert.deepEqual(plain(await c), { status: 'done', url: 'blob:c' })
  assert.deepEqual(h.revoked, ['blob:a'])
})

test('stale errors are discarded, current errors reject, and failure is retryable', async () => {
  const h = harness()
  const a = h.request(request('a'))
  await waitFor(() => h.calls.length === 1)
  const b = h.request(request('b'))
  const failure = new Error('Current failure')
  const rejection = assert.rejects(b, (error) => error === failure)
  h.calls[0].reject(new Error('Stale failure'))
  assert.deepEqual(plain(await a), stale)
  await waitFor(() => h.calls.length === 2)
  h.calls[1].reject(failure)
  await rejection
  const retry = h.request(request('b'))
  await waitFor(() => h.calls.length === 3)
  h.calls[2].resolve('blob:retry')
  assert.equal((await retry).url, 'blob:retry')
})

test('hash skip covers running, pending, and last successful work', async () => {
  const h = harness()
  const a = h.request(request('a'))
  await waitFor(() => h.calls.length === 1)
  assert.deepEqual(plain(await h.request(request('a'))), skipped)
  const b = h.request(request('b'))
  await flush()
  assert.deepEqual(plain(await h.request(request('b'))), skipped)
  h.calls[0].resolve('blob:a')
  assert.deepEqual(plain(await a), stale)
  await waitFor(() => h.calls.length === 2)
  h.calls[1].resolve('blob:b')
  await b
  assert.deepEqual(plain(await h.request(request('b'))), built)
  assert.equal(h.calls.length, 2)
})

for (const phase of ['running', 'pending', 'successful']) {
  test(`force bypasses the ${phase} hash`, async () => {
    const h = harness()
    const a = h.request(request('a'))
    await waitFor(() => h.calls.length === 1)
    let original = a
    if (phase === 'pending') {
      original = h.request(request('b'))
      await flush()
    } else if (phase === 'successful') {
      h.calls[0].resolve('blob:a')
      await a
    }
    const forced = h.request(request(phase === 'pending' ? 'b' : 'a'), {
      force: true
    })
    await flush()
    if (phase !== 'successful') {
      h.calls[0].resolve('blob:old')
      assert.deepEqual(plain(await a), stale)
      if (phase === 'pending') assert.deepEqual(plain(await original), stale)
    }
    await waitFor(() => h.calls.length === 2)
    h.calls[1].resolve('blob:forced')
    assert.deepEqual(plain(await forced), {
      status: 'done',
      url: 'blob:forced'
    })
  })
}

test('invalidate drops pending work, discards running results, and resets hashes', async () => {
  const h = harness()
  const a = h.request(request('a'))
  await waitFor(() => h.calls.length === 1)
  const b = h.request(request('b'))
  await flush()
  h.invalidate()
  assert.deepEqual(plain(await b), stale)
  const c = h.request(request('a', 'other'))
  h.calls[0].resolve('blob:a')
  assert.deepEqual(plain(await a), stale)
  await waitFor(() => h.calls.length === 2)
  h.calls[1].resolve('blob:c')
  await c
  h.invalidate()
  const d = h.request(request('a', 'other'))
  await waitFor(() => h.calls.length === 3)
  h.calls[2].resolve('blob:d')
  await d
  assert.deepEqual(h.revoked, ['blob:a'])
})

test('invalidate also suppresses errors and hashing still in flight', async () => {
  const hash = deferred()
  const h = harness(() => hash.promise)
  const a = h.request(request('a'))
  h.invalidate()
  hash.reject(new Error('Stale hash'))
  assert.deepEqual(plain(await a), stale)
  assert.equal(h.calls.length, 0)
  const compiling = harness()
  const b = compiling.request(request('b'))
  await waitFor(() => compiling.calls.length === 1)
  compiling.invalidate()
  compiling.calls[0].reject(new Error('Stale compile'))
  assert.deepEqual(plain(await b), stale)
})

test('hash completion order cannot reorder requests or publish obsolete work', async () => {
  const hashes = new Map()
  const h = harness((value) => {
    const result = deferred()
    hashes.set(JSON.parse(value)[0], result)
    return result.promise
  })
  const a = h.request(request('a'))
  await flush()
  hashes.get('a').resolve('a')
  await waitFor(() => h.calls.length === 1)
  const b = h.request(request('b'))
  const c = h.request(request('c'))
  await flush()
  h.calls[0].resolve('blob:a')
  let published = false
  a.then(() => {
    published = true
  })
  await flush()
  assert.equal(published, false)
  hashes.get('c').resolve('c')
  assert.deepEqual(plain(await a), stale)
  await waitFor(() => h.calls.length === 2)
  hashes.get('b').resolve('b')
  assert.deepEqual(plain(await b), stale)
  h.calls[1].resolve('blob:c')
  assert.equal((await c).url, 'blob:c')
  assert.deepEqual(
    h.calls.map((call) => call.texDoc),
    ['a', 'c']
  )
})

test('last successful hash can supersede different running work', async () => {
  const h = harness()
  const a = h.request(request('a'))
  await waitFor(() => h.calls.length === 1)
  h.calls[0].resolve('blob:a')
  await a
  const b = h.request(request('b'))
  await waitFor(() => h.calls.length === 2)
  assert.deepEqual(plain(await h.request(request('a'))), built)
  h.calls[1].reject(new Error('Superseded by existing preview'))
  assert.deepEqual(plain(await b), stale)
  assert.equal(h.calls.length, 2)
})

test('owner and options changes do not skip', async () => {
  const h = harness()
  for (const input of [
    request('a'),
    request('a', 'other'),
    { ...request('a', 'other'), opts: { cmd: 'xelatex' } }
  ]) {
    const result = h.request(input)
    const index = h.calls.length
    await waitFor(() => h.calls.length === index + 1)
    h.calls[index].resolve(`blob:${index}`)
    assert.equal((await result).status, 'done')
  }
})

test('default hash is SHA-256 of the source and options JSON', async () => {
  const h = harness(null)
  const a = h.request(request('a'))
  await waitFor(() => h.calls.length === 1)
  h.calls[0].resolve('blob:a')
  await a
  assert.deepEqual(plain(await h.request(request('a'))), built)
  assert.equal(h.digests.length, 2)
  const serialized = JSON.stringify(['a', opts])
  assert.deepEqual(h.digests[0], { algorithm: 'SHA-256', data: serialized })
  assert.equal(createHash('sha256').update(serialized).digest('hex').length, 64)
})

test('current hash errors reject, stale hash errors disappear, and the queue recovers', async () => {
  const hashes = []
  const h = harness(() => {
    const result = deferred()
    hashes.push(result)
    return result.promise
  })
  const a = h.request(request('a'))
  const b = h.request(request('b'))
  const failure = new Error('Current hash failure')
  const rejected = assert.rejects(b, (error) => error === failure)
  await flush()
  hashes[1].reject(failure)
  await rejected
  hashes[0].reject(new Error('Stale hash failure'))
  assert.deepEqual(plain(await a), stale)
  const retry = h.request(request('b'))
  await flush()
  hashes[2].resolve('b')
  await waitFor(() => h.calls.length === 1)
  h.calls[0].resolve('blob:retry')
  assert.equal((await retry).url, 'blob:retry')
})

test('returning to a superseded running document schedules a publishable render', async () => {
  const h = harness()
  const firstA = h.request(request('a'))
  await waitFor(() => h.calls.length === 1)
  const b = h.request(request('b'))
  await flush()
  const finalA = h.request(request('a'))
  assert.deepEqual(plain(await b), stale)
  h.calls[0].resolve('blob:stale-a')
  assert.deepEqual(plain(await firstA), stale)
  await waitFor(() => h.calls.length === 2)
  assert.equal(h.calls[1].texDoc, 'a')
  h.calls[1].resolve('blob:current-a')
  assert.deepEqual(plain(await finalA), {
    status: 'done',
    url: 'blob:current-a'
  })
  assert.deepEqual(h.revoked, ['blob:stale-a'])
})

// Run Form's real hooks with controlled effects, timers, atoms, and compiler.
function formHarness() {
  const h = harness()
  const effects = [],
    callbacks = [],
    memos = [],
    marked = []
  let resume = { url: '', isLoading: false, isError: false }
  let values = {},
    changed,
    timer
  const store = { get: () => resume }
  const setResume = (update) => {
    resume = typeof update === 'function' ? update(resume) : update
  }
  const form = {
    getValues: () => values,
    trigger: async () => true,
    handleSubmit: (callback) => callback,
    watch(callback) {
      changed = callback
      return { unsubscribe() {} }
    }
  }
  function load(path, modules = {}, globals = {}) {
    const exports = {}
    const compiled = ts.transpileModule(
      readFileSync(join(__dirname, '..', path), 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.ReactJSX
        }
      }
    ).outputText
    vm.runInNewContext(compiled, {
      exports,
      require: (name) => modules[name] ?? {},
      structuredClone,
      ...globals
    })
    return exports
  }
  const { Form } = load(
    'src/components/generator/Form/index.tsx',
    {
      react: {
        useState: (initial) => [initial, () => {}],
        useEffect: (effect) => effects.push(effect),
        useCallback(callback) {
          callbacks.push(callback)
          return callback
        },
        useMemo(factory) {
          const value = factory()
          memos.push(value)
          return value
        }
      },
      'react/jsx-runtime': { jsx() {}, jsxs() {} },
      'next/navigation': { useSearchParams: () => ({ get: () => null }) },
      'react-hook-form': { useForm: () => form },
      jotai: {
        useStore: () => store,
        useAtom: (atom) => [false, atom === 'resume' ? setResume : () => {}],
        useAtomValue: () => [],
        useSetAtom: (atom) =>
          atom === 'built' ? (payload) => marked.push(payload) : () => {}
      },
      '../../../atoms/resume': { resumeAtom: 'resume', markBuiltAtom: 'built' },
      '../../../lib/resumeBuild': load('src/lib/resumeBuild.ts'),
      '../../../lib/renderScheduler': { createRenderScheduler: () => h },
      // A template fixture where empty work entries leave the LaTeX unchanged.
      '../../../lib/templates': {
        default: (payload) => ({
          texDoc: JSON.stringify(payload.basics ?? {}),
          opts
        })
      },
      clsx: { default: () => '' },
      'tailwind-merge': { twMerge: () => '' }
    },
    {
      document: {
        hidden: false,
        addEventListener() {},
        removeEventListener() {}
      },
      localStorage: { getItem: () => null },
      setTimeout: (callback) => {
        timer = callback
        return 1
      },
      clearTimeout: () => {
        timer = undefined
      },
      URL: { revokeObjectURL: (url) => h.revoked.push(url) }
    }
  )
  Form({})
  return {
    ...h,
    marked,
    owner: memos[1],
    generate: callbacks[0],
    get resume() {
      return resume
    },
    startAuto: () => effects[3](),
    async change(payload) {
      values = payload
      changed()
      await timer?.()
    }
  }
}

test('empty guest content skips initially, but renders after clearing an existing preview', async () => {
  const h = formHarness()
  h.startAuto()
  await h.change({ basics: { name: '' }, work: [] })
  assert.equal(h.calls.length, 0)
  const populated = h.change({ basics: { name: 'Ada' } })
  await waitFor(() => h.calls.length === 1)
  h.calls[0].resolve('blob:populated')
  await populated
  const cleared = h.change({ basics: { name: '' }, work: [] })
  await waitFor(() => h.calls.length === 2)
  assert.equal(h.calls[1].texDoc, JSON.stringify({ name: '' }))
  h.calls[1].resolve('blob:empty')
  await cleared
  assert.equal(h.resume.url, 'blob:empty')
  assert.equal(h.resume.isLoading, false)
})

test('successful skip marks the unfiltered payload built and clears loading', async () => {
  const h = formHarness()
  const payload = { basics: { name: 'Ada' } }
  const first = h.generate(payload)
  await waitFor(() => h.calls.length === 1)
  h.calls[0].resolve('blob:preview')
  await first
  const withEmptyWork = { ...payload, work: [{ company: '', highlights: [] }] }
  await h.generate(withEmptyWork)
  assert.equal(h.calls.length, 1)
  assert.deepEqual(plain(h.marked), [payload, withEmptyWork])
  assert.deepEqual(plain(h.resume), {
    url: 'blob:preview',
    isLoading: false,
    isError: false
  })
})

test('in-flight skip does not mark unbuilt data or clear another render loading state', async () => {
  const h = formHarness()
  const payload = { basics: { name: 'Ada' } }
  const first = h.generate(payload)
  await waitFor(() => h.calls.length === 1)
  await h.generate({ ...payload, work: [{ company: '', highlights: [] }] })
  assert.deepEqual(h.marked, [])
  assert.equal(h.resume.isLoading, true)
  h.calls[0].resolve('blob:preview')
  await first
  assert.deepEqual(plain(h.marked), [payload])
  assert.equal(h.resume.isLoading, false)
})

for (const guard of ['inactive owner', 'cancelled commit']) {
  test(`successful skip cannot mark built for ${guard}`, async () => {
    const h = formHarness()
    const payload = { basics: { name: 'Ada' } }
    const first = h.generate(payload)
    await waitFor(() => h.calls.length === 1)
    h.calls[0].resolve('blob:preview')
    await first
    const skipped = h.generate(
      { ...payload, work: [] },
      () => guard !== 'cancelled commit'
    )
    if (guard === 'inactive owner') h.owner.active = false
    await skipped
    assert.deepEqual(plain(h.marked), [payload])
  })
}
