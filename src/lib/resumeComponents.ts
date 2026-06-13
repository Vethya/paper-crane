import type { Award, Education, Project, Skill, Work } from '@/types'

export const componentTypes = [
  'education',
  'work',
  'skills',
  'projects',
  'awards'
] as const

export type ResumeComponentType = (typeof componentTypes)[number]

export type ResumeComponentContentMap = {
  education: Education
  work: Work
  skills: Skill
  projects: Project
  awards: Award
}

export type ResumeComponentContent =
  ResumeComponentContentMap[ResumeComponentType]

export type ResumeComponent<
  T extends ResumeComponentType = ResumeComponentType
> = {
  _id: string
  userId?: string
  type: T
  content: ResumeComponentContentMap[T]
  createdAt?: string
  updatedAt?: string
}

export const componentMeta: Record<
  ResumeComponentType,
  {
    label: string
    pluralLabel: string
    newLabel: string
    fallbackTitle: string
    requiredField: string
    requiredFieldLabel: string
    sectionTitle: string
  }
> = {
  education: {
    label: 'School',
    pluralLabel: 'Schools',
    newLabel: 'New School',
    fallbackTitle: 'Untitled school',
    requiredField: 'institution',
    requiredFieldLabel: 'School name',
    sectionTitle: 'Education'
  },
  work: {
    label: 'Work Experience',
    pluralLabel: 'Work',
    newLabel: 'New Work Experience',
    fallbackTitle: 'Untitled work experience',
    requiredField: 'company',
    requiredFieldLabel: 'Company name',
    sectionTitle: 'Work Experience'
  },
  skills: {
    label: 'Skill',
    pluralLabel: 'Skills',
    newLabel: 'New Skill',
    fallbackTitle: 'Untitled skill',
    requiredField: 'name',
    requiredFieldLabel: 'Skill name',
    sectionTitle: 'Skills'
  },
  projects: {
    label: 'Project',
    pluralLabel: 'Projects',
    newLabel: 'New Project',
    fallbackTitle: 'Untitled project',
    requiredField: 'name',
    requiredFieldLabel: 'Project Name',
    sectionTitle: 'Projects'
  },
  awards: {
    label: 'Award',
    pluralLabel: 'Awards',
    newLabel: 'New Award',
    fallbackTitle: 'Untitled award',
    requiredField: 'title',
    requiredFieldLabel: 'Award Name',
    sectionTitle: 'Awards'
  }
}

export function isComponentType(value: unknown): value is ResumeComponentType {
  return (
    typeof value === 'string' &&
    componentTypes.includes(value as ResumeComponentType)
  )
}

export function getEmptyComponentContent<T extends ResumeComponentType>(
  type: T
): ResumeComponentContentMap[T] {
  const content = {
    education: {
      institution: '',
      location: '',
      area: '',
      studyType: '',
      score: '',
      startDate: '',
      endDate: ''
    },
    work: {
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      highlights: []
    },
    skills: {
      name: '',
      keywords: []
    },
    projects: {
      name: '',
      description: '',
      keywords: [],
      url: ''
    },
    awards: {
      title: '',
      date: '',
      awarder: '',
      summary: ''
    }
  } satisfies ResumeComponentContentMap

  return structuredClone(content[type])
}

function normalizeString(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeMeaningful(value: unknown): unknown {
  if (typeof value === 'string') {
    const normalized = normalizeString(value)
    return normalized || undefined
  }

  if (Array.isArray(value)) {
    const items = value
      .map(normalizeMeaningful)
      .filter((item) => item !== undefined)
    return items.length ? items : undefined
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(
        ([key, entryValue]) => [key, normalizeMeaningful(entryValue)] as const
      )
      .filter(([, entryValue]) => entryValue !== undefined)

    if (!entries.length) return undefined
    return Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)))
  }

  return value ?? undefined
}

export function getComponentFingerprint(
  type: ResumeComponentType,
  content: unknown
) {
  return JSON.stringify({ type, content: normalizeMeaningful(content) ?? {} })
}

export function getRequiredValue(
  type: ResumeComponentType,
  content: Record<string, unknown>
) {
  const value = content[componentMeta[type].requiredField]
  return typeof value === 'string' ? value.trim() : ''
}

export function validateComponentContent(
  type: ResumeComponentType,
  content: unknown
) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return `${componentMeta[type].label} content is required`
  }

  if (!getRequiredValue(type, content as Record<string, unknown>)) {
    return `${componentMeta[type].label} requires ${componentMeta[type].requiredFieldLabel}`
  }

  return null
}

function dateRange(start?: string, end?: string) {
  return [start, end].filter(Boolean).join(' - ')
}

export function getComponentTitle(
  type: ResumeComponentType,
  content: ResumeComponentContent
) {
  const record = content as Record<string, unknown>
  const required = record[componentMeta[type].requiredField]
  return typeof required === 'string' && required.trim()
    ? required.trim()
    : componentMeta[type].fallbackTitle
}

export function getComponentPreview(
  type: ResumeComponentType,
  content: ResumeComponentContent
) {
  if (type === 'education') {
    const item = content as Education
    return [
      item.studyType,
      item.area,
      item.location,
      dateRange(item.startDate, item.endDate),
      item.score && `GPA ${item.score}`
    ]
      .filter(Boolean)
      .join(' · ')
  }

  if (type === 'work') {
    const item = content as Work
    return [
      item.position,
      item.location,
      dateRange(item.startDate, item.endDate),
      ...(item.highlights ?? []).slice(0, 2)
    ]
      .filter(Boolean)
      .join(' · ')
  }

  if (type === 'skills') {
    return ((content as Skill).keywords ?? []).filter(Boolean).join(', ')
  }

  if (type === 'projects') {
    const item = content as Project
    return [item.description, ...(item.keywords ?? []), item.url]
      .filter(Boolean)
      .join(' · ')
  }

  const item = content as Award
  return [item.awarder, item.date, item.summary].filter(Boolean).join(' · ')
}

export function componentMatchesSearch(
  component: ResumeComponent,
  query: string
) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  const haystack = [
    getComponentTitle(component.type, component.content),
    getComponentPreview(component.type, component.content),
    JSON.stringify(component.content)
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(needle)
}
