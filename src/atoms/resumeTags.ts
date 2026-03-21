import { atom } from 'jotai'

export const resumeTagsAtom = atom<string[]>([])

resumeTagsAtom.debugLabel = 'resumeTagsAtom'
