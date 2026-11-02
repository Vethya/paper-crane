const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const getTemplateData = require('./loadTemplates.cjs')

function generate(selectedTemplate, values) {
  return getTemplateData({
    selectedTemplate,
    sections: ['profile', 'work', 'education', 'skills', 'projects', 'awards'],
    ...values
  }).texDoc
}

function asset(template, filename) {
  return fs.readFileSync(
    path.join(__dirname, `../public/templates/template${template}`, filename),
    'utf8'
  )
}

const work = [
  {
    company: 'Company',
    position: 'Engineer',
    location: 'City',
    startDate: 'Jan 2022',
    endDate: 'Present',
    highlights: ['Built office tools.']
  }
]
const skills = [
  {
    name: 'Practices',
    keywords: ['Office integrations', 'Technical mentoring']
  }
]

test('template 1 uses wrapping skill paragraphs and puts title before location and dates', () => {
  const tex = generate(1, { work, skills })
  assert.match(tex, /Practices: Office integrations, Technical mentoring\\par/)
  assert.doesNotMatch(tex, /\\begin\{tabular\}/)
  assert.match(
    tex,
    /\\textbf\{Company\}\\\\\s*\\textit\{Engineer\}, City \\hfill Jan 2022 - Present/
  )
})

test('template 2 removes contact icons and gives skills and project URLs full width', () => {
  const url = 'https://example.org/docs/getting-started'
  const tex = generate(2, {
    basics: {
      name: 'Elena García',
      email: 'elena@example.org',
      phone: '123',
      location: { address: 'City' },
      website: 'https://example.org'
    },
    skills,
    projects: [
      { name: 'Project', url, description: 'Efficient office tools.' }
    ],
    awards: [
      {
        title: 'Award',
        summary: 'For office tools.',
        awarder: 'Issuer',
        date: '2023'
      }
    ]
  })
  assert.doesNotMatch(tex, /\\fa(?:Envelope|Mobile|MapMarker|Link)/)
  assert.match(
    tex,
    /\\entrytitlestyle\{Practices:\} \\skill\{Office integrations, Technical mentoring\}\\par/
  )
  assert.match(
    tex,
    /\\cvproject\s*\{Project\}\s*\{\}\s*\{\\href\{https:\/\/example.org\/docs\/getting-started\}/
  )
  assert.match(
    tex,
    /\\cvhonor\s*\{Award\}\s*\{For office tools\.\}\s*\{Issuer\}\s*\{2023\}/
  )
  const cls = asset(2, 'awesome-cv.cls')
  assert.match(cls, /Ligatures=\{TeX,NoCommon\}/)
  const skill = cls.slice(
    cls.indexOf('\\newcommand*{\\skill}'),
    cls.indexOf('% For elements of subentry')
  )
  assert.doesNotMatch(skill, /\\textnormal/)
  assert.match(cls, /\\end\{tabular\*\}\s*\\par\\addvspace\{2mm\}/)
  const honors = cls.slice(
    cls.indexOf('\\newenvironment{cvhonors}'),
    cls.indexOf('% Define an environment for cvskill')
  )
  assert.doesNotMatch(honors, /tabular/)
  assert.match(honors, /\\begin\{minipage\}\{\\linewidth\}/)
  assert.match(honors, /\\honorlocationstyle\{#3\}\}\\par/)
  assert.match(honors, /\\honortitlestyle\{#2\}\}\\par/)
})

test('template 3 reserves a gap between bounded name and contact columns', () => {
  const tex = generate(3, {
    basics: { name: 'Elena García', email: 'elena@example.org' }
  })
  assert.match(
    tex,
    /\\parbox\[t\]\{0\.30\\textwidth\}\{\\textbf\{\\Large Elena García\}\}\\hfill/
  )
  assert.match(
    tex,
    /\\parbox\[t\]\{0\.67\\textwidth\}\{\\raggedleft\\textit\{elena@example.org\}\}/
  )
  assert.doesNotMatch(tex, /tabular\*\}\{7in\}/)
})

test('template 6 reduces heading tracking and draws job titles and project names before dates and URLs', () => {
  const sty = asset(6, 'minimal-resume.sty')
  assert.match(sty, /LetterSpace=2\]\{Montserrat-Bold\}/)
  const job = sty.slice(
    sty.indexOf('\\newcommand{\\job}'),
    sty.indexOf('\\newcommand{\\project}')
  )
  assert.ok(job.indexOf('#3') < job.indexOf('#2'))
  const project = sty.slice(
    sty.indexOf('\\newcommand{\\project}'),
    sty.indexOf('\\newcommand{\\award}')
  )
  assert.match(project, /#1\}[^\n]*#2\}\\par\s*[^\n]*#3/)
  const award = sty.slice(sty.indexOf('\\newcommand{\\award}'))
  assert.match(award, /#4\}\\par/)
  assert.match(
    generate(6, { work }),
    /\\job\s*\{Company\}\s*\{Jan 2022 – Present\}\s*\{Engineer\}/
  )
})

test('template 7 widens dates, uses a real bullet and contact labels, and prevents word hyphenation', () => {
  const tex = generate(7, {
    work,
    education: [{ institution: 'Universidad Politécnica de Madrid' }]
  })
  assert.match(tex, /\\setlength\{\\hintscolumnwidth\}\{3\.6cm\}/)
  assert.match(
    tex,
    /\\renewcommand\*\{\\labelitemi\}\{\\textcolor\{color1\}\{\\textbullet\}\}/
  )
  for (const [symbol, label] of [
    ['mobilephone', 'Phone'],
    ['email', 'Email'],
    ['homepage', 'Website']
  ]) {
    assert.ok(tex.includes(`\\renewcommand*{\\${symbol}symbol}{${label}:~}`))
  }
  assert.match(tex, /\\hyphenpenalty=10000/)
  assert.match(tex, /\\exhyphenpenalty=10000/)
})

for (const template of [1, 2, 3, 6, 7]) {
  test(`template ${template} handles empty and partial records without undefined text`, () => {
    const tex = generate(template, {
      basics: {},
      work: [{ position: 'Engineer', highlights: [] }],
      education: [{ institution: 'School' }],
      skills: [{ name: 'Tools' }],
      projects: [{ url: 'https://example.org' }],
      awards: [{ summary: 'Recognition' }]
    })
    assert.doesNotMatch(tex, /undefined|\bnull\b/)
    assert.ok(tex.includes('\\end{document}'))
    assert.doesNotMatch(
      tex,
      /\\begin\{(?:itemize|cvitems|newitemize)\}\s*\\end\{/
    )
  })
}
