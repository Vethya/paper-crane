// Builds static stand-ins for Siglum's CTAN proxy so templates can use LaTeX
// packages missing from Siglum's CDN bundles without running a server.
//
// For a missing `name.sty`, Siglum looks the file up in
// `{ctanProxyUrl}/bundles/file-to-package.json` and then requests
// `{ctanProxyUrl}/api/fetch/{package}`, expecting
// `{ files: { [texlivePath]: { content, encoding } } }`.
//
// Run by hand after adding a file below, then commit the output:
//   node scripts/build-latex-packages.mjs

import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Siglum's bundles are TeX Live 2025, so packages must come from the frozen
// 2025 archive to stay compatible with its LaTeX kernel.
const ARCHIVE_URL =
  'https://ftp.math.utah.edu/pub/tex/historic/systems/texlive/2025/tlnet-final/archive'
const SIGLUM_BUNDLES_URL = 'https://cdn.siglum.org/tl2025/bundles'

// Files templates load that Siglum's bundles don't provide. Their
// dependencies are resolved automatically.
const REQUIRED_FILES = [
  'changepage.sty',
  'enumitem.sty',
  'framed.sty',
  'hyphenat.sty',
  'isodate.sty',
  'parskip.sty',
  'ragged2e.sty',
  'scrextend.sty',
  'sectsty.sty',
  'setspace.sty',
  'svgnam.def',
  'tabu.sty',
  'textpos.sty',
  'titlesec.sty',
  'tocloft.sty',
  'xifthen.sty',
  'xltxtra.sty',
  'xunicode.sty',
  't3enc.def'
]

// Font packages that no file lookup reaches. TeX requests Helvetica by font
// name (e.g. `phvb7t`), which next.config.js rewrites to `helvetic`. Template 7
// selects marvosym's font directly, so it only loads through preloading.
const FONT_PACKAGES = ['helvetic', 'marvosym']

// Packages where only some files are needed, to skip large font sets.
// TIPA's encoding is declared by xunicode but its glyphs are never used, so
// font metrics are enough.
const PACKAGE_FILE_FILTERS = {
  helvetic: /\.(fd|sty|tfm|vf|pfb|map)$/,
  tipa: /\.(def|fd|sty|tfm)$/
}

const REQUIRE_PATTERN =
  /^[^%\n]*\\(?:RequirePackage|RequirePackageWithOptions|usepackage)\s*(?:\[[^\]]*\])?\s*\{([^}]+)\}/gm

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = resolve(projectRoot, 'public/latex-packages')

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  return response.json()
}

async function downloadPackage(texlivePackage, workDir) {
  const response = await fetch(`${ARCHIVE_URL}/${texlivePackage}.tar.xz`)
  if (!response.ok) {
    throw new Error(`Failed to download ${texlivePackage}: ${response.status}`)
  }

  const archivePath = join(workDir, `${texlivePackage}.tar.xz`)
  writeFileSync(archivePath, Buffer.from(await response.arrayBuffer()))

  const extractDir = join(workDir, texlivePackage)
  mkdirSync(extractDir)
  execFileSync('tar', ['-xJf', archivePath, '-C', extractDir])
  return extractDir
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

function collectRuntimeFiles(extractDir, fileFilter) {
  const files = new Map()

  for (const path of listFiles(extractDir)) {
    // tex/ and fonts/ hold runtime files; doc/, source/ and tlpkg/ don't
    const archivePath = relative(extractDir, path)
    if (fileFilter && !fileFilter.test(archivePath)) continue
    if (archivePath.startsWith('tex/') || archivePath.startsWith('fonts/')) {
      files.set(`/texlive/texmf-dist/${archivePath}`, readFileSync(path))
    }
  }

  return files
}

function findRequiredFiles(files) {
  const required = new Set()

  for (const [path, content] of files) {
    if (!/\.(sty|cls|def|tex)$/.test(path)) continue
    for (const match of content.toString('latin1').matchAll(REQUIRE_PATTERN)) {
      for (const name of match[1].split(',')) {
        const trimmed = name.trim()
        if (/^[\w-]+$/.test(trimmed)) required.add(`${trimmed}.sty`)
      }
    }
  }

  return required
}

const [manifest, fileToPackage] = await Promise.all([
  fetchJson(`${SIGLUM_BUNDLES_URL}/file-manifest.json`),
  fetchJson(`${SIGLUM_BUNDLES_URL}/file-to-package.json`)
])
const bundledFiles = new Set(
  Object.keys(manifest).map((path) => basename(path))
)

const workDir = mkdtempSync(join(tmpdir(), 'latex-packages-'))
const index = {}
const packages = new Map() // TeX Live package -> { files, requiredFiles }
const queue = [...REQUIRED_FILES]

function packageFor(fileName) {
  if (bundledFiles.has(fileName)) return null
  return fileToPackage[fileName] ?? null
}

// Siglum fetches only the package for the file TeX reported missing, and some
// packages check for their dependencies with their own errors, so each
// package's file also carries its non-bundled dependencies.
function collectWithDependencies(texlivePackage, seen = new Set()) {
  if (seen.has(texlivePackage)) return new Map()
  seen.add(texlivePackage)

  const { files, requiredFiles } = packages.get(texlivePackage)
  const allFiles = new Map(files)
  for (const fileName of requiredFiles) {
    const dependency = packageFor(fileName)
    if (!dependency || !packages.has(dependency)) continue
    for (const [path, content] of collectWithDependencies(dependency, seen)) {
      allFiles.set(path, content)
    }
  }
  return allFiles
}

async function addPackage(texlivePackage) {
  const extractDir = await downloadPackage(texlivePackage, workDir)
  const files = collectRuntimeFiles(
    extractDir,
    PACKAGE_FILE_FILTERS[texlivePackage]
  )
  const requiredFiles = findRequiredFiles(files)
  packages.set(texlivePackage, { files, requiredFiles })
  queue.push(...requiredFiles)
}

try {
  for (const texlivePackage of FONT_PACKAGES) await addPackage(texlivePackage)

  while (queue.length > 0) {
    const fileName = queue.shift()
    const texlivePackage = packageFor(fileName)
    if (!texlivePackage) {
      if (!bundledFiles.has(fileName)) {
        console.warn(`Skipping ${fileName}: not in any TeX Live package`)
      }
      continue
    }
    if (!packages.has(texlivePackage)) await addPackage(texlivePackage)
  }

  rmSync(outputDir, { recursive: true, force: true })
  mkdirSync(join(outputDir, 'api/fetch'), { recursive: true })
  mkdirSync(join(outputDir, 'bundles'), { recursive: true })

  for (const [texlivePackage, { files }] of packages) {
    for (const path of files.keys()) index[basename(path)] = texlivePackage

    const allFiles = collectWithDependencies(texlivePackage)
    const body = JSON.stringify({
      files: Object.fromEntries(
        [...allFiles].map(([path, content]) => [
          path,
          { content: content.toString('base64'), encoding: 'base64' }
        ])
      )
    })
    writeFileSync(join(outputDir, 'api/fetch', texlivePackage), body)
    console.log(
      `${texlivePackage}: ${allFiles.size} files, ${(body.length / 1024).toFixed(0)} KB`
    )
  }

  writeFileSync(
    join(outputDir, 'bundles/file-to-package.json'),
    JSON.stringify(index, Object.keys(index).sort())
  )
} finally {
  rmSync(workDir, { recursive: true, force: true })
}
