/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { readdirSync, readFileSync, statSync } = require('node:fs')
const { join, relative } = require('node:path')
const { test } = require('node:test')
/* eslint-enable @typescript-eslint/no-require-imports */

const agentDir = join(__dirname, '../src/app/api/agent')
// The status route reports the flag, so it must work when AI is off.
const UNGUARDED = new Set(['status/route.ts'])

function routeFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return routeFiles(path)
    return name === 'route.ts' ? [path] : []
  })
}

const routes = routeFiles(agentDir).filter(
  (path) => !UNGUARDED.has(relative(agentDir, path))
)

test('finds the agent routes', () => {
  assert.ok(routes.length >= 4, `found ${routes.length} routes`)
})

for (const path of routes) {
  test(`${relative(agentDir, path)}: every handler calls the AI guard first`, () => {
    const source = readFileSync(path, 'utf8')
    const handlers = [
      ...source.matchAll(
        /export async function (GET|POST|PUT|PATCH|DELETE)\([^)]*(?:\([^)]*\)[^)]*)*\)\s*\{\s*([^\n]*)\n\s*([^\n]*)/g
      )
    ]
    assert.ok(handlers.length > 0, 'no handlers found')
    for (const [, method, first, second] of handlers) {
      assert.equal(
        first.trim(),
        'const disabled = aiDisabledResponse()',
        method
      )
      assert.equal(second.trim(), 'if (disabled) return disabled', method)
    }
  })
}
