import { atom } from 'jotai'

export type FieldEdit = {
  id: string
  type: 'set'
  fieldPath: string
  originalValue: string | string[] | undefined
  newValue: string | string[]
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export type NewEntryEdit = {
  id: string
  type: 'append'
  arrayPath: 'work' | 'education' | 'skills' | 'projects' | 'awards'
  entryIndex: number
  entry: Record<string, unknown>
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export type RemoveEntryEdit = {
  id: string
  type: 'remove'
  arrayPath: 'work' | 'education' | 'skills' | 'projects' | 'awards'
  entryIndex: number
  entry: Record<string, unknown>
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export type PendingEdit = FieldEdit | NewEntryEdit | RemoveEntryEdit

export const agentPendingEditsAtom = atom<PendingEdit[]>([])
agentPendingEditsAtom.debugLabel = 'agentPendingEditsAtom'

export const agentEditSummaryAtom = atom<string>('')
agentEditSummaryAtom.debugLabel = 'agentEditSummaryAtom'

// Tracks which pending edit the user is currently reviewing
export const agentFocusedEditIdAtom = atom<string | null>(null)
agentFocusedEditIdAtom.debugLabel = 'agentFocusedEditIdAtom'
