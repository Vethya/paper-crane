import type { LaTeXOpts } from '../../types'

export type Engine = LaTeXOpts['cmd']

// The engine preload in latex.ts reads these instead of the template modules.
// test/templateEngines.test.cjs checks they match getTemplateData.
const XELATEX_TEMPLATES = [2, 4, 5, 6, 8]

// Union of the Siglum bundles the templates for each engine list
export const engineTemplateBundles: Record<Engine, string[]> = {
  pdflatex: ['xcolor', 'utils', 'typography', 'tex-generic'],
  xelatex: [
    'tex-latex-misc',
    'graphics',
    'xcolor',
    'utils',
    'typography',
    'amsmath',
    'hyperref',
    'tex-generic',
    'babel',
    'fonts-lm-type1'
  ]
}

export function templateEngine(template?: number): Engine {
  return XELATEX_TEMPLATES.includes(template ?? 0) ? 'xelatex' : 'pdflatex'
}
