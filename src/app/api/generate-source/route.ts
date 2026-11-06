import { buildSourceZip } from '../../../lib/sourceZip'
import { FormValues } from '../../../types'
import { parseBody } from '../../../lib/apiValidation'
import { SourceZipSchema } from '../../../lib/apiSchemas'

// No session check: the ZIP is built only from the request body, and guests
// can use the generator too.
export async function POST(request: Request) {
  const { data, error } = await parseBody(request, SourceZipSchema)
  if (error) return error
  try {
    // The schema allows nulls in text fields, as the raw body did before.
    const buffer = await buildSourceZip(data as FormValues)
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
