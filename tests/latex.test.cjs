/* eslint-disable @typescript-eslint/no-require-imports -- This test runs as CommonJS. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { dirname, join } = require('node:path')
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

function loadModule(file) {
  const exports = {}
  const moduleSource = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText
  vm.runInNewContext(moduleSource, {
    exports,
    require: (name) => loadModule(join(dirname(file), `${name}.ts`))
  })
  return exports
}

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
  init,
  loadBundle = async () => {},
  navigator = {},
  initPreload = false
} = {}) {
  const calls = []
  const bundleFetches = []
  const blobs = new Map()
  const exports = {}

  class Compiler {
    constructor(options) {
      this.options = options
      this.bundleManager = {
        fileManifest: {
          'pdftex.fmt': { bundle: 'pdftex', end: 10 },
          'xetex.fmt': { bundle: 'xetex', end: 30 },
          'fontspec.sty': { bundle: 'typography', end: 20 }
        },
        bundleDeps: {
          engines: {
            pdflatex: { required: ['pdftex'] },
            xelatex: { required: ['xetex'] }
          },
          bundles: { typography: { requires: ['fonts'] } }
        },
        bundleExists: (name) => name !== 'babel',
        async loadBundle(name) {
          bundleFetches.push(name)
          return loadBundle(name)
        }
      }
    }

    async init() {
      this.options.onLog('Manifests saved to cache')
      await init?.()
      if (initPreload) await this.bundleManager.loadBundle('pdftex')
    }

    async compile(texDoc, options) {
      calls.push({ texDoc, options })
      return compile.call(this, texDoc, options)
    }
  }

  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name.startsWith('./')) {
        return loadModule(join(__dirname, '../src/lib', `${name}.ts`))
      }
      assert.equal(name, '@siglum/engine')
      return { SiglumCompiler: Compiler }
    },
    navigator,
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

  return { ...exports, latex: exports.default, calls, blobs, bundleFetches }
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

const plain = (value) => JSON.parse(JSON.stringify(value))
const count = (names, name) => names.filter((item) => item === name).length
const WASM_WEIGHT = 24_000_000

test('prewarm loads the first engine before the other, one bundle at a time', async () => {
  const xetex = deferred()
  const { prewarm, bundleFetches } = harness({
    loadBundle: (name) => name === 'xetex' && xetex.promise
  })

  const warmup = prewarm('xelatex')
  await waitFor(() => bundleFetches.length > 0)
  assert.deepEqual(bundleFetches, ['xetex'])

  xetex.resolve()
  await warmup
  assert.ok(
    bundleFetches.indexOf('typography') < bundleFetches.indexOf('pdftex')
  )
  assert.ok(bundleFetches.includes('fonts'))
  assert.ok(!bundleFetches.includes('babel'))
  assert.equal(new Set(bundleFetches).size, bundleFetches.length)
})

test('bundles start downloading before initialization finishes', async () => {
  const initialized = deferred()
  const { prewarm, bundleFetches } = harness({
    init: () => initialized.promise,
    initPreload: true
  })

  const warmup = prewarm()
  await waitFor(() => bundleFetches.includes('typography'))
  initialized.resolve()
  await warmup
  // Siglum's own preload during init shares the download
  assert.equal(count(bundleFetches, 'pdftex'), 1)
})

test('a compile during the preload shares its bundle downloads', async () => {
  const typography = deferred()
  const { latex, prewarm, bundleFetches, blobs } = harness({
    loadBundle: (name) => name === 'typography' && typography.promise,
    compile: (texDoc) => pdf(texDoc)
  })

  const warmup = prewarm()
  await waitFor(() => bundleFetches.includes('typography'))
  const compilation = latex('document', { ...opts, bundles: ['typography'] })
  typography.resolve()
  await warmup
  assert.equal(await blobs.get(await compilation).text(), 'document')
  assert.equal(count(bundleFetches, 'typography'), 1)
  assert.equal(count(bundleFetches, 'fonts'), 1)
})

test('a compile waits for its own bundles only', async () => {
  const typography = deferred()
  const xetex = deferred()
  const { latex, prewarm, calls, getEngineDownload } = harness({
    loadBundle: (name) =>
      (name === 'typography' && typography.promise) ||
      (name === 'xetex' && xetex.promise),
    compile: (texDoc) => pdf(texDoc)
  })

  // The pdfLaTeX preload is stuck on a bundle this template doesn't list
  void prewarm()
  await latex('pdf', opts)
  assert.equal(calls.length, 1)

  const compilation = latex('xe', { ...opts, cmd: 'xelatex' })
  await waitFor(() => getEngineDownload())
  assert.deepEqual(plain(getEngineDownload()), {
    loaded: WASM_WEIGHT,
    total: WASM_WEIGHT + 30
  })
  assert.equal(calls.length, 1)
  xetex.resolve()
  await compilation
  assert.equal(calls.length, 2)
  assert.equal(getEngineDownload(), null)
  typography.resolve()
})

test('a compile reports size-weighted download progress', async () => {
  const initialized = deferred()
  const { latex, bundleFetches, getEngineDownload, subscribeEngineDownload } =
    harness({
      init: () => initialized.promise,
      compile: (texDoc) => pdf(texDoc)
    })
  const states = []
  subscribeEngineDownload(() => states.push(plain(getEngineDownload())))

  const first = latex('first', { ...opts, bundles: ['typography', 'babel'] })
  await waitFor(() => bundleFetches.length === 3 && states.length === 5)
  // pdftex is 10, typography 20, and fonts has no manifest entry
  const total = WASM_WEIGHT + 31
  assert.deepEqual(states, [
    { loaded: 0, total: 0 },
    ...[0, 10, 30, 31].map((loaded) => ({ loaded, total }))
  ])

  initialized.resolve()
  await first
  assert.deepEqual(states.slice(5), [{ loaded: total, total }, null])

  await latex('second', { ...opts, bundles: ['typography'] })
  assert.equal(states.length, 7)
})

test('prewarm skips the other engine when saving data', async () => {
  const { prewarm, bundleFetches } = harness({
    navigator: { connection: { saveData: true } }
  })

  await prewarm()
  assert.ok(bundleFetches.includes('pdftex'))
  assert.ok(!bundleFetches.includes('xetex'))
})

test('a failed bundle download is retried by the next compile', async () => {
  let failures = 0
  const { latex, prewarm, bundleFetches, blobs } = harness({
    loadBundle: (name) => {
      if (name === 'typography' && ++failures === 1) {
        throw new Error('Expected failure')
      }
    },
    compile: (texDoc) => pdf(texDoc)
  })

  await prewarm()
  const url = await latex('document', { ...opts, bundles: ['typography'] })
  assert.equal(await blobs.get(url).text(), 'document')
  assert.equal(count(bundleFetches, 'typography'), 2)
})

test('a failed compile carries the engine log', async () => {
  const { latex } = harness({
    compile() {
      this.options.onLog('! Undefined control sequence.')
      return { success: false }
    }
  })

  await assert.rejects(latex('document', opts), (error) => {
    assert.match(error.message, /Unknown compilation error/)
    assert.match(error.cause, /Undefined control sequence/)
    return true
  })
})
