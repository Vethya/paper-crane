import type { FormValues } from '../types'

export type SectionId = FormValues['sections'][number]

export const DEFAULT_SECTIONS: SectionId[] = [
  'profile',
  'education',
  'work',
  'skills',
  'projects',
  'awards'
]

export const SECTION_LABELS: Record<SectionId, string> = {
  profile: 'Profile',
  education: 'Education',
  work: 'Work Experience',
  skills: 'Skills',
  projects: 'Projects',
  awards: 'Awards'
}

// The form calls the profile section "basics"; the others share their id.
export function navSection(section: SectionId) {
  return section === 'profile' ? 'basics' : section
}

/**
 * Returns every section once, with Profile first because it holds the
 * name and contact header. Unknown ids are dropped and missing ones are
 * added at the end, so older resumes never lose a section.
 */
export function normalizeSections(
  sections?: readonly string[] | null
): SectionId[] {
  const known = new Set<string>(DEFAULT_SECTIONS)
  const order = new Set<SectionId>()
  for (const section of sections ?? [])
    if (known.has(section)) order.add(section as SectionId)
  for (const section of DEFAULT_SECTIONS) order.add(section)
  order.delete('profile')
  return ['profile', ...Array.from(order)]
}

/** The sections a user can reorder: all but Profile. */
export function movableSections(sections?: readonly string[] | null) {
  return normalizeSections(sections).slice(1)
}

/**
 * Moves `section` so it lands before the movable section now at `toIndex`
 * (`toIndex` equal to the list length means the end).
 */
export function moveSection(
  sections: readonly string[] | null | undefined,
  section: SectionId,
  toIndex: number
): SectionId[] {
  const movable = movableSections(sections)
  const from = movable.indexOf(section)
  if (from === -1) return normalizeSections(sections)
  movable.splice(from, 1)
  const target = Math.max(
    0,
    Math.min(from < toIndex ? toIndex - 1 : toIndex, movable.length)
  )
  movable.splice(target, 0, section)
  return ['profile', ...movable]
}
