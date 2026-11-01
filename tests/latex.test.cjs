/* eslint-disable @typescript-eslint/no-require-imports -- This test runs as CommonJS. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')
/* eslint-enable @typescript-eslint/no-require-imports */

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

function harness({
  compile,
  fetchAsset = async () => 'asset',
  fetchResponse,
  init
} = {}) {
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
      if (fetchResponse) return fetchResponse(path)
      const text = await fetchAsset(path)
      return {
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode(text).buffer
      }
    }
  })

  return { latex: exports.default, prewarm: exports.prewarm, calls, blobs }
}

const pdf = (text) => ({
  success: true,
  pdf: new TextEncoder().encode(text)
})
const opts = { cmd: 'pdflatex', inputs: ['/template.cls'] }

test('independent assets fetch concurrently and shared paths fetch once', async () => {
  const asset = deferred()
  const paths = []
  const { latex, calls } = harness({
    fetchAsset: async (path) => {
      paths.push(path)
      await asset.promise
      return path
    },
    compile: (texDoc) => pdf(texDoc)
  })

  const compilation = latex('document', {
    ...opts,
    inputs: ['/template.cls', '/settings.sty'],
    fonts: ['/font.otf', '/template.cls']
  })
  await waitFor(() => paths.length === 3)
  assert.deepEqual(paths, ['/template.cls', '/settings.sty', '/font.otf'])
  assert.equal(calls.length, 0)

  asset.resolve()
  await compilation
  const files = calls[0].options.additionalFiles
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(files).map(([name, bytes]) => [
        name,
        new TextDecoder().decode(bytes)
      ])
    ),
    {
      'template.cls': '/template.cls',
      'settings.sty': '/settings.sty',
      'fonts/font.otf': '/font.otf',
      'fonts/template.cls': '/template.cls'
    }
  )
})

test('compiles reuse cached assets and return fresh PDF URLs', async () => {
  const paths = []
  const { latex, calls, blobs } = harness({
    fetchAsset: async (path) => {
      paths.push(path)
      return path
    },
    compile: (texDoc) => pdf(texDoc)
  })
  const options = { ...opts, fonts: ['https://example.com/font.otf'] }

  const first = await latex('first', options)
  const second = await latex('second', options)
  assert.deepEqual(paths, ['/template.cls', 'https://example.com/font.otf'])
  assert.equal(calls.length, 2)
  assert.notEqual(first, second)
  assert.equal(await blobs.get(first).text(), 'first')
  assert.equal(await blobs.get(second).text(), 'second')
})

for (const failure of ['network', 'HTTP', 'response body']) {
  test(`a failed ${failure} asset fetch is evicted and retried`, async () => {
    let fetchCount = 0
    const { latex, calls, blobs } = harness({
      fetchResponse: async () => {
        const fail = ++fetchCount === 1
        if (fail && failure === 'network') throw new Error('Expected failure')
        return {
          ok: !(fail && failure === 'HTTP'),
          arrayBuffer: async () => {
            if (fail && failure === 'response body') {
              throw new Error('Expected failure')
            }
            return new TextEncoder().encode('retried asset').buffer
          }
        }
      },
      compile: (_texDoc, options) => ({
        success: true,
        pdf: options.additionalFiles['template.cls']
      })
    })

    const first = assert.rejects(
      latex('first', opts),
      failure === 'HTTP' ? /Failed to load LaTeX asset/ : /Expected failure/
    )
    const second = latex('second', opts)
    await first
    assert.equal(await blobs.get(await second).text(), 'retried asset')
    assert.equal(fetchCount, 2)
    assert.equal(calls.length, 1)
  })
}

test('prewarm shares compiler initialization with latex', async () => {
  const initialized = deferred()
  let initCount = 0
  const { latex, prewarm, calls, blobs } = harness({
    init: () => {
      initCount++
      return initialized.promise
    },
    compile: (texDoc) => pdf(texDoc)
  })

  const warmups = [prewarm(), prewarm()]
  const compilation = latex('document', opts)
  await waitFor(() => initCount > 0)
  assert.equal(initCount, 1)
  assert.equal(calls.length, 0)

  initialized.resolve()
  await Promise.all(warmups)
  assert.equal(await blobs.get(await compilation).text(), 'document')
  await prewarm()
  assert.equal(initCount, 1)
})

test('prewarm swallows initialization errors and latex retries', async () => {
  let initCount = 0
  const { latex, prewarm, blobs } = harness({
    init: () => {
      if (++initCount === 1) throw new Error('Expected failure')
    },
    compile: (texDoc) => pdf(texDoc)
  })

  await prewarm()
  assert.equal(
    await blobs.get(await latex('document', opts)).text(),
    'document'
  )
  assert.equal(initCount, 2)
})

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
