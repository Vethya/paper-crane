export type ReviewStatus = 'applied' | 'dismissed'

/** A saved tailoring result under review, and the resume it edits. */
export type ReviewTarget = {
  resumeId: string
  sessionId: string
  replyId: string
}

/**
 * A result counts as applied only when the user approved one of its edits,
 * so a result with no edits, or none approved, is dismissed.
 */
export const reviewStatus = (edits: { status: string }[]): ReviewStatus =>
  edits.some((e) => e.status === 'approved') ? 'applied' : 'dismissed'

const markRequest = (
  target: ReviewTarget,
  status: ReviewStatus
): [string, RequestInit] => [
  `/api/agent/sessions/${target.sessionId}`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replyId: target.replyId, pendingEdits: status })
  }
]

/** Records that a saved tailoring result was reviewed. Tries twice, and
 * resolves to whether the server accepted it. */
export async function markAgentEdits(
  target: ReviewTarget,
  status: ReviewStatus,
  send: typeof fetch = fetch
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await send(...markRequest(target, status))
      if (res.ok) return true
      console.error('[AgentOverlay] Mark edits failed:', res.status)
    } catch (err) {
      console.error('[AgentOverlay] Mark edits error:', err)
    }
  }
  return false
}

/** A single best-effort mark that can outlive the page as it unloads. */
export function sendAgentEditsMark(
  target: ReviewTarget,
  status: ReviewStatus,
  send: typeof fetch = fetch
) {
  const [url, init] = markRequest(target, status)
  send(url, { ...init, keepalive: true }).catch(() => {})
}
