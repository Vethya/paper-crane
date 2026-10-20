import { LaTeXOpts } from '../types'

const SIGLUM_BASE_URL = 'https://cdn.siglum.org/tl2025'

type SiglumCompiler = import('@siglum/engine').SiglumCompiler

let compilerPromise: Promise<SiglumCompiler> | null = null

function getCompiler(): Promise<SiglumCompiler> {
  if (!compilerPromise) {
    compilerPromise = import('@siglum/engine')
      .then(({ SiglumCompiler }) => {
        const compiler = new SiglumCompiler({
          bundlesUrl: `${SIGLUM_BASE_URL}/bundles`,
          wasmUrl: `${SIGLUM_BASE_URL}/busytex.wasm`,
          jsUrl: `${SIGLUM_BASE_URL}/busytex.js`,
          workerUrl: '/siglum-worker.js',
          enableCtan: false,
          enableLazyFS: true,
          enableDocCache: true
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

export default async function latex(
  texDoc: string,
  opts: LaTeXOpts
): Promise<string> {
  const compiler = await getCompiler()
  const additionalFiles = await resolveAssets(opts)

  const result = await compiler.compile(texDoc, {
    engine: opts.cmd,
    additionalFiles
  })

  if (!result.success || !result.pdf) {
    const details = result.error || result.log || 'Unknown compilation error'
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
  const additionalFiles: Record<string, Uint8Array> = {}

  for (const assetPath of opts.inputs || []) {
    additionalFiles[basename(assetPath)] = await fetchAsset(assetPath)
  }

  for (const assetPath of opts.fonts || []) {
    additionalFiles[`fonts/${basename(assetPath)}`] =
      await fetchAsset(assetPath)
  }

  return additionalFiles
}

async function fetchAsset(assetPath: string): Promise<Uint8Array> {
  const response = await fetch(assetPath)
  if (!response.ok) {
    throw new Error(`Failed to load LaTeX asset: ${assetPath}`)
  }

  return new Uint8Array(await response.arrayBuffer())
}

function basename(assetPath: string): string {
  return assetPath.split('/').pop() || assetPath
}
