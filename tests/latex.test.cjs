const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

const source = ts.transpileModule(
  readFileSync(join(__dirname, '../src/lib/latex.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }
).outputText

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

async function waitFor(predicate) {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (predicate()) return
    await new Promise(setImmediate)
  }
  assert.fail('Expected compilation did not start')
}

function harness({ compile, fetchAsset = async () => 'asset', init } = {}) {
  const calls = []
  const blobs = new Map()
  const exports = {}

  class Compiler {
    constructor(options) {
      this.options = options
    }

    async init() {
      await init?.()
    }

    async compile(texDoc, options) {
      calls.push({ texDoc, options })
      return compile.call(this, texDoc, options)
    }
  }

  vm.runInNewContext(source, {
    exports,
    require(name) {
      assert.equal(name, '@siglum/engine')
      return { SiglumCompiler: Compiler }
    },
    Uint8Array,
    ArrayBuffer,
    Blob,
    URL: {
      createObjectURL(blob) {
        const url = `blob:${blobs.size}`
        blobs.set(url, blob)
        return url
      }
    },
    async fetch(path) {
      const text = await fetchAsset(path)
      return {
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode(text).buffer
      }
    }
  })

  return { latex: exports.default, calls, blobs }
}

const pdf = (text) => ({
  success: true,
  pdf: new TextEncoder().encode(text)
})
const opts = { cmd: 'pdflatex', inputs: ['/template.cls'] }

test('overlapping submissions load assets and compile in order', async () => {
  const asset = deferred()
  const firstCompile = deferred()
  let fetchCount = 0
  const { latex, calls, blobs } = harness({
    fetchAsset: () => (++fetchCount === 1 ? asset.promise : 'second asset'),
    compile: (texDoc) =>
      texDoc === 'first' ? firstCompile.promise : pdf(texDoc)
  })

  const first = latex('first', opts)
  const second = latex('second', opts)
  await waitFor(() => fetchCount > 0)
  assert.equal(fetchCount, 1)
  assert.equal(calls.length, 0)

  asset.resolve('first asset')
  await waitFor(() => calls.length > 0)
  assert.deepEqual(
    calls.map((call) => call.texDoc),
    ['first']
  )

  firstCompile.resolve(pdf('first'))
  const urls = await Promise.all([first, second])
  assert.deepEqual(
    calls.map((call) => call.texDoc),
    ['first', 'second']
  )
  assert.deepEqual(
    await Promise.all(urls.map((url) => blobs.get(url).text())),
    ['first', 'second']
  )
})

for (const stage of [
  'initialization',
  'asset fetch',
  'compile rejection',
  'compile result'
]) {
  test(`a failed ${stage} does not block the next submission`, async () => {
    let failed = false
    const failOnce = (currentStage) => {
      if (stage === currentStage && !failed) {
        failed = true
        throw new Error('Expected failure')
      }
    }
    const { latex, blobs } = harness({
      init: () => failOnce('initialization'),
      fetchAsset: () => {
        failOnce('asset fetch')
        return 'asset'
      },
      compile: (texDoc) => {
        failOnce('compile rejection')
        if (stage === 'compile result' && !failed) {
          failed = true
          return { success: false, error: 'Expected failure' }
        }
        return pdf(texDoc)
      }
    })

    const first = assert.rejects(latex('first', opts), /Expected failure/)
    const second = latex('second', opts)
    await first
    assert.equal(await blobs.get(await second).text(), 'second')
  })
}

test('changed template assets produce a new PDF across page loads', async () => {
  // Model Siglum 0.1.4's persistent PDF cache, keyed only by source and engine.
  const cache = new Map()
  const compile = function (texDoc, options) {
    const key = `${options.engine}:${texDoc}`
    if (this.options.enableDocCache && cache.has(key)) return cache.get(key)
    const result = pdf(
      new TextDecoder().decode(options.additionalFiles['template.cls'])
    )
    if (this.options.enableDocCache) cache.set(key, result)
    return result
  }

  for (const asset of ['old template', 'new template']) {
    const { latex, blobs } = harness({ compile, fetchAsset: async () => asset })
    const url = await latex('same document', opts)
    assert.equal(await blobs.get(url).text(), asset)
  }
})
