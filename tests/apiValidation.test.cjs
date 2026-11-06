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
// Converted in a later change.
const PENDING = ['agent', 'generate-source']
const SKIPPED = ['auth', ...PENDING]

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
