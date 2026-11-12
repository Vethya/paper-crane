import { atom } from 'jotai'
import type { AutoSaveStatus } from '@/lib/autoSaver'

export type SaveState = AutoSaveStatus

export const saveStateAtom = atom<SaveState>('idle')
