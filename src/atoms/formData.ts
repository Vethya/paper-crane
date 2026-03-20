import { atom } from 'jotai'
import type { FormValues } from '@/types'

export const formDataAtom = atom<FormValues | null>(null)

formDataAtom.debugLabel = 'formDataAtom'
