/** Edit operations as the tailoring model returns them. */
export type ModelEdit =
  | {
      type: 'set'
      fieldPath: string
      newValue: string | string[]
      reason: string
    }
  | {
      type: 'append'
      arrayPath: string
      entry: Record<string, unknown>
      reason: string
    }
  | { type: 'appendSkill'; name: string; keywords: string[]; reason: string }
  | { type: 'remove'; arrayPath: string; index: number; reason: string }

/** A model edit plus what it replaces, so a later review can spot conflicts. */
export type StoredEdit = ModelEdit & {
  originalValue?: string | string[]
  entry?: Record<string, unknown>
}

export type StoredTailoring = {
  summary: string
  edits: StoredEdit[]
  status: 'ready' | 'applied' | 'dismissed'
}

export function getValueAtPath(
  data: unknown,
  path: string
): string | string[] | undefined {
  let current: unknown = data
  for (const part of path.split('.')) {
    if (current == null) return undefined
    const index = Number(part)
    current =
      !isNaN(index) && Array.isArray(current)
        ? current[index]
        : (current as Record<string, unknown>)[part]
  }
  if (typeof current === 'string') return current
  if (Array.isArray(current) && current.every((v) => typeof v === 'string'))
    return current as string[]
  return undefined
}

export const tailoringDoneMessage = (summary: string) =>
  `Done! ${summary} Review the highlighted changes in the form, then approve or reject each one.`

/** Records the values each edit replaces in the resume the model was given. */
export function toStoredEdits(
  resume: Record<string, unknown>,
  edits: ModelEdit[]
): StoredEdit[] {
  return edits.map((edit) => {
    if (edit.type === 'set')
      return { ...edit, originalValue: getValueAtPath(resume, edit.fieldPath) }
    if (edit.type === 'remove') {
      const list = resume[edit.arrayPath]
      const entry = Array.isArray(list) ? list[edit.index] : undefined
      return { ...edit, entry: (entry ?? {}) as Record<string, unknown> }
    }
    return edit
  })
}
