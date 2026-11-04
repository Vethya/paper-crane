import { TEMPLATES } from '@/lib/templates/constants'

export const navItems = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#ats', label: 'Hiring filters' },
  { href: '#templates', label: 'Designs' }
]

export const howItWorksSteps = [
  {
    title: 'Fill in your details',
    description: 'Add your work history, education, skills, and more.'
  },
  {
    title: 'See it as you go',
    description: 'Your resume updates on screen while you type.'
  },
  {
    title: 'Download it',
    description: 'Get a PDF that’s ready to send.'
  }
]

// Unedited `pdftotext -layout` output from the PDF shown beside it, cut off
// after the Skills section.
export const atsExtractedText = `                                      Elena García
             Portland, OR · elena.garcia@example.com · +1 202-555-0147 · https://elena.example.com

Experience
  Cedar & Finch Labs
  Senior Software Engineer, Portland, OR                                                      Jan 2022 - Present
     • Built an efficient workflow for office approvals, reducing processing time by 35%.
     • Led API & platform delivery for 12 teams with 99.9% availability.

  Harbor Analytics
  Software Engineer, Seattle, WA                                                            Jun 2018 - Dec 2021
     • Automated financial reporting and improved data accuracy by 20%.
     • Shipped a self-service dashboard used by 400 analysts.

Education
  Cascadia University                                                                               Seattle, WA
  BSc Computer Science GPA: 3.8/4.0                                                         Sep 2014 - May 2018
Skills
  Engineering: TypeScript, Python, SQL, Testing & CI
  Delivery: API design, workflow automation, office systems`

export const templatePreviews = TEMPLATES.map((id) => ({
  id,
  src: `/templates/previews/template${id}.png`
}))
