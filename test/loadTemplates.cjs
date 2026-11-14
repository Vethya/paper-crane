const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')

const directory = path.resolve(__dirname, '../src/lib/templates')
const modules = new Map()

function load(filename) {
  if (modules.has(filename)) return modules.get(filename).exports

  const module = { exports: {} }
  modules.set(filename, module)
  const javascript = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText
  const nativeRequire = createRequire(filename)
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filename), specifier)
      const typescriptFile = resolved.endsWith('.ts')
        ? resolved
        : `${resolved}.ts`
      if (fs.existsSync(typescriptFile)) return load(typescriptFile)
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

module.exports = load(path.join(directory, 'index.ts')).default
module.exports.loadModule = (name) => load(path.join(directory, `${name}.ts`))
