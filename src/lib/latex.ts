import { LaTeXOpts } from '../types'
import { clientEnv } from '@/env.client'

export default async function latex(
  texDoc: string,
  opts: LaTeXOpts
): Promise<string> {
  const apiUrl = clientEnv.NEXT_PUBLIC_LATEX_API_URL

  const res = await fetch(`${apiUrl}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texDoc, opts })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LaTeX compilation failed: ${err}`)
  }

  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
