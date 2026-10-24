export type Location = {
  address?: string
}

export type Basics = {
  name?: string
  email?: string
  phone?: string
  location?: Location

  // non-standard attribute
  website?: string
}

export type Work = {
  // non-standard attribute
  company?: string

  position?: string
  startDate?: string
  endDate?: string
  highlights: string[]

  // non-standard attribute
  location?: string
}

export type Education = {
  institution?: string
  area?: string
  studyType?: string
  startDate?: string
  endDate?: string
  score?: string

  // non-standard attribute
  location?: string
}

export type Award = {
  title?: string
  date?: string
  awarder?: string
  summary?: string
}

export type Skill = {
  name?: string
  keywords?: string[]
}

export type Project = {
  name?: string
  description?: string
  keywords?: string[]
  url?: string
}

// Based on the [JSON Resume](http://jsonresume.org/) standard with extensions
// added as needed
export type Resume = {
  basics?: Basics
  work?: Work[]
  education?: Education[]
  awards?: Award[]
  skills?: Skill[]
  projects?: Project[]
}

export type FormValues = Resume & {
  headings: { [K in keyof Resume]?: string }
  sections: (
    | 'profile'
    | 'education'
    | 'work'
    | 'skills'
    | 'projects'
    | 'awards'
  )[]
  selectedTemplate: number
}

export interface FormState {
  isGenerating: boolean
}

export type Generator = {
  resumeHeader: () => string
  profileSection: (basics?: Basics) => string
  educationSection: (education?: Array<Education>, heading?: string) => string
  workSection: (work?: Array<Work>, heading?: string) => string
  skillsSection: (skills?: Array<Skill>, heading?: string) => string
  projectsSection: (projects?: Array<Project>, heading?: string) => string
  awardsSection: (awards?: Array<Award>, heading?: string) => string
}

export type LaTeXOpts = {
  cmd: 'pdflatex' | 'xelatex'
  inputs?: string[]
  fonts?: string[]
  // Siglum bundles for packages the template loads indirectly. Without them
  // Siglum discovers each one with a full recompile.
  bundles?: string[]
  // Packages from public/latex-packages the template needs. Loading them
  // before compiling avoids one recompile per package on each page load.
  packages?: string[]
}

export type TemplateData = {
  texDoc: string
  opts: LaTeXOpts
}
