import { atom } from 'jotai'
import type { ResumeComponentType } from '@/lib/resumeComponents'

export const componentInsertFocusAtom = atom<{
  type: ResumeComponentType
  index: number
  nonce: number
} | null>(null)
