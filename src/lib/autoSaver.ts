export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface AutoSaverOptions {
  // Sends one serialized snapshot. Rejects when the save failed.
  save: (snapshot: string) => Promise<void>
  onStatus: (status: AutoSaveStatus) => void
  delay?: number
  retryDelays?: number[]
  statusResetDelay?: number
  // The value the server already holds. Without it, the first update is used.
  baseline?: string
}

// Debounces snapshot saves, runs one save at a time, and keeps unsaved work
// until it is saved. It outlives the component that created it, so a flush on
// unmount still finishes in the background.
export function createAutoSaver({
  save,
  onStatus,
  delay = 2000,
  retryDelays = [2000, 5000, 15000],
  statusResetDelay = 2000,
  baseline: initial
}: AutoSaverOptions) {
  let baseline: string | null = initial ?? null
  let lastSaved: string | null = initial ?? null
  let pending: string | null = null
  let saving: { snapshot: string; promise: Promise<void> } | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let resetTimer: ReturnType<typeof setTimeout> | undefined
  let failures = 0

  function setStatus(status: AutoSaveStatus) {
    clearTimeout(resetTimer)
    onStatus(status)
    if (status === 'saved')
      resetTimer = setTimeout(() => onStatus('idle'), statusResetDelay)
  }

  function schedule(wait: number) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      void run()
    }, wait)
  }

  async function run(): Promise<void> {
    if (saving || pending === null) return
    clearTimeout(timer)
    timer = undefined

    const snapshot = pending
    pending = null
    setStatus('saving')
    saving = { snapshot, promise: save(snapshot) }
    try {
      await saving.promise
      lastSaved = snapshot
      failures = 0
    } catch {
      // Keep the failed snapshot unless a newer edit replaced it.
      if (pending === null) pending = snapshot
      failures++
    } finally {
      saving = null
    }

    if (pending === null) return setStatus('saved')
    if (failures === 0) return timer ? setStatus('pending') : run()
    setStatus('error')
    if (failures <= retryDelays.length) schedule(retryDelays[failures - 1])
  }

  return {
    // Takes the latest snapshot. The first one is the loaded baseline.
    update(snapshot: string) {
      if (baseline === null) {
        baseline = lastSaved = snapshot
        return
      }
      // What the server holds once the running save, if any, finishes.
      const target = saving?.snapshot ?? lastSaved
      if (snapshot === (pending ?? target)) return
      failures = 0
      if (snapshot === target) {
        pending = null
        clearTimeout(timer)
        timer = undefined
        return setStatus(saving ? 'saving' : 'idle')
      }
      pending = snapshot
      setStatus('pending')
      schedule(delay)
    },

    // Drops a debounced snapshot that has not started saving.
    cancel() {
      if (pending === null) return
      pending = null
      clearTimeout(timer)
      timer = undefined
      if (!saving) setStatus('idle')
    },

    // Saves the pending snapshot now, after any save already running.
    async flush() {
      clearTimeout(timer)
      timer = undefined
      while (saving) await saving.promise.catch(() => {})
      await run()
    },

    // For page unload: sends the pending snapshot without waiting for a
    // running save, since the page may be gone before that save finishes.
    sendPending() {
      if (pending === null) return
      clearTimeout(timer)
      timer = undefined
      if (!saving) return void run()
      void save(pending).catch(() => {})
    },

    hasUnsavedChanges() {
      return pending !== null || saving !== null
    }
  }
}

export type AutoSaver = ReturnType<typeof createAutoSaver>
