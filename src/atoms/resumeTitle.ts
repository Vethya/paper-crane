import { atom } from 'jotai'

export const resumeTitleAtom = atom<string | null>(null)

resumeTitleAtom.debugLabel = 'resumeTitleAtom'
