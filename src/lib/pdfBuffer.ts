const references = new Map<string, number>()
const retiring = new Set<string>()

// The atom owns the newest URL; mounted viewer buffers lease their URLs too.
export function retainPdfUrl(url: string) {
  if (url) references.set(url, (references.get(url) ?? 0) + 1)
}

export function releasePdfUrl(url: string) {
  const count = references.get(url)
  if (!count) return
  if (count > 1) {
    references.set(url, count - 1)
    return
  }
  references.delete(url)
  if (retiring.has(url)) return
  retiring.add(url)
  // React StrictMode can release and reacquire a lease in the same turn.
  queueMicrotask(() => {
    retiring.delete(url)
    if (!references.has(url) && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  })
}

export function hasPdfUrlViewers(url: string) {
  return (references.get(url) ?? 0) > 1
}

export function clampPdfPage(page: number, numPages: number) {
  return Math.max(1, Math.min(page, numPages))
}
