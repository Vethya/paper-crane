/**
 * A result counts as applied only when the user approved one of its edits,
 * so a result with no edits, or none approved, is dismissed.
 */
export const reviewStatus = (edits: { status: string }[]) =>
  edits.some((e) => e.status === 'approved') ? 'applied' : 'dismissed'

/** Records that saved tailoring results were reviewed. */
export const markAgentEdits = (
  id: string,
  replyId: string,
  status: 'applied' | 'dismissed'
) =>
  fetch(`/api/agent/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replyId, pendingEdits: status })
  }).catch((err) => console.error('[AgentOverlay] Mark edits error:', err))
