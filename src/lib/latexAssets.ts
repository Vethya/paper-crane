import { LaTeXOpts } from '../types'

/**
 * Lists a template's extra files as [name, publicPath] pairs. The name is
 * the file's path next to resume.tex: class and style files sit beside it,
 * and fonts go in fonts/, where the templates look for them. The browser
 * compiler and the source ZIP both use this, so they lay files out the same.
 */
export function templateAssetEntries(opts: LaTeXOpts): [string, string][] {
  return [
    ...(opts.inputs ?? []).map((path): [string, string] => [
      basename(path),
      path
    ]),
    ...(opts.fonts ?? []).map((path): [string, string] => [
      `fonts/${basename(path)}`,
      path
    ])
  ]
}

function basename(assetPath: string): string {
  return assetPath.split('/').pop() || assetPath
}
