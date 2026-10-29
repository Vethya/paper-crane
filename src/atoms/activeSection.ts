import { atom } from 'jotai'

// Stores the setActiveSection callback registered by GeneratorContent.
// Same pattern as formSetValueAtom — lets the agent navigate sections from outside the component tree.
export const activeSectionSetterAtom = atom<((section: string) => void) | null>(
  null
)
