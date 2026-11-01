// Node versions that resolve an explicit test directory as a module need an entry point.
const fs = require('node:fs')
const path = require('node:path')

for (const file of fs.readdirSync(__dirname)) {
  if (file.endsWith('.test.cjs')) require(path.join(__dirname, file))
}
