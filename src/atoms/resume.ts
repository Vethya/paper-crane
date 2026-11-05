import { atom, type SetStateAction } from 'jotai'
import { formDataAtom } from './formData'
import { agentPendingEditsAtom } from './agentEdits'
import { prepareResumeBuild } from '../lib/resumeBuild'
import { retainPdfUrl, releasePdfUrl } from '../lib/pdfBuffer'
import type { FormValues } from '../types'

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

// Transfer the atom's URL lease. Preview leases keep mounted PDFs alive.
export const resumeAtom = atom(
  (get) => get(baseResumeAtom),
  (get, set, update: SetStateAction<Resume>) => {
    const previous = get(baseResumeAtom)
    const next = typeof update === 'function' ? update(previous) : update
    if (previous.url !== next.url) {
      retainPdfUrl(next.url)
      releasePdfUrl(previous.url)
    }
    set(baseResumeAtom, next)
  }
)

resumeAtom.debugLabel = 'resumeAtom'

export const isLoadingResumeAtom = atom(false)
isLoadingResumeAtom.debugLabel = 'isLoadingResumeAtom'

// The resume whose server copy is in formDataAtom. Until it matches the open
// resume, formDataAtom may still hold an earlier visit's form.
export const loadedResumeIdAtom = atom<string | null>(null)
loadedResumeIdAtom.debugLabel = 'loadedResumeIdAtom'

const autoRenderPreferenceAtom = atom(true)
autoRenderPreferenceAtom.onMount = (set) => {
  try {
    set(localStorage.getItem('autoRender') !== '0')
  } catch {
    // Storage may be unavailable; keep the default.
  }
}
export const autoRenderAtom = atom(
  (get) => get(autoRenderPreferenceAtom),
  (_get, set, enabled: boolean) => {
    set(autoRenderPreferenceAtom, enabled)
    try {
      localStorage.setItem('autoRender', enabled ? '1' : '0')
    } catch {
      // Keep the preference reactive even without storage.
    }
  }
)

// The form data the current PDF was built from, so the UI can tell when the
// preview no longer matches the form.
export const builtFormDataAtom = atom<string | null>(null)
builtFormDataAtom.debugLabel = 'builtFormDataAtom'

export const markBuiltAtom = atom(null, (_get, set, payload: FormValues) => {
  set(builtFormDataAtom, JSON.stringify(payload))
})

export const isPreviewStaleAtom = atom((get) => {
  const built = get(builtFormDataAtom)
  const data = get(formDataAtom)
  if (built === null || data === null) return false
  const payload = prepareResumeBuild(data, get(agentPendingEditsAtom))
  return JSON.stringify(payload) !== built
})
isPreviewStaleAtom.debugLabel = 'isPreviewStaleAtom'

export const resumeTitleAtom = atom('')
resumeTitleAtom.debugLabel = 'resumeTitleAtom'
