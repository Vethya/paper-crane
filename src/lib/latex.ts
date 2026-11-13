import { LaTeXOpts } from '../types'
import { templateAssetEntries } from './latexAssets'
import { type Engine, engineTemplateBundles } from './templates/engines'

const SIGLUM_BASE_URL = 'https://cdn.siglum.org/tl2025'

type SiglumCompiler = import('@siglum/engine').SiglumCompiler

let compilerPromise: Promise<SiglumCompiler> | null = null
let compilationQueue: Promise<unknown> = Promise.resolve()
let unavailablePackage: string | null = null
const assetCache = new Map<string, Promise<Uint8Array>>()
// The WASM binary counts as one more file in the progress bar. Its weight is
// tuned so its share of the bar matches its share of the download time.
const WASM = 'wasm'
const WASM_WEIGHT = 24_000_000
const loaded = new Set<string>()
let weights: Record<string, number> = {}
let compilerReady = false
// Resolves once Siglum knows the bundle names, well before init() finishes
let manifestPromise: Promise<SiglumCompiler>
// The files the pending compile is waiting on; empty until they're known
let waiting: string[] | null = null
const recentLogs: string[] = []

// Progress of the pending compile, weighted by file size. total is 0 until
// the file list is known.
export type EngineDownload = { loaded: number; total: number } | null

let engineDownload: EngineDownload = null
const downloadListeners = new Set<() => void>()

export const getEngineDownload = (): EngineDownload => engineDownload

export function subscribeEngineDownload(listener: () => void): () => void {
  downloadListeners.add(listener)
  return () => downloadListeners.delete(listener)
}

function report() {
  if (!waiting && !engineDownload) return
  const sum = (names: string[]) =>
    names.reduce((total, name) => total + (weights[name] ?? 1), 0)
  engineDownload = waiting && {
    loaded: sum(waiting.filter((name) => loaded.has(name))),
    total: sum(waiting)
  }
  downloadListeners.forEach((listener) => listener())
}

function markLoaded(name: string) {
  loaded.add(name)
  report()
}

function getCompiler(): Promise<SiglumCompiler> {
  if (!compilerPromise) {
    let manifestsLoaded: (compiler: SiglumCompiler) => void
    manifestPromise = new Promise((resolve) => (manifestsLoaded = resolve))
    compilerPromise = import('@siglum/engine')
      .then(({ SiglumCompiler }) => {
        const compiler = new SiglumCompiler({
          bundlesUrl: `${SIGLUM_BASE_URL}/bundles`,
          wasmUrl: `${SIGLUM_BASE_URL}/busytex.wasm`,
          jsUrl: `${SIGLUM_BASE_URL}/busytex.js`,
          workerUrl: '/siglum-worker.js',
          // Static package files built by scripts/build-latex-packages.mjs.
          // Also lets Siglum load bundles for packages that templates only
          // pull in indirectly.
          ctanProxyUrl: '/latex-packages',
          // Each missing package costs one retry the first time it's fetched
          maxRetries: 40,
          // init() reports its steps only through these log lines
          onLog: (message) => {
            recentLogs.push(message)
            if (recentLogs.length > 30) recentLogs.shift()
            const failed = message.match(/fetch failed for (\S+):/)
            if (failed) unavailablePackage = failed[1]
            if (/^WASM (loaded|fetched)/.test(message)) markLoaded(WASM)
            if (/^Manifests (loaded|saved)/.test(message)) {
              manifestsLoaded(compiler)
            }
          },
          enableLazyFS: true,
          enableDocCache: false // Siglum's PDF cache key excludes template assets.
        })
        shareBundleLoads(compiler)

        return compiler.init().then(() => {
          compilerReady = true
          manifestsLoaded(compiler)
          markLoaded(WASM)
          return compiler
        })
      })
      .catch((error) => {
        compilerPromise = null
        throw error
      })
  }

  return compilerPromise
}

// Routes every bundle load, Siglum's own included, through one shared and
// tracked download per bundle.
function shareBundleLoads(compiler: SiglumCompiler) {
  const manager = compiler.bundleManager
  const load = manager.loadBundle.bind(manager)
  // In-flight and finished loads for this compiler only. Siglum's loadBundle
  // doesn't share in-flight downloads, so concurrent callers would fetch a
  // bundle twice. A compiler rebuilt after a failed init starts empty.
  const bundleLoads = new Map<
    string,
    Promise<ArrayBuffer | SharedArrayBuffer>
  >()
  manager.loadBundle = (name: string) => {
    let pending = bundleLoads.get(name)
    if (!pending) {
      pending = load(name).then(
        (data) => {
          markLoaded(name)
          return data
        },
        (error) => {
          bundleLoads.delete(name)
          throw error
        }
      )
      bundleLoads.set(name, pending)
    }
    return pending
  }
}

// The compiler as soon as its bundle names are known. Bundle weights are
// their uncompressed sizes, read from where the manifest places their files.
async function withManifests(
  starting: Promise<SiglumCompiler>
): Promise<SiglumCompiler> {
  const compiler = await Promise.race([manifestPromise, starting])
  if (!weights[WASM]) {
    weights = { [WASM]: WASM_WEIGHT }
    const files: Record<string, { bundle: string; end: number }> =
      compiler.bundleManager.fileManifest ?? {}
    for (const { bundle, end } of Object.values(files)) {
      weights[bundle] = Math.max(weights[bundle] ?? 0, end)
    }
  }
  return compiler
}

// An engine's required bundles plus extras, with their dependencies
function engineBundles(
  compiler: SiglumCompiler,
  engine: Engine,
  extras: string[]
): string[] {
  const { bundleDeps } = compiler.bundleManager
  const deps: Record<string, { requires?: string[] }> = bundleDeps.bundles
  const names = new Set<string>()
  const add = (name: string) => {
    if (names.has(name) || !compiler.bundleManager.bundleExists(name)) return
    names.add(name)
    deps[name]?.requires?.forEach(add)
  }
  ;[...(bundleDeps.engines[engine]?.required ?? []), ...extras].forEach(add)
  return [...names]
}

// Warms both engines so switching templates doesn't wait on a download.
// Template fonts and inputs stay on demand. Bundles load one at a time so a
// render the user is waiting on gets most of the connection.
export async function prewarm(firstEngine: Engine = 'pdflatex'): Promise<void> {
  try {
    const starting = getCompiler()
    const compiler = await withManifests(starting)
    const other: Engine = firstEngine === 'pdflatex' ? 'xelatex' : 'pdflatex'
    for (const engine of [firstEngine, other]) {
      // Network Information API, Chromium only
      const { connection } = navigator as {
        connection?: { saveData?: boolean }
      }
      if (engine === other && connection?.saveData) break
      const names = engineBundles(
        compiler,
        engine,
        engineTemplateBundles[engine]
      )
      for (const name of names) {
        await compiler.bundleManager.loadBundle(name).catch(() => {})
      }
    }
    await starting
  } catch {}
}

export default function latex(
  texDoc: string,
  opts: LaTeXOpts
): Promise<string> {
  const compilation = compilationQueue.then(() => compileLatex(texDoc, opts))
  compilationQueue = compilation.catch(() => {})
  return compilation
}

async function compileLatex(texDoc: string, opts: LaTeXOpts): Promise<string> {
  const starting = getCompiler()
  let compiler: SiglumCompiler
  let additionalFiles: Record<string, Uint8Array>
  try {
    if (!compilerReady) {
      waiting = []
      report()
    }
    const known = await withManifests(starting)
    const names = engineBundles(known, opts.cmd, opts.bundles ?? [])
    if (!compilerReady || names.some((name) => !loaded.has(name))) {
      waiting = [WASM, ...names]
      report()
    }
    // Failures are left to Siglum, which loads bundles again while compiling
    const bundles = Promise.allSettled(
      names.map((name) => known.bundleManager.loadBundle(name))
    )
    ;[compiler, additionalFiles] = await Promise.all([
      starting,
      resolveAssets(opts),
      bundles
    ])
  } finally {
    waiting = null
    report()
  }

  compiler.eagerBundles = opts.bundles ?? []
  await Promise.all(
    (opts.packages ?? []).map((name) => compiler.ctanFetcher.fetchPackage(name))
  )
  unavailablePackage = null
  recentLogs.length = 0
  const result = await compiler.compile(texDoc, {
    engine: opts.cmd,
    additionalFiles
  })

  if (!result.success || !result.pdf) {
    // Siglum doesn't return the TeX log, so report packages it couldn't load
    // and attach its last log lines.
    const details =
      result.error ||
      result.log ||
      (unavailablePackage && `package ${unavailablePackage} is unavailable`) ||
      'Unknown compilation error'
    throw new Error(`LaTeX compilation failed: ${details}`, {
      cause: recentLogs.join('\n')
    })
  }

  const pdf = new Uint8Array(new ArrayBuffer(result.pdf.byteLength))
  pdf.set(result.pdf)

  return URL.createObjectURL(
    new Blob([pdf.buffer], { type: 'application/pdf' })
  )
}

async function resolveAssets(
  opts: LaTeXOpts
): Promise<Record<string, Uint8Array>> {
  return Object.fromEntries(
    await Promise.all(
      templateAssetEntries(opts).map(async ([name, path]) => [
        name,
        await fetchAsset(path)
      ])
    )
  )
}

function fetchAsset(assetPath: string): Promise<Uint8Array> {
  const cached = assetCache.get(assetPath)
  if (cached) return cached

  const asset = fetch(assetPath)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load LaTeX asset: ${assetPath}`)
      }
      return new Uint8Array(await response.arrayBuffer())
    })
    .catch((error) => {
      assetCache.delete(assetPath)
      throw error
    })
  assetCache.set(assetPath, asset)
  return asset
}
