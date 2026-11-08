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
