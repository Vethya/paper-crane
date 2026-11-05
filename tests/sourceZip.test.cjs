/* eslint-disable @typescript-eslint/no-require-imports -- This test runs as CommonJS. */
const assert = require('node:assert/strict')
const { execFileSync, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createRequire } = require('node:module')
const { test } = require('node:test')
const ts = require('typescript')
/* eslint-enable @typescript-eslint/no-require-imports */

const root = path.resolve(__dirname, '..')
const modules = new Map()

// Loads a TypeScript module and its relative TypeScript imports.
function load(filename) {
  if (modules.has(filename)) return modules.get(filename).exports

  const module = { exports: {} }
  modules.set(filename, module)
  const javascript = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    }
  }).outputText
  const nativeRequire = createRequire(filename)
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filename), specifier)
      const file = [resolved, `${resolved}.ts`, `${resolved}/index.ts`].find(
        (candidate) => candidate.endsWith('.ts') && fs.existsSync(candidate)
      )
      if (file) return load(file)
    }
    return nativeRequire(specifier)
  }
  new Function('require', 'module', 'exports', javascript)(
    localRequire,
    module,
    module.exports
  )
  return module.exports
}

const { buildSourceZip } = load(path.join(root, 'src/lib/sourceZip.ts'))
const { templateAssetEntries } = load(path.join(root, 'src/lib/latexAssets.ts'))
const getTemplateData = load(
  path.join(root, 'src/lib/templates/index.ts')
).default
const { POST } = load(path.join(root, 'src/app/api/generate-source/route.ts'))

const TEMPLATES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function formData(selectedTemplate) {
  return {
    selectedTemplate,
    sections: ['profile'],
    basics: { name: 'Ada Lovelace', email: 'ada@example.org' }
  }
}

function writeZip(buffer) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'source-zip-'))
  const zipPath = path.join(dir, 'resume.zip')
  fs.writeFileSync(zipPath, buffer)
  return { dir, zipPath }
}

function zipEntries(buffer) {
  const { dir, zipPath } = writeZip(buffer)
  try {
    return execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .sort()
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

for (const id of TEMPLATES) {
  test(`template ${id} ZIP lays out files like the browser compiler`, async () => {
    const data = formData(id)
    const { opts } = getTemplateData(data)
    const expected = [
      'README.md',
      'resume.tex',
      ...templateAssetEntries(opts).map(([name]) => name)
    ].sort()

    assert.deepEqual(zipEntries(await buildSourceZip(data)), expected)
  })
}

test('template 2 ZIP has the class at the root and all 19 fonts', async () => {
  const entries = zipEntries(await buildSourceZip(formData(2)))

  assert.ok(entries.includes('awesome-cv.cls'))
  assert.equal(entries.filter((name) => name.startsWith('fonts/')).length, 19)
  assert.ok(!entries.some((name) => name.startsWith('template2/')))
})

test('the route returns a ZIP without a session', async () => {
  const response = await POST(
    new Request('http://localhost/api/generate-source', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(formData(2))
    })
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'application/zip')
})

function hasCommand(cmd) {
  return spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0
}

for (const id of TEMPLATES) {
  const { cmd } = getTemplateData(formData(id)).opts
  test(
    `template ${id} extracted ZIP compiles with ${cmd}`,
    { skip: !hasCommand(cmd) && `${cmd} is not installed` },
    async () => {
      const { dir, zipPath } = writeZip(await buildSourceZip(formData(id)))
      try {
        execFileSync('unzip', ['-q', zipPath, '-d', dir])
        const result = spawnSync(
          cmd,
          ['-interaction=nonstopmode', '-halt-on-error', 'resume.tex'],
          { cwd: dir, encoding: 'utf8' }
        )
        assert.equal(result.status, 0, result.stdout.slice(-2000))
        assert.ok(fs.existsSync(path.join(dir, 'resume.pdf')))
      } finally {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    }
  )
}
