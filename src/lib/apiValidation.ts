import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import type { z } from 'zod'

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

/** Returns a 400 response when `id` is not a MongoDB ObjectId, else null. */
export function invalidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id)
    ? null
    : badRequest('Invalid ID format')
}

type ParsedBody<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: NextResponse }

/**
 * Reads the JSON body and checks it against `schema`. Malformed JSON or a
 * body that fails the schema yields a 400 response naming the first issue.
 */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
  maxBytes?: number
): Promise<ParsedBody<z.output<S>>> {
  let body: unknown
  try {
    if (maxBytes && request.body) {
      const reader = request.body.getReader()
      const chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > maxBytes) {
          void reader.cancel().catch(() => {})
          return {
            error: NextResponse.json(
              { error: 'Request is too large' },
              { status: 413 }
            )
          }
        }
        chunks.push(value)
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } else body = await request.json()
  } catch {
    return { error: badRequest('Invalid JSON body') }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    const [issue] = result.error.issues
    const path = issue.path.join('.')
    return {
      error: badRequest(path ? `${path}: ${issue.message}` : issue.message)
    }
  }
  return { data: result.data }
}
