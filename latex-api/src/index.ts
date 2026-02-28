import express, { Request, Response } from 'express'
import cors from 'cors'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { mkdtemp, rm, writeFile, copyFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, basename } from 'path'
import { tmpdir } from 'os'
import { v4 as uuidv4 } from 'uuid'

const execFileAsync = promisify(execFile)

const app = express()
const PORT = process.env.PORT || 3027
const TEMPLATES_DIR = join(__dirname, '..', 'templates')
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ['POST']
  })
)
app.use(express.json({ limit: '10mb' }))

type LaTeXCmd = 'pdflatex' | 'xelatex'

interface CompileRequest {
  texDoc: string
  opts: {
    cmd: LaTeXCmd
    inputs?: string[]
    fonts?: string[]
  }
}

app.post('/compile', async (req: Request, res: Response) => {
  const { texDoc, opts } = req.body as CompileRequest

  if (!texDoc || !opts?.cmd) {
    res.status(400).send('Missing texDoc or opts.cmd')
    return
  }

  const workDir = await mkdtemp(join(tmpdir(), `resumake-${uuidv4()}-`))

  try {
    // Copy all required input and font files into the work directory
    const assets = [...(opts.inputs || []), ...(opts.fonts || [])]
    for (const assetPath of assets) {
      // assetPath is like /templates/template2/awesome-cv.cls
      // strip leading slash and resolve against TEMPLATES_DIR
      const relative = assetPath.replace(/^\/templates\//, '')
      const src = join(TEMPLATES_DIR, relative)
      const dest = join(workDir, basename(assetPath))

      if (!existsSync(src)) {
        res.status(500).send(`Template asset not found: ${assetPath}`)
        return
      }

      await copyFile(src, dest)
    }

    // For xelatex, fonts also need to be in a fonts/ subdir (some .cls files look there)
    if (opts.cmd === 'xelatex' && opts.fonts && opts.fonts.length > 0) {
      await mkdir(join(workDir, 'fonts'), { recursive: true })
      for (const fontPath of opts.fonts) {
        const relative = fontPath.replace(/^\/templates\//, '')
        const src = join(TEMPLATES_DIR, relative)
        const dest = join(workDir, 'fonts', basename(fontPath))
        if (existsSync(src)) {
          await copyFile(src, dest)
        }
      }
    }

    await writeFile(join(workDir, 'main.tex'), texDoc, 'utf-8')

    const latexArgs = [
      '-interaction=nonstopmode',
      '-no-shell-escape',
      '-output-directory',
      workDir,
      'main.tex'
    ]

    const pdfPath = join(workDir, 'main.pdf')

    try {
      await execFileAsync(opts.cmd, latexArgs, {
        cwd: workDir,
        timeout: 60000
      })
    } catch (compilationErr: unknown) {
      // xelatex exits non-zero for recoverable errors (e.g. special characters)
      // but may still produce a valid PDF with -interaction=nonstopmode
      if (!existsSync(pdfPath)) {
        let message =
          compilationErr instanceof Error
            ? compilationErr.message
            : String(compilationErr)
        if (
          compilationErr &&
          typeof compilationErr === 'object' &&
          'stderr' in compilationErr
        ) {
          message += `\n\nSTDERR:\n${(compilationErr as { stderr: string }).stderr}`
        }
        if (
          compilationErr &&
          typeof compilationErr === 'object' &&
          'stdout' in compilationErr
        ) {
          message += `\n\nSTDOUT:\n${(compilationErr as { stdout: string }).stdout}`
        }
        res.status(500).send(`Compilation error: ${message}`)
        return
      }
      // PDF was produced despite errors — serve it below
    }

    if (!existsSync(pdfPath)) {
      res.status(500).send('Compilation produced no output PDF')
      return
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.sendFile(pdfPath)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).send(`Compilation error: ${message}`)
  } finally {
    rm(workDir, { recursive: true, force: true }).catch(() => undefined)
  }
})

app.listen(PORT, () => {
  console.log(`LaTeX API listening on port ${PORT}`)
})
