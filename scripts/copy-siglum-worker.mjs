import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workerSource = resolve(
  projectRoot,
  'node_modules/@siglum/engine/src/worker.js'
)
const workerTarget = resolve(projectRoot, 'public/siglum-worker.js')

mkdirSync(dirname(workerTarget), { recursive: true })
copyFileSync(workerSource, workerTarget)
