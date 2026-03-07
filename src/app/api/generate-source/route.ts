import type { NextRequest } from 'next/server'
import Archiver from 'archiver'
import { stripIndent } from 'common-tags'
import getTemplateData from '../../../lib/templates'
import { FormValues } from '../../../types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  try {
    const buffer = await generateSourceCode(body as FormValues)
    return new Response(buffer, {
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

/**
 * Generates resume source files from the request body,
 * collects all archiver chunks into a Buffer, and resolves with it.
 *
 * @param formData The request body received from the client.
 *
 * @return A promise that resolves to a Buffer containing the ZIP contents.
 */
async function generateSourceCode(formData: FormValues): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { texDoc, opts } = getTemplateData(formData)
    const prettyDoc = /*prettify(texDoc)*/ texDoc
    const zip = Archiver('zip')
    const readme = makeReadme(formData.selectedTemplate, opts.cmd)

    zip.append(prettyDoc, { name: 'resume.tex' })
    zip.append(readme, { name: 'README.md' })

    if (opts.inputs) {
      opts.inputs.forEach((inputPath: string) => {
        zip.file(`public${inputPath}`, { name: inputPath.replace('/templates/', '') })
      })
    }

    const chunks: Buffer[] = []
    zip.on('data', (chunk: Buffer) => chunks.push(chunk))
    zip.on('error', reject)
    zip.on('end', () => resolve(Buffer.concat(chunks)))

    zip.finalize()
  })
}

/**
 * Generates a README to include in the output zip.
 * It details how to use the generated LaTeX source code.
 *
 * @param template The specified resume template.
 * @param cmd The LaTeX command that is used to generate the PDF.
 *
 * @return The generated README text.
 */
function makeReadme(template: number, cmd: string): string {
  return stripIndent`
    # Resumake Template ${template}
    > LaTeX code generated at [resumake.io](https://resumake.io)
    ## Usage
    To generate a PDF from this LaTeX code, navigate to this folder in a terminal and run:
        ${cmd} resume.tex
    ## Requirements
    You will need to have \`${cmd}\` installed on your machine.
    Alternatively, you can use a site like [ShareLaTeX](https://sharelatex.com) to build and edit your LaTeX instead.
  `
}
