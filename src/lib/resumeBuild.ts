import type { PendingEdit } from '../atoms/agentEdits'
import type { FormValues } from '../types'

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
) {
  const parts = path.split('.')
  let target: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    const idx = Number(key)
    const next =
      !isNaN(idx) && Array.isArray(target) ? target[idx] : target[key]
    target = next as Record<string, unknown>
    if (target == null) return
  }
  target[parts[parts.length - 1]] = value
}

function applyPendingEdits(formValues: FormValues, edits: PendingEdit[]) {
  const vals = formValues as Record<string, unknown>

  for (const edit of edits) {
    if (edit.status !== 'pending') continue

    if (edit.type === 'set') {
      setNestedValue(vals, edit.fieldPath, edit.newValue)
    } else if (edit.type === 'append') {
      const arr = (vals[edit.arrayPath] ?? []) as Record<string, unknown>[]
      const existing = arr.find((e) => e._agentEditId === edit.id)
      if (existing) {
        Object.assign(existing, edit.entry)
      } else {
        arr.push(structuredClone(edit.entry))
        vals[edit.arrayPath] = arr
      }
    }
  }

  // Apply removes last so indices stay valid during set/append passes
  const removeMap = new Map<string, Set<number>>()
  for (const edit of edits) {
    if (edit.type === 'remove' && edit.status === 'pending') {
      if (!removeMap.has(edit.arrayPath))
        removeMap.set(edit.arrayPath, new Set())
      removeMap.get(edit.arrayPath)!.add(edit.entryIndex)
    }
  }
  for (const [arrayPath, indices] of removeMap) {
    const current = (vals[arrayPath] ?? []) as unknown[]
    vals[arrayPath] = current.filter((_, i) => !indices.has(i))
  }
}

const ARRAY_PATHS = [
  'work',
  'education',
  'skills',
  'projects',
  'awards'
] as const

function stripAgentMarkers(formValues: FormValues) {
  const vals = formValues as Record<string, unknown>
  for (const key of ARRAY_PATHS) {
    const arr = vals[key]
    if (!Array.isArray(arr)) continue
    for (const entry of arr) {
      if (entry && typeof entry === 'object')
        delete (entry as Record<string, unknown>)._agentEditId
    }
  }
}

// Use the same effective data for compilation and preview freshness.
export function prepareResumeBuild(
  formValues: FormValues,
  edits: PendingEdit[] = []
): FormValues {
  const payload = structuredClone(formValues)
  applyPendingEdits(payload, edits)
  stripAgentMarkers(payload)
  return payload
}
