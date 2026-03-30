import { atom } from 'jotai'
import type { UseFormSetValue } from 'react-hook-form'
import type { FormValues } from '@/types'

export const formDataAtom = atom<FormValues | null>(null)
formDataAtom.debugLabel = 'formDataAtom'

export const formSetValueAtom = atom<UseFormSetValue<FormValues> | null>(null)
formSetValueAtom.debugLabel = 'formSetValueAtom'
