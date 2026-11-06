// A local copy of resume edits the server has not confirmed yet. It lets the
// generator offer the edits back after a failed save, a crash, or a closed tab.

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
// Returns the storage to use. Reading `window.localStorage` itself can throw
// when the browser blocks site data, so it is read inside each guard.
type GetStorage = () => DraftStorage

export const browserStorage: GetStorage = () => window.localStorage

export interface LocalDraft {
  content: string
  savedAt: number
}

export interface Recovery {
  content: string
  savedAt: number
  // True when the server copy changed after the draft, e.g. on another device.
  serverIsNewer: boolean
}

const key = (resumeId: string) => `autosave:${resumeId}`

// Serializes with sorted keys and without undefined values, so two equal
// resumes compare equal whatever order their fields were set in.
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_, inner) =>
    inner && typeof inner === 'object' && !Array.isArray(inner)
      ? Object.fromEntries(
          Object.entries(inner).sort(([a], [b]) => (a < b ? -1 : 1))
        )
      : inner
  )
}

// Storage can be missing or throw (private mode, quota), so every access is guarded.
export function readDraft(storage: GetStorage, resumeId: string) {
  try {
    const draft = JSON.parse(storage().getItem(key(resumeId)) ?? 'null')
    if (typeof draft?.content === 'string' && typeof draft.savedAt === 'number')
      return draft as LocalDraft
  } catch {}
  return null
}

export function writeDraft(
  storage: GetStorage,
  resumeId: string,
  content: string,
  now = Date.now()
) {
  try {
    storage().setItem(key(resumeId), JSON.stringify({ content, savedAt: now }))
  } catch {}
}

// Removes the draft. With `content`, removes it only if it still holds that
// content, so a save of older content keeps a newer draft.
export function clearDraft(
  storage: GetStorage,
  resumeId: string,
  content?: string
) {
  try {
    if (
      content === undefined ||
      readDraft(storage, resumeId)?.content === content
    )
      storage().removeItem(key(resumeId))
  } catch {}
}

// Decides whether to offer the draft back for the resume the server returned.
export function findRecovery(
  draft: LocalDraft | null,
  serverContent: unknown,
  serverUpdatedAt?: string
): Recovery | null {
  if (!draft) return null
  let draftContent: unknown
  try {
    draftContent = JSON.parse(draft.content)
  } catch {
    return null
  }
  if (stableStringify(draftContent) === stableStringify(serverContent))
    return null
  const serverTime = Date.parse(serverUpdatedAt ?? '')
  return {
    content: draft.content,
    savedAt: draft.savedAt,
    serverIsNewer: Number.isFinite(serverTime) && serverTime > draft.savedAt
  }
}
