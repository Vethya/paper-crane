import { atom, type SetStateAction } from 'jotai'
import { formDataAtom } from './formData'

export interface Resume {
  url: string
  isLoading: boolean
  isError: boolean
}

const baseResumeAtom = atom<Resume>({
  url: '',
  isLoading: false,
  isError: false
})

// Each compile creates a new blob URL; revoke the replaced one so old PDFs
// don't stay in memory for the rest of the session.
export const resumeAtom = atom(
  (get) => get(baseResumeAtom),
  (get, set, update: SetStateAction<Resume>) => {
    const previous = get(baseResumeAtom)
    const next = typeof update === 'function' ? update(previous) : update
    if (previous.url !== next.url && previous.url.startsWith('blob:')) {
      URL.revokeObjectURL(previous.url)
    }
    set(baseResumeAtom, next)
  }
)

resumeAtom.debugLabel = 'resumeAtom'

export const isLoadingResumeAtom = atom(false)
isLoadingResumeAtom.debugLabel = 'isLoadingResumeAtom'

// The form data the current PDF was built from, so the UI can tell when the
// preview no longer matches the form.
export const builtFormDataAtom = atom<string | null>(null)
builtFormDataAtom.debugLabel = 'builtFormDataAtom'

export const markBuiltAtom = atom(null, (get, set) => {
  set(builtFormDataAtom, JSON.stringify(get(formDataAtom)))
})

export const isPreviewStaleAtom = atom((get) => {
  const built = get(builtFormDataAtom)
  const data = get(formDataAtom)
  return built !== null && data !== null && JSON.stringify(data) !== built
})
isPreviewStaleAtom.debugLabel = 'isPreviewStaleAtom'

export const resumeTitleAtom = atom('')
resumeTitleAtom.debugLabel = 'resumeTitleAtom'
