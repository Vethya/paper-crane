const assert = require('node:assert/strict')
const test = require('node:test')
const getTemplateData = require('./loadTemplates.cjs')

function generate(selectedTemplate, values = {}) {
  return getTemplateData({ selectedTemplate, sections: [], ...values }).texDoc
}

test('template 4 gives project URLs a separate paragraph', () => {
  const tex = generate(4, {
    sections: ['projects'],
    projects: [
      { name: 'Project', keywords: ['TypeScript'], url: 'https://example.com' }
    ]
  })
  assert.match(
    tex,
    /TypeScript[\s\S]*?\\par\\nopagebreak\[4\]\s*\\noindent\\location\{\\href\{https:\/\/example.com\}\{https:\/\/example.com\}\}/
  )
  assert.doesNotMatch(tex, /\\hfill/)
})

test('template 4 uses the bundled font path when the name is empty', () => {
  const tex = generate(4, {
    sections: ['profile'],
    basics: { email: 'person@example.org' }
  })
  assert.match(tex, /\\fontspec\[Path = fonts\/\]\{Raleway-Medium\}/)
  assert.doesNotMatch(tex, /fonts\/raleway\//)
})

for (const id of [4, 5]) {
  test(`template ${id} keeps each skill label and values in a wrapping paragraph`, () => {
    const tex = generate(id, {
      sections: ['skills'],
      skills: [
        { name: 'Languages', keywords: ['TypeScript', 'Python'] },
        { name: 'Tools', keywords: ['Git', 'Docker'] }
      ]
    })
    assert.doesNotMatch(tex, /\\begin\{tabular\}/)
    assert.match(tex, /Languages[^\n]*:.*TypeScript, Python[^\n]*\\par/)
    assert.match(tex, /Tools[^\n]*:.*Git, Docker[^\n]*\\par/)
  })
}

test('template 8 disables ligatures and hyphenation while allowing justified lines to wrap', () => {
  const tex = generate(8)
  assert.match(tex, /\\defaultfontfeatures\{Ligatures=NoCommon\}/)
  assert.match(tex, /\\setmainfont\{Latin Modern Roman\}/)
  assert.match(tex, /\\usepackage\[none\]\{hyphenat\}/)
  assert.match(
    tex.slice(0, tex.indexOf('\\begin{document}')),
    /\\sloppy\b|\\(?:setlength\{\\emergencystretch\}\{|emergencystretch\s*=\s*)[1-9]/
  )
})

test('template 9 uses T1 names and Unicode mappings for precomposed accents', () => {
  const tex = generate(9, {
    sections: ['profile'],
    basics: { name: 'María-José Núñez' }
  })
  assert.match(tex, /\\input\{glyphtounicode\}/)
  assert.match(tex, /\\pdfgentounicode=1/)
  assert.match(tex, /\\Huge \\usefont\{T1\}\{phv\}\{b\}\{n\}/)
  assert.match(tex, /\\mbox\{\\color\{White\}#2\}/)
  assert.match(tex, /\\newcommand\{\\NewPart\}\[2\]/)
})

test('template 9 supplies every education argument before the Skills heading', () => {
  const tex = generate(9, {
    sections: ['education', 'skills'],
    education: [
      {
        studyType: 'BSc',
        area: 'Computer Science',
        startDate: 'Sep 2014',
        endDate: 'May 2018'
      }
    ],
    skills: [{ name: 'Languages', keywords: ['Python'] }]
  })
  assert.match(
    tex,
    /\\EducationEntry\s*\{BSc Computer Science\}\s*\{Sep 2014 - May 2018\}\s*\{\}\s*\{\}\s*%%% Skills/
  )
  assert.match(tex, /\\NewPart\{Skills\}\{\}/)
})

for (const id of [4, 5, 8, 9]) {
  test(`template ${id} accepts empty fields`, () => {
    const tex = generate(id, {
      sections: [
        'profile',
        'education',
        'work',
        'skills',
        'projects',
        'awards'
      ],
      basics: {},
      education: [{}],
      work: [{ highlights: [] }],
      skills: [{}],
      projects: [{}],
      awards: [{}]
    })
    assert.doesNotMatch(tex, /\b(?:undefined|null)\b/)
    assert.match(tex, /\\end\{document\}/)
  })
}
