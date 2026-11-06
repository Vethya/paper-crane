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

// A link to url. Its visible text is the URL itself unless text is given.
export function href(url: string, text = url): string {
  return `\\href{${escUrl(url)}}{${esc(text)}}`
}

// Uppercase escaped text without changing the names of LaTeX commands, so
// \textbackslash{} does not become the undefined \TEXTBACKSLASH{}.
export function upper(escaped: string): string {
  return escaped.replace(/\\[a-zA-Z]+|[^\\]+/g, (part) =>
    part.startsWith('\\') ? part : part.toUpperCase()
  )
}
