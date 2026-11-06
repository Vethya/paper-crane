export const AGENT_LIMITS = {
  resume: 64_000,
  message: 32_000,
  context: 128_000
}
// Count Unicode code points, including emoji, identically in the browser and server.
export const characterCount = (text: string) => Array.from(text).length
export function resumeSize(resume: object) {
  try {
    return characterCount(JSON.stringify(resume))
  } catch {
    return Infinity
  }
}
type Message = { role: 'user' | 'assistant'; content: string; error?: boolean }
export const contextSize = (resume: object, messages: Message[]) =>
  resumeSize(resume) +
  messages.reduce((n, m) => n + characterCount(m.content), 0)
export const editLimitMessage =
  'Editing reached its length limit. No changes applied. Try one section at a time.'

export function prepareAgentMessages(resume: object, history: Message[]) {
  const turns: Message[][] = []
  for (const message of history) {
    if (message.error || !message.content) continue
    if (message.role === 'user') turns.push([])
    turns.at(-1)?.push({ role: message.role, content: message.content })
  }
  let trimmed = false
  while (
    turns.length > 1 &&
    (contextSize(resume, turns.flat()) > AGENT_LIMITS.context ||
      turns
        .flat()
        .some((m) => characterCount(m.content) > AGENT_LIMITS.message))
  ) {
    turns.shift()
    trimmed = true
  }
  return { messages: turns.flat(), trimmed }
}

export function agentWarnings(
  resume: object,
  history: Message[],
  draft: string
) {
  const current = characterCount(draft.trim())
  const size = resumeSize(resume)
  const prepared = prepareAgentMessages(resume, [
    ...history,
    { role: 'user', content: draft.trim() }
  ])
  const context = contextSize(resume, history) + current
  const warnings: string[] = []
  const format = (n: number) => n.toLocaleString('en-US')
  const blocked = size > AGENT_LIMITS.resume || current > AGENT_LIMITS.message
  for (const [label, count, limit] of [
    ['Resume', size, AGENT_LIMITS.resume],
    ['Message', current, AGENT_LIMITS.message]
  ] as const) {
    if (count >= limit * 0.8)
      warnings.push(
        `${label}: ${format(count)} / ${format(limit)} characters. ` +
          (count > limit
            ? `Remove ${format(count - limit)} characters to send.`
            : `${format(limit - count)} characters remaining.`)
      )
  }
  if (prepared.trimmed)
    warnings.push(
      'Earlier messages are no longer sent to the AI. Your saved chat is intact.'
    )
  else if (context >= AGENT_LIMITS.context * 0.8)
    warnings.push(
      'This conversation is getting long. Older messages may soon be left out of what the AI remembers.'
    )
  return { warnings, blocked }
}
