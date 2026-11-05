// Identifies who sent a content save: one id per page load, and a revision
// that grows with each snapshot in that page. The server uses it to ignore a
// save that arrives after a newer one from the same page.
export interface ContentWriter {
  id: string
  revision: number
}

export function parseWriter(value: unknown): ContentWriter | null {
  if (!value || typeof value !== 'object') return null
  const { id, revision } = value as Record<string, unknown>
  if (typeof id !== 'string' || id.length === 0 || id.length > 64) return null
  if (!Number.isSafeInteger(revision) || (revision as number) < 1) return null
  return { id, revision: revision as number }
}

// Matches a resume unless its last content save came from the same page with
// the same or a newer revision. Saves from other pages are not ordered.
export function newerWriteFilter(writer: ContentWriter) {
  return {
    $or: [
      { 'contentWriter.id': { $ne: writer.id } },
      { 'contentWriter.revision': { $lt: writer.revision } }
    ]
  }
}
