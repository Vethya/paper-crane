import type { LaTeXOpts, TemplateData } from '../types'

type Result =
  | { status: 'done'; url: string }
  | { status: 'skipped'; built: boolean }
  | { status: 'stale' }
type Request = TemplateData & { owner: unknown }
type Job = Request & {
  key: string
  resolve: (result: Result) => void
  reject: (error: unknown) => void
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')
}

export function createRenderScheduler({
  compile,
  hash = sha256
}: {
  compile: (texDoc: string, opts: LaTeXOpts) => Promise<string>
  hash?: (value: string) => string | Promise<string>
}) {
  let sequence = 0
  let hashing = Promise.resolve()
  let running: Job | undefined
  let pending: Job | undefined
  let latest: Job | undefined
  let successful: { key: string; owner: unknown } | undefined

  async function drain() {
    if (running || !pending) return
    const job = pending
    running = job
    pending = undefined
    let url: string | undefined
    let error: unknown
    let failed = false
    try {
      url = await compile(job.texDoc, job.opts)
    } catch (reason) {
      failed = true
      error = reason
    }
    // Hashes may finish out of order. Admit the newest request before publishing.
    let barrier
    do {
      barrier = hashing
      await barrier
    } while (barrier !== hashing)
    if (latest !== job) {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
      job.resolve({ status: 'stale' })
    } else if (failed) job.reject(error)
    else {
      successful = { key: job.key, owner: job.owner }
      job.resolve({ status: 'done', url: url! })
    }
    running = undefined
    void drain()
  }

  return {
    request(input: Request, { force = false } = {}): Promise<Result> {
      const ticket = ++sequence
      return new Promise((resolve, reject) => {
        hashing = Promise.resolve()
          .then(() => hash(JSON.stringify([input.texDoc, input.opts])))
          .then(
            (key) => {
              if (ticket !== sequence) return resolve({ status: 'stale' })
              const matches = (job: { key: string; owner: unknown }) =>
                job.key === key && job.owner === input.owner
              // Superseded work cannot publish, so it cannot suppress a new render.
              if (
                !force &&
                latest &&
                matches(latest) &&
                (latest === running || latest === pending)
              ) {
                return resolve({ status: 'skipped', built: false })
              }
              pending?.resolve({ status: 'stale' })
              pending = undefined
              latest = { ...input, key, resolve, reject }
              if (!force && successful && matches(successful)) {
                return resolve({ status: 'skipped', built: true })
              }
              pending = latest
              void drain()
            },
            (error) => {
              if (ticket !== sequence) return resolve({ status: 'stale' })
              latest = undefined
              pending?.resolve({ status: 'stale' })
              pending = undefined
              reject(error)
            }
          )
      })
    },
    invalidate() {
      sequence++
      latest = successful = undefined
      pending?.resolve({ status: 'stale' })
      pending = undefined
    }
  }
}
