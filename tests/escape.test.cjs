/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')
const getTemplateData = require('../test/loadTemplates.cjs')
/* eslint-enable @typescript-eslint/no-require-imports */

const { esc, escUrl, href, upper } = (() => {
  const source = ts.transpileModule(
    readFileSync(join(__dirname, '../src/lib/templates/escape.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText
  const module = { exports: {} }
  new Function('module', 'exports', source)(module, module.exports)
  return module.exports
})()

test('esc escapes every LaTeX special character', () => {
  assert.equal(esc('& % $ # _'), '\\& \\% \\$ \\# \\_')
  assert.equal(esc('{a}'), '\\{a\\}')
  assert.equal(esc('10^6'), '10\\textasciicircum{}6')
  assert.equal(esc('~5 years'), '\\textasciitilde{}5 years')
  assert.equal(esc('C:\\Users'), 'C:\\textbackslash{}Users')
})

test('esc does not re-escape its own output', () => {
  assert.equal(esc('\\{'), '\\textbackslash{}\\{')
})

test('esc turns commands into plain text', () => {
  assert.equal(
    esc('\\input{/etc/passwd}'),
    '\\textbackslash{}input\\{/etc/passwd\\}'
  )
})

test('esc leaves plain text and undefined alone', () => {
  assert.equal(esc('María-José, C++ dev'), 'María-José, C++ dev')
  assert.equal(esc(undefined), undefined)
})

test('escUrl keeps URLs working inside \\href', () => {
  assert.equal(
    escUrl('https://site.com/a b?x=1&y=50%#top'),
    'https://site.com/a\\%20b?x=1\\&y=50\\%\\#top'
  )
  assert.equal(
    escUrl('https://x.io/~me/{a}\\^'),
    'https://x.io/\\%7Eme/\\%7Ba\\%7D\\%5C\\%5E'
  )
  assert.equal(escUrl('https://x.io/my_page'), 'https://x.io/my_page')
})

test('href escapes the target and the visible text separately', () => {
  assert.equal(
    href('https://x.io/my_page#a'),
    '\\href{https://x.io/my_page\\#a}{https://x.io/my\\_page\\#a}'
  )
  assert.equal(
    href('http://x.io/a_b', 'x.io/a_b'),
    '\\href{http://x.io/a_b}{x.io/a\\_b}'
  )
})

test('upper keeps LaTeX command names', () => {
  assert.equal(
    upper(esc('jo \\x ^6 ~5 & a_b')),
    'JO \\textbackslash{}X \\textasciicircum{}6 \\textasciitilde{}5 \\& A\\_B'
  )
})

const tricky = {
  sections: ['profile', 'education', 'work', 'projects', 'awards'],
  headings: { work: 'Work & Projects_2' },
  basics: { name: '\\input{x}', website: 'https://x.io/~me/my_page' },
  education: [{ institution: 'Uni', startDate: '2019 & 2020' }],
  work: [
    { company: 'Co', startDate: '~2018', endDate: '2020_Q1', highlights: [] }
  ],
  projects: [{ name: 'P', url: 'https://x.io/a%20b' }],
  awards: [{ title: 'A', date: '#9z' }]
}

for (let id = 1; id <= 9; id++) {
  test(`template ${id} escapes headings, dates, names and URLs`, () => {
    const tex = getTemplateData({ selectedTemplate: id, ...tricky }).texDoc
    assert.doesNotMatch(tex, /\\input\{x\}/)
    assert.doesNotMatch(tex, /Work & Projects_2/)
    assert.doesNotMatch(tex, /2019 & 2020/)
    assert.doesNotMatch(tex, /[^\\]~2018/)
    assert.doesNotMatch(tex, /2020_Q1/)
    assert.doesNotMatch(tex, /[^\\]#9z/)
    assert.doesNotMatch(tex, /[^\\]%20b/)
    // A raw % in a URL would comment out the rest of the line.
    assert.doesNotMatch(tex, /[^\\]%7E/)
    assert.ok(tex.includes('my\\_page'), 'website text')
    // Uppercasing escaped text must not rename commands.
    assert.doesNotMatch(tex, /\\TEXT[A-Z]/)
  })
}

test('template 7 links the homepage without adding a second scheme', () => {
  const homepage = (website) =>
    getTemplateData({
      selectedTemplate: 7,
      sections: ['profile'],
      basics: { website }
    }).texDoc.match(/\\homepage\{(.*)\}/)[1]
  assert.equal(
    homepage('https://x.io/~me'),
    '\\href{https://x.io/\\%7Eme}{https://x.io/\\textasciitilde{}me}'
  )
  assert.equal(homepage('x.io/a_b'), '\\href{http://x.io/a_b}{x.io/a\\_b}')
})
