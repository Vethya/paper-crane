import { LaTeXOpts } from '../types'
import { templateAssetEntries } from './latexAssets'

const SIGLUM_BASE_URL = 'https://cdn.siglum.org/tl2025'

type SiglumCompiler = import('@siglum/engine').SiglumCompiler

let compilerPromise: Promise<SiglumCompiler> | null = null
let compilationQueue: Promise<unknown> = Promise.resolve()
let unavailablePackage: string | null = null
const assetCache = new Map<string, Promise<Uint8Array>>()

function trackUnavailablePackage(message: string) {
  const match = message.match(/fetch failed for (\S+):/)
  if (match) unavailablePackage = match[1]
}

function getCompiler(): Promise<SiglumCompiler> {
  if (!compilerPromise) {
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
          onLog: trackUnavailablePackage,
          enableLazyFS: true,
          enableDocCache: false // Siglum's PDF cache key excludes template assets.
        })

        return compiler.init().then(() => compiler)
      })
      .catch((error) => {
        compilerPromise = null
        throw error
      })
  }

  return compilerPromise
}

export async function prewarm(): Promise<void> {
  await getCompiler().catch(() => {})
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
  const compiler = await getCompiler()
  const additionalFiles = await resolveAssets(opts)

  compiler.eagerBundles = opts.bundles ?? []
  await Promise.all(
    (opts.packages ?? []).map((name) => compiler.ctanFetcher.fetchPackage(name))
  )
  unavailablePackage = null
  const result = await compiler.compile(texDoc, {
    engine: opts.cmd,
    additionalFiles
  })

  if (!result.success || !result.pdf) {
    // Siglum doesn't return the TeX log, so report packages it couldn't load
    const details =
      result.error ||
      result.log ||
      (unavailablePackage && `package ${unavailablePackage} is unavailable`) ||
      'Unknown compilation error'
    throw new Error(`LaTeX compilation failed: ${details}`)
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
