import { atom } from 'jotai'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export const saveStateAtom = atom<SaveState>('idle')
