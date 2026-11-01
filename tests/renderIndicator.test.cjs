/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')
/* eslint-enable @typescript-eslint/no-require-imports */

const source = ts.transpileModule(
  readFileSync(join(__dirname, '../src/hooks/useRenderIndicator.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText

function harness() {
  const exports = {}
  let delayed = false
  let previous
  let cleanup
  let effect
  let now = 0
  const timers = new Map()
  vm.runInNewContext(source, {
    exports,
    require: () => ({
      useState: () => [
        delayed,
        (value) => {
          delayed = value
        }
      ],
      useEffect: (callback, [rendering]) => {
        if (previous !== rendering) {
          previous = rendering
          effect = callback
        }
      }
    }),
    setTimeout: (callback, ms) => {
      timers.set(callback, now + ms)
      return callback
    },
    clearTimeout: (callback) => timers.delete(callback)
  })
  return {
    render: (rendering, hasPdf = true, error = false) => {
      const indicator = exports.useRenderIndicator(rendering, hasPdf, error)
      if (effect) {
        cleanup?.()
        cleanup = effect()
        effect = undefined
      }
      return indicator
    },
    advance: (ms) => {
      now += ms
      for (const [callback, due] of timers) {
        if (due <= now) {
          timers.delete(callback)
          callback()
        }
      }
    },
    unmount: () => cleanup?.(),
    timers
  }
}

test('shows the spinner after 400ms and hides it immediately when done', () => {
  const h = harness()
  assert.equal(h.render(true), 'none')
  h.advance(399)
  assert.equal(h.render(true), 'none')
  h.advance(1)
  assert.equal(h.render(true), 'spinner')
  assert.equal(h.render(false), 'none')
  assert.equal(h.render(true), 'none')
})

test('fast renders and unmount cancel the delayed spinner', () => {
  const h = harness()
  h.render(true)
  h.advance(200)
  h.render(false)
  assert.equal(h.timers.size, 0)
  h.advance(500)
  assert.equal(h.render(true), 'none')
  h.unmount()
  assert.equal(h.timers.size, 0)
})

test('first preview uses engine copy and errors override every loading state', () => {
  const h = harness()
  assert.equal(h.render(true, false), 'loading-engine')
  h.advance(500)
  assert.equal(h.render(true, false), 'loading-engine')
  assert.equal(h.render(true, true), 'spinner')
  assert.equal(h.render(true, true, true), 'error')
  assert.equal(h.render(false, true, true), 'error')
  assert.equal(h.render(false, true), 'none')
  assert.equal(h.render(false, false), 'none')
})
