import { buildSourceZip } from '../../../lib/sourceZip'
import { FormValues } from '../../../types'

// No session check: the ZIP is built only from the request body, and guests
// can use the generator too.
export async function POST(request: Request) {
  try {
    const formData = (await request.json()) as FormValues
    const buffer = await buildSourceZip(formData)
    return new Response(new Uint8Array(buffer), {
      headers: {
        'content-type': 'application/zip',
        'content-disposition': 'attachment; filename="resume.zip"'
      }
    })
  } catch (err) {
    console.error('[generate-source] Error generating ZIP:', err)
    return new Response('Failed to generate source', { status: 500 })
  }
}
