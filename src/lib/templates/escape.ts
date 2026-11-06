// Escaping for user text placed in generated LaTeX.

const TEXT_ESCAPES: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '^': '\\textasciicircum{}',
  '~': '\\textasciitilde{}'
}

// Characters that are not valid raw in a URL get percent-encoded. The rest
// are escaped the way hyperref expects inside a \href target. The % of a
// percent-encoding is escaped too: templates often put \href inside another
// command's argument, where a raw % would start a comment.
const URL_ESCAPES: Record<string, string> = {
  '\\': '\\%5C',
  '{': '\\%7B',
  '}': '\\%7D',
  '^': '\\%5E',
  '~': '\\%7E',
  ' ': '\\%20',
  '%': '\\%',
  '#': '\\#',
  '&': '\\&'
}

// One pass, so the braces in \textbackslash{} are not escaped again.
export function esc(str: string): string
export function esc(str: string | undefined): string | undefined
export function esc(str: string | undefined): string | undefined {
  return str?.replace(/[\\{}&%$#_^~]/g, (char) => TEXT_ESCAPES[char])
}

export function escUrl(url: string): string {
  return url.replace(/[\\{}^~ %#&]/g, (char) => URL_ESCAPES[char])
}

// A link whose visible text is the URL itself.
export function href(url: string): string {
  return `\\href{${escUrl(url)}}{${esc(url)}}`
}
