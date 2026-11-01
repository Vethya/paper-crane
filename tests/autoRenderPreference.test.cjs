/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')
const { atom, createStore } = require('jotai/vanilla')
/* eslint-enable @typescript-eslint/no-require-imports */

const source = ts.transpileModule(
  readFileSync(join(__dirname, '../src/atoms/resume.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText

function harness(raw, unavailable = false) {
  const exports = {}
  const writes = []
  vm.runInNewContext(source, {
    exports,
    require: (name) => (name === 'jotai' ? { atom } : {}),
    localStorage: {
      getItem: (key) => {
        assert.equal(key, 'autoRender')
        if (unavailable) throw new Error('Storage blocked')
        return raw
      },
      setItem: (key, value) => {
        if (unavailable) throw new Error('Storage blocked')
        writes.push([key, value])
      }
    }
  })
  return { preference: exports.autoRenderAtom, store: createStore(), writes }
}

test('defaults on before mount, then reads only literal 0 as off', () => {
  for (const raw of [null, '0', '1', 'false', 'anything']) {
    const { preference, store } = harness(raw)
    assert.equal(store.get(preference), true)
    const unsubscribe = store.sub(preference, () => {})
    assert.equal(store.get(preference), raw !== '0')
    unsubscribe()
  }
})

test('switch writes notify shared subscribers and persist 0/1', () => {
  const { preference, store, writes } = harness(null)
  let notifications = 0
  const unsubscribe = store.sub(preference, () => notifications++)
  store.set(preference, false)
  assert.equal(store.get(preference), false)
  store.set(preference, true)
  assert.equal(store.get(preference), true)
  assert.equal(notifications, 2)
  assert.deepEqual(writes, [
    ['autoRender', '0'],
    ['autoRender', '1']
  ])
  unsubscribe()
})

test('blocked storage preserves reactive controls without throwing', () => {
  const { preference, store } = harness(null, true)
  const unsubscribe = store.sub(preference, () => {})
  assert.equal(store.get(preference), true)
  store.set(preference, false)
  assert.equal(store.get(preference), false)
  unsubscribe()
})
